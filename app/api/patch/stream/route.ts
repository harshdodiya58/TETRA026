import { TelemetryBus, encodeSSE, type TelemetryEvent } from "@/lib/telemetry/bus";
import { generatePatch, PatchError } from "@/lib/patch/generate";
import { isGenerationConfigured, generationChain } from "@/lib/ai/generate";
import { lexiconSize } from "@/lib/obe/bloom";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { GapReport } from "@/lib/gap/score";
import type { SyllabusStructure } from "@/lib/syllabus/chunk";

export const runtime = "nodejs";

/**
 * generatePatch works to a 42s internal budget and stops while there is still
 * time to serialise a reply, so this ceiling is never actually reached. If your
 * Vercel plan caps functions below 60s, lower DEFAULT_BUDGET_MS in
 * lib/patch/generate.ts to match — the internal budget must stay under the
 * platform limit, not the other way round.
 */
export const maxDuration = 60;

/**
 * Streams patch generation. Separate from the audit endpoint because the brief
 * makes this an explicit user action — and because generation is the expensive
 * step, which should not fire on every upload.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Sign in to generate a patch." }, { status: 401 });
    }
  }

  let structure: SyllabusStructure;
  let gap: GapReport;

  try {
    const body = (await request.json()) as { structure?: SyllabusStructure; gap?: GapReport };
    if (!body.structure || !body.gap) {
      return Response.json({ error: "structure and gap are required." }, { status: 400 });
    }
    structure = body.structure;
    gap = body.gap;
  } catch {
    return Response.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (!isGenerationConfigured()) {
    return Response.json(
      { error: "No generation provider is configured." },
      { status: 503 },
    );
  }

  const bus = new TelemetryBus();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TelemetryEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          // Client disconnected.
        }
      };
      const unsubscribe = bus.subscribe(send);

      try {
        await runPatch(bus, structure, gap);
      } catch (error) {
        bus.emit({
          kind: "fatal",
          message:
            error instanceof PatchError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Patch generation failed unexpectedly.",
        });
      } finally {
        unsubscribe();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function runPatch(bus: TelemetryBus, structure: SyllabusStructure, gap: GapReport) {
  const patch = await bus.span("llm", async (sink) => {
    const chain = generationChain();
    sink.metric("chain", chain.map((p) => p.label).join(" → "));

    const result = await generatePatch(structure, gap, (correction) => sink.note(correction));

    sink.metric("model", result.model);
    sink.metric("provider", result.provider);
    if (result.ttftMs !== null) sink.metric("TTFT", result.ttftMs, "ms");
    sink.metric("generation", result.totalMs, "ms");
    sink.metric("drafts", result.attempts);
    sink.metric("additions", result.additions.length);

    return result;
  });

  await bus.span("bloom", async (sink) => {
    sink.metric("lexicon", lexiconSize(), "verbs");
    sink.metric("outcomes", patch.outcomes.length);

    const passed = patch.outcomes.filter((o) => o.bloom.passed);
    sink.metric("passed", `${passed.length}/${patch.outcomes.length}`);

    const levels = passed
      .map((o) => o.bloom.level)
      .filter((l): l is NonNullable<typeof l> => l !== null);
    if (levels.length > 0) {
      sink.metric("levels", `L${Math.min(...levels)}–L${Math.max(...levels)}`);
    }

    const poCount = new Set(patch.outcomes.flatMap((o) => o.programOutcomes.map((p) => p.po))).size;
    sink.metric("POs mapped", poCount);

    for (const failure of patch.outcomes.filter((o) => !o.bloom.passed)) {
      sink.note(failure.bloom.reason ?? "Outcome failed Bloom's validation.");
    }
  });

  await bus.span("cap", async (sink) => {
    sink.metric("course hours", patch.totalHours, "h");
    sink.metric("budget", patch.hoursBudget, "h");
    sink.metric("proposed", patch.hoursUsed, "h");
    sink.metric(
      "utilisation",
      ((patch.hoursUsed / patch.hoursBudget) * 100).toFixed(1),
      "% of budget",
    );
    sink.metric("verdict", patch.withinCap ? "WITHIN 15%" : "OVER BUDGET");

    if (!patch.withinCap) {
      sink.note(
        `Patch exceeds the fast-track ceiling by ${(patch.hoursUsed - patch.hoursBudget).toFixed(2)} h after ${patch.attempts} drafts. It must not be tabled as a fast-track amendment in this form.`,
      );
    }
  });

  bus.emit({ kind: "result", payload: patch });
}

import { TelemetryBus, encodeSSE, type TelemetryEvent } from "@/lib/telemetry/bus";
import { ParseError, parseSyllabus } from "@/lib/syllabus/parse";
import { chunkSyllabus, type SyllabusStructure } from "@/lib/syllabus/chunk";
import { embedBatch, isNimConfigured, EMBEDDING_DIM } from "@/lib/ai/nim";
import { corpusMeta } from "@/lib/gap/corpus";
import { buildSimilarityMatrix } from "@/lib/gap/similarity";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyseGap, type GapReport } from "@/lib/gap/score";
import { checkConnectivity, neo4jConfigProblem } from "@/lib/graph/neo4j";
import { traverseSkillGraph } from "@/lib/graph/traverse";
import { MARKETS, type MarketId } from "@/data/job-market";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

/**
 * A full audit measures ~2s. 30s leaves generous headroom for a cold start plus
 * a slow embedding call, while staying inside the ceiling on Vercel's free
 * plan — a function killed at its limit cannot respond at all, so the budget is
 * set below the platform limit rather than at it.
 */
export const maxDuration = 30;

/** nv-embedqa-e5-v5 accepts ~512 tokens; truncate rather than let it 400. */
const MAX_EMBED_CHARS = 1800;

/**
 * Streams the audit pipeline as Server-Sent Events.
 *
 * POST rather than GET because the syllabus is uploaded with the request, so
 * the client reads the stream with fetch + a ReadableStream reader instead of
 * EventSource. One-way server→client, no extra infrastructure.
 */
export async function POST(request: Request) {
  // This endpoint spends NVIDIA NIM credits on every call, so it must not be
  // reachable anonymously. proxy.ts guards the /audit page but deliberately
  // does not cover /api, so the check belongs here.
  let supabase: SupabaseClient | null = null;

  if (isSupabaseConfigured) {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Sign in to run an audit." }, { status: 401 });
    }
  }

  let file: File;
  let market: MarketId = "bengaluru";

  try {
    const form = await request.formData();
    const candidate = form.get("file");
    if (!(candidate instanceof File)) {
      return Response.json({ error: "No file supplied." }, { status: 400 });
    }
    file = candidate;

    const requested = form.get("market");
    if (typeof requested === "string" && (MARKETS as readonly string[]).includes(requested)) {
      market = requested as MarketId;
    }
  } catch {
    return Response.json({ error: "Malformed upload." }, { status: 400 });
  }

  const bus = new TelemetryBus();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TelemetryEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          // Client disconnected mid-audit; nothing to recover.
        }
      };

      const unsubscribe = bus.subscribe(send);

      try {
        await runAudit(bus, file, market, supabase);
      } catch (error) {
        bus.emit({
          kind: "fatal",
          message:
            error instanceof ParseError
              ? error.message
              : error instanceof Error
                ? error.message
                : "The audit failed unexpectedly.",
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
      // Stops nginx-style proxies buffering the stream into one blob.
      "X-Accel-Buffering": "no",
    },
  });
}

async function runAudit(
  bus: TelemetryBus,
  file: File,
  market: MarketId,
  supabase: SupabaseClient | null,
) {
  const parsed = await bus.span("parse", async (sink) => {
    const document = await parseSyllabus(file);
    sink.metric("file", file.name);
    sink.metric("format", document.kind);
    if (document.pages !== null) sink.metric("pages", document.pages);
    sink.metric("characters", document.characters);
    return document;
  });

  const structure = await bus.span("chunk", async (sink) => {
    const result = chunkSyllabus(parsed.text);

    sink.metric("units", result.units.length);
    sink.metric("sub-topics", result.units.reduce((n, u) => n + u.topics.length, 0));
    sink.metric("course outcomes", result.courseOutcomes.length);
    sink.metric("textbooks", result.textbooks.length);

    if (result.summedUnitHours !== null) {
      sink.metric("lecture hours", result.summedUnitHours, "h");
    }
    sink.metric("boundary confidence", result.boundaryConfidence.toFixed(2));

    if (result.units.length === 0) {
      sink.note("No unit headings matched. Check the document uses UNIT or MODULE headings.");
    }
    if (
      result.declaredTotalHours !== null &&
      result.summedUnitHours !== null &&
      Math.abs(result.declaredTotalHours - result.summedUnitHours) > 2
    ) {
      sink.note(
        `Declared total (${result.declaredTotalHours} h) disagrees with summed unit hours (${result.summedUnitHours} h).`,
      );
    }

    return result;
  });

  const gap = await runGapAnalysis(bus, structure, market, supabase);
  const graph = await runGraphTraversal(bus, gap);

  // Run on demand from /api/patch/stream, not as part of an audit.
  bus.skip("llm", "Runs when a fast-track amendment is requested.");
  bus.skip("bloom", "Runs against generated Course Outcomes.");
  bus.skip("cap", "Runs against the generated patch.");

  bus.emit({
    kind: "result",
    payload: {
      document: {
        name: file.name,
        format: parsed.kind,
        pages: parsed.pages,
        characters: parsed.characters,
      },
      structure,
      gap,
      graph,
    },
  });
}

async function runGraphTraversal(bus: TelemetryBus, gap: GapReport | null) {
  if (!gap) {
    bus.skip("graph", "Requires a completed gap analysis.");
    return null;
  }

  const problem = neo4jConfigProblem();
  if (problem) {
    bus.skip("graph", problem);
    return null;
  }

  const health = await checkConnectivity();
  if (!health.ok) {
    // Unreachable is reported as unavailable, not silently omitted, and the
    // audit continues on vector evidence alone.
    bus.skip("graph", health.detail);
    return null;
  }

  try {
    return await bus.span("graph", async (sink) => {
      const insight = await traverseSkillGraph(
        gap.coveredSkillIds,
        gap.missing.map((m) => m.id),
      );

      sink.metric("skill nodes", insight.skillNodes);
      sink.metric("tool nodes", insight.toolNodes);
      sink.metric("role nodes", insight.roleNodes);
      sink.metric("REQUIRES edges", insight.prerequisiteEdges);
      sink.metric("paths returned", insight.pathsReturned);
      sink.metric("max hop depth", insight.maxHopDepth);
      sink.metric("teachable now", insight.teachableNow.length);
      sink.metric("needs groundwork", insight.needsGroundwork.length);

      if (insight.skillNodes === 0) {
        sink.note("The graph is empty — run scripts/seed-skill-graph.mjs.");
      }

      return insight;
    });
  } catch (error) {
    bus.emit({
      kind: "note",
      stage: "graph",
      message: error instanceof Error ? error.message : "Graph traversal failed.",
    });
    return null;
  }
}

async function runGapAnalysis(
  bus: TelemetryBus,
  structure: SyllabusStructure,
  market: MarketId,
  supabase: SupabaseClient | null,
) {
  if (structure.units.length === 0) {
    bus.skip("embed", "No units were recovered to embed.");
    bus.skip("vector", "Requires embedded units.");
    bus.skip("gap", "Requires embedded units.");
    return null;
  }

  if (!isNimConfigured) {
    bus.skip("embed", "NVIDIA_NIM_API_KEY is not set.");
    bus.skip("vector", "Requires embeddings.");
    bus.skip("gap", "Requires embeddings.");
    return null;
  }

  let unitVectors: number[][];

  try {
    unitVectors = await bus.span("embed", async (sink) => {
      const texts = structure.units.map((unit) =>
        `${unit.label}. ${unit.title}\n${unit.body}`.trim().slice(0, MAX_EMBED_CHARS),
      );

      const startedAt = performance.now();
      // Syllabus text is the search side of an asymmetric model, so "query".
      const batch = await embedBatch(texts, "query");
      const seconds = (performance.now() - startedAt) / 1000;

      sink.metric("chunks", texts.length);
      sink.metric("dimension", batch.dim);
      sink.metric("throughput", (texts.length / seconds).toFixed(1), "vec/sec");
      sink.metric("prompt tokens", batch.promptTokens);
      sink.metric("model", batch.model);

      return batch.vectors;
    });
  } catch (error) {
    // The stage already reported its own error; downstream stages cannot run.
    bus.skip("vector", "Embedding failed.");
    bus.skip("gap", "Embedding failed.");
    bus.emit({
      kind: "note",
      stage: "embed",
      message: error instanceof Error ? error.message : "Embedding failed.",
    });
    return null;
  }

  const similarity = await bus.span("vector", async (sink) => {
    const meta = corpusMeta();
    const result = await buildSimilarityMatrix(unitVectors, supabase);

    sink.metric("source", result.source === "pgvector" ? "pgvector HNSW" : "in-memory exact");
    sink.metric("corpus skills", result.skills.length);
    sink.metric("comparisons", result.skills.length * unitVectors.length);
    sink.metric("query", result.queryMs, "ms");
    sink.metric("dimension", meta.dim);

    if (meta.dim !== EMBEDDING_DIM) {
      sink.note(
        `Corpus was embedded at ${meta.dim} dimensions but the runtime model returns ${EMBEDDING_DIM}. Re-run the seed script.`,
      );
    }
    if (result.note) sink.note(result.note);

    return result;
  });

  return bus.span("gap", async (sink) => {
    const report = analyseGap(structure.units, similarity.skills, similarity.matrix, market);

    sink.metric("market", market);
    sink.metric("alignment", report.alignment.toFixed(1), "%");
    sink.metric("covered", `${report.coveredSkillCount}/${report.inScopeSkillCount} in scope`);
    sink.metric("out of scope", report.outOfScopeSkillCount);
    sink.metric("floor / cutoff", `${report.relevanceFloor.toFixed(3)} / ${report.threshold.toFixed(3)}`);
    sink.metric("σ", report.similarityStdDev.toFixed(3));
    sink.metric("red-flagged", report.units.filter((u) => u.redFlagged).length);
    sink.metric("missing", report.missing.length);

    if (report.modifiableHours !== null) {
      sink.metric("15% budget", report.modifiableHours.toFixed(2), "h");
    } else {
      sink.note("Contact hours could not be determined, so no 15% budget was computed.");
    }

    return report;
  });
}

import { TelemetryBus, encodeSSE, type TelemetryEvent } from "@/lib/telemetry/bus";
import { ParseError, parseSyllabus } from "@/lib/syllabus/parse";
import { chunkSyllabus, toEmbeddingChunks } from "@/lib/syllabus/chunk";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Streams the audit pipeline as Server-Sent Events.
 *
 * POST rather than GET because the syllabus is uploaded with the request, so
 * the client reads the stream with fetch + a ReadableStream reader instead of
 * EventSource. One-way server→client, no extra infrastructure.
 */
export async function POST(request: Request) {
  let file: File;

  try {
    const form = await request.formData();
    const candidate = form.get("file");
    if (!(candidate instanceof File)) {
      return Response.json({ error: "No file supplied." }, { status: 400 });
    }
    file = candidate;
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
        await runAudit(bus, file);
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

async function runAudit(bus: TelemetryBus, file: File) {
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
    if (result.declaredTotalHours !== null) {
      sink.metric("declared total", result.declaredTotalHours, "h");
    }
    sink.metric("boundary confidence", result.boundaryConfidence.toFixed(2));

    if (result.units.length === 0) {
      sink.note("No unit headings matched. Check the document uses UNIT or MODULE headings.");
    }
    // A real disagreement between declared and summed hours matters: the 15%
    // budget is computed from these, so surface it rather than paper over it.
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

  const chunks = toEmbeddingChunks(structure);

  // Honest reporting for stages that are not built yet. The readout marks these
  // unavailable rather than emitting a plausible-looking number.
  bus.skip("embed", "Vector embedding lands in the next milestone.");
  bus.skip("vector", "Requires the embedded job-market corpus.");
  bus.skip("graph", "Requires the Neo4j skill graph.");
  bus.skip("gap", "Requires embeddings and the job corpus.");
  bus.skip("llm", "Patch generation lands after gap analysis.");
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
      chunkCount: chunks.length,
    },
  });
}

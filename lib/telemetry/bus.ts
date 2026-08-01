/**
 * Telemetry bus.
 *
 * The product's central claim is that its processing readout reflects real
 * computation. That claim only survives if every value here originates from an
 * operation that actually ran, so this module deliberately offers no way to
 * emit a projected, interpolated, or scheduled value. `span()` measures with
 * performance.now() around real work; `metric()` reports what that work
 * produced. There is no timer-driven progress anywhere in this file.
 */

export type Stage =
  | "parse"
  | "chunk"
  | "embed"
  | "vector"
  | "graph"
  | "gap"
  | "llm"
  | "bloom"
  | "cap";

export const STAGE_LABELS: Record<Stage, string> = {
  parse: "Document extraction",
  chunk: "Structural chunking",
  embed: "Vector embedding",
  vector: "Similarity search",
  graph: "Graph traversal",
  gap: "Gap scoring",
  llm: "Patch generation",
  bloom: "Bloom's validation",
  cap: "15% cap check",
};

export type TelemetryEvent =
  | { kind: "stage-start"; stage: Stage; at: number }
  | { kind: "stage-done"; stage: Stage; ms: number }
  | { kind: "stage-error"; stage: Stage; ms: number; message: string }
  | { kind: "stage-skipped"; stage: Stage; reason: string }
  | {
      kind: "metric";
      stage: Stage;
      label: string;
      value: number | string;
      unit?: string;
    }
  | { kind: "note"; stage: Stage; message: string }
  | { kind: "result"; payload: unknown }
  | { kind: "fatal"; message: string };

export type MetricSink = {
  metric: (label: string, value: number | string, unit?: string) => void;
  note: (message: string) => void;
};

type Listener = (event: TelemetryEvent) => void;

export class TelemetryBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: TelemetryEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  /**
   * Wrap a real unit of work. The reported duration is measured, and the stage
   * is only marked done once the work has actually resolved.
   */
  async span<T>(stage: Stage, work: (sink: MetricSink) => Promise<T> | T): Promise<T> {
    const started = performance.now();
    this.emit({ kind: "stage-start", stage, at: started });

    const sink: MetricSink = {
      metric: (label, value, unit) => this.emit({ kind: "metric", stage, label, value, unit }),
      note: (message) => this.emit({ kind: "note", stage, message }),
    };

    try {
      const result = await work(sink);
      this.emit({
        kind: "stage-done",
        stage,
        ms: round(performance.now() - started),
      });
      return result;
    } catch (error) {
      this.emit({
        kind: "stage-error",
        stage,
        ms: round(performance.now() - started),
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Declare a stage deliberately not run — an unconfigured service, say. The
   * readout shows this as unavailable rather than inventing a plausible number.
   */
  skip(stage: Stage, reason: string): void {
    this.emit({ kind: "stage-skipped", stage, reason });
  }
}

function round(ms: number): number {
  return Math.round(ms * 10) / 10;
}

/** Server-Sent Events framing. */
export function encodeSSE(event: TelemetryEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

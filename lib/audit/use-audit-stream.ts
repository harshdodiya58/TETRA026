"use client";

import { useCallback, useRef, useState } from "react";
import type { Stage, TelemetryEvent } from "@/lib/telemetry/bus";
import type { SyllabusStructure } from "@/lib/syllabus/chunk";
import type { GapReport } from "@/lib/gap/score";
import type { MarketId } from "@/data/job-market";

export type StageStatus = "idle" | "running" | "done" | "skipped" | "error";

export type StageState = {
  status: StageStatus;
  ms: number | null;
  metrics: { label: string; value: string }[];
  notes: string[];
  reason?: string;
};

export type AuditResult = {
  document: {
    name: string;
    format: string;
    pages: number | null;
    characters: number;
  };
  structure: SyllabusStructure;
  /** Null when a prerequisite stage was skipped or failed. */
  gap: GapReport | null;
};

export type RunState = "idle" | "running" | "done" | "failed";

const STAGE_ORDER: Stage[] = [
  "parse",
  "chunk",
  "embed",
  "vector",
  "graph",
  "gap",
  "llm",
  "bloom",
  "cap",
];

function emptyStages(): Record<Stage, StageState> {
  const initial = {} as Record<Stage, StageState>;
  for (const stage of STAGE_ORDER) {
    initial[stage] = { status: "idle", ms: null, metrics: [], notes: [] };
  }
  return initial;
}

export function useAuditStream() {
  const [stages, setStages] = useState<Record<Stage, StageState>>(emptyStages);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [elapsed, setElapsed] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((event: TelemetryEvent) => {
    switch (event.kind) {
      case "stage-start":
        setStages((prev) => ({
          ...prev,
          [event.stage]: { ...prev[event.stage], status: "running" },
        }));
        break;

      case "stage-done":
        setStages((prev) => ({
          ...prev,
          [event.stage]: { ...prev[event.stage], status: "done", ms: event.ms },
        }));
        break;

      case "stage-error":
        setStages((prev) => ({
          ...prev,
          [event.stage]: {
            ...prev[event.stage],
            status: "error",
            ms: event.ms,
            notes: [...prev[event.stage].notes, event.message],
          },
        }));
        break;

      case "stage-skipped":
        setStages((prev) => ({
          ...prev,
          [event.stage]: { ...prev[event.stage], status: "skipped", reason: event.reason },
        }));
        break;

      case "metric":
        setStages((prev) => ({
          ...prev,
          [event.stage]: {
            ...prev[event.stage],
            metrics: [
              ...prev[event.stage].metrics,
              {
                label: event.label,
                value: `${event.value}${event.unit ? ` ${event.unit}` : ""}`,
              },
            ],
          },
        }));
        break;

      case "note":
        setStages((prev) => ({
          ...prev,
          [event.stage]: {
            ...prev[event.stage],
            notes: [...prev[event.stage].notes, event.message],
          },
        }));
        break;

      case "result":
        setResult(event.payload as AuditResult);
        break;

      case "fatal":
        setError(event.message);
        // Must also flip run state, or the stream ending would mark a failed
        // audit as "done" and the UI would show success next to an error.
        setRunState("failed");
        break;
    }
  }, []);

  const run = useCallback(
    async (file: File, market: MarketId) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStages(emptyStages());
      setResult(null);
      setError(null);
      setElapsed(null);
      setRunState("running");

      const started = performance.now();

      try {
        const body = new FormData();
        body.append("file", file);
        body.append("market", market);

        const response = await fetch("/api/audit/stream", {
          method: "POST",
          body,
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error ?? `Audit request failed (${response.status}).`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // SSE frames are separated by a blank line; a frame can straddle chunks.
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data:")) continue;
            try {
              apply(JSON.parse(line.slice(5).trim()) as TelemetryEvent);
            } catch {
              // A malformed frame should not abort an otherwise good run.
            }
          }
        }

        setElapsed(Math.round(performance.now() - started));
        setRunState((prev) => (prev === "running" ? "done" : prev));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The audit failed unexpectedly.");
        setRunState("failed");
      }
    },
    [apply],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStages(emptyStages());
    setResult(null);
    setError(null);
    setElapsed(null);
    setRunState("idle");
  }, []);

  return { stages, stageOrder: STAGE_ORDER, result, error, runState, elapsed, run, reset };
}

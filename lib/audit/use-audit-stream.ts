"use client";

import { useCallback, useRef, useState } from "react";
import type { Stage, TelemetryEvent } from "@/lib/telemetry/bus";
import type { SyllabusStructure } from "@/lib/syllabus/chunk";
import type { GapReport } from "@/lib/gap/score";
import type { GraphInsight } from "@/lib/graph/traverse";
import type { SyllabusPatch } from "@/lib/patch/generate";
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
  /** Null when Neo4j is unconfigured or unreachable. */
  graph: GraphInsight | null;
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

/** Stages owned by the patch pass, reset when a patch is regenerated. */
const PATCH_STAGES: Stage[] = ["llm", "bloom", "cap"];

function blankStage(): StageState {
  return { status: "idle", ms: null, metrics: [], notes: [] };
}

function emptyStages(): Record<Stage, StageState> {
  const initial = {} as Record<Stage, StageState>;
  for (const stage of STAGE_ORDER) initial[stage] = blankStage();
  return initial;
}

export function useAuditStream() {
  const [stages, setStages] = useState<Record<Stage, StageState>>(emptyStages);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [patch, setPatch] = useState<SyllabusPatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [patchState, setPatchState] = useState<RunState>("idle");
  const [elapsed, setElapsed] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const applyStageEvent = useCallback((event: TelemetryEvent) => {
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
    }
  }, []);

  /** Reads an SSE body, dispatching each frame. Frames can straddle chunks. */
  const consume = useCallback(
    async (response: Response, onEvent: (event: TelemetryEvent) => void) => {
      if (!response.ok || !response.body) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `Request failed (${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            onEvent(JSON.parse(line.slice(5).trim()) as TelemetryEvent);
          } catch {
            // A malformed frame should not abort an otherwise good run.
          }
        }
      }
    },
    [],
  );

  const run = useCallback(
    async (file: File, market: MarketId) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStages(emptyStages());
      setResult(null);
      setPatch(null);
      setError(null);
      setPatchError(null);
      setElapsed(null);
      setPatchState("idle");
      setRunState("running");

      const started = performance.now();
      let failed = false;

      try {
        const body = new FormData();
        body.append("file", file);
        body.append("market", market);

        const response = await fetch("/api/audit/stream", {
          method: "POST",
          body,
          signal: controller.signal,
        });

        await consume(response, (event) => {
          if (event.kind === "result") setResult(event.payload as AuditResult);
          else if (event.kind === "fatal") {
            failed = true;
            setError(event.message);
          } else applyStageEvent(event);
        });

        setElapsed(Math.round(performance.now() - started));
        setRunState(failed ? "failed" : "done");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The audit failed unexpectedly.");
        setRunState("failed");
      }
    },
    [applyStageEvent, consume],
  );

  const runPatch = useCallback(
    async (structure: SyllabusStructure, gap: GapReport) => {
      setPatch(null);
      setPatchError(null);
      setPatchState("running");

      // Clear only the patch stages so the audit readout above stays intact.
      setStages((prev) => {
        const next = { ...prev };
        for (const stage of PATCH_STAGES) next[stage] = blankStage();
        return next;
      });

      let failed = false;

      try {
        const response = await fetch("/api/patch/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ structure, gap }),
        });

        await consume(response, (event) => {
          if (event.kind === "result") setPatch(event.payload as SyllabusPatch);
          else if (event.kind === "fatal") {
            failed = true;
            setPatchError(event.message);
          } else applyStageEvent(event);
        });

        setPatchState(failed ? "failed" : "done");
      } catch (err) {
        setPatchError(err instanceof Error ? err.message : "Patch generation failed.");
        setPatchState("failed");
      }
    },
    [applyStageEvent, consume],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStages(emptyStages());
    setResult(null);
    setPatch(null);
    setError(null);
    setPatchError(null);
    setElapsed(null);
    setRunState("idle");
    setPatchState("idle");
  }, []);

  return {
    stages,
    stageOrder: STAGE_ORDER,
    result,
    patch,
    error,
    patchError,
    runState,
    patchState,
    elapsed,
    run,
    runPatch,
    reset,
  };
}

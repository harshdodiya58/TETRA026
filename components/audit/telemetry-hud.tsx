"use client";

import { motion } from "motion/react";
import { STAGE_LABELS, type Stage } from "@/lib/telemetry/bus";
import type { RunState, StageState } from "@/lib/audit/use-audit-stream";
import { cn } from "@/lib/utils";

type Props = {
  stages: Record<Stage, StageState>;
  stageOrder: Stage[];
  runState: RunState;
  elapsed: number | null;
};

export function TelemetryHud({ stages, stageOrder, runState, elapsed }: Props) {
  return (
    <figure className="panel lift overflow-hidden rounded-lg">
      <figcaption className="flex items-baseline justify-between border-b border-[#d6d0c4] bg-surface px-5 py-3">
        <span className="small-caps text-[11px] text-ink">Audit log</span>
        <span className="font-mono text-[11px] text-faint">
          {runState === "running" && "running…"}
          {runState === "done" && elapsed !== null && `${(elapsed / 1000).toFixed(1)} s`}
          {runState === "failed" && <span className="text-bad">failed</span>}
          {runState === "idle" && "awaiting input"}
        </span>
      </figcaption>

      <div className="divide-y divide-[#e2ddd2] px-5">
        {stageOrder.map((stage) => (
          <StageRow key={stage} stage={stage} state={stages[stage]} />
        ))}
      </div>
    </figure>
  );
}

function StageRow({ stage, state }: { stage: Stage; state: StageState }) {
  const dimmed = state.status === "idle" || state.status === "skipped";

  return (
    <div className={cn("py-2.5 font-mono text-[12.5px]", dimmed && "opacity-55")}>
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            "w-14 shrink-0",
            state.status === "error" ? "text-bad" : "text-accent",
            dimmed && "text-faint",
          )}
        >
          {stage}
        </span>

        <span className="min-w-0 flex-1 truncate text-muted">
          {state.status === "skipped" ? (
            <span className="text-faint">{state.reason ?? "not run"}</span>
          ) : state.metrics.length > 0 ? (
            state.metrics.map((m) => `${m.label} ${m.value}`).join(" · ")
          ) : (
            <span className="text-faint">{STAGE_LABELS[stage]}</span>
          )}
        </span>

        <span className="shrink-0 tabular-nums">
          {state.status === "running" && (
            <motion.span
              className="text-accent"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              ···
            </motion.span>
          )}
          {state.status === "done" && state.ms !== null && (
            <span className="text-good">{formatMs(state.ms)}</span>
          )}
          {state.status === "error" && <span className="text-bad">error</span>}
          {/* Deliberately not a number: no measurement was taken. */}
          {state.status === "skipped" && <span className="text-faint">—</span>}
          {state.status === "idle" && <span className="text-faint">·</span>}
        </span>
      </div>

      {state.notes.map((note, i) => (
        <p key={i} className="mt-1.5 pl-[4.25rem] text-[11.5px] leading-relaxed text-warn">
          {note}
        </p>
      ))}
    </div>
  );
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`;
}

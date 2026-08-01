"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";

type Tone = "ok" | "warn" | "info";

const LINES: { stage: string; detail: string; metric: string; tone: Tone }[] = [
  {
    stage: "parse",
    detail: "CS304_syllabus.pdf · 5 pages · 18,442 chars",
    metric: "412 ms",
    tone: "info",
  },
  {
    stage: "chunk",
    detail: "5 units · 18 sub-topics · 45 lecture hours · boundary conf 0.94",
    metric: "38 ms",
    tone: "info",
  },
  {
    stage: "embed",
    detail: "18 chunks → 1024-dim · 42.6 vec/sec · 3,180 tokens",
    metric: "423 ms",
    tone: "info",
  },
  {
    stage: "vector",
    detail: "pgvector HNSW · top-k 12 · cosine distance",
    metric: "18 ms",
    tone: "info",
  },
  {
    stage: "graph",
    detail: "1,240 concept + 480 tool nodes · max hop depth 4",
    metric: "122 ms",
    tone: "info",
  },
  {
    stage: "gap",
    detail: "alignment 58% · 7 red-flagged topics · 5 missing skills",
    metric: "0.42 gap",
    tone: "warn",
  },
  {
    stage: "llm",
    detail: "meta/llama-3.3-70b-instruct · TTFT 840 ms",
    metric: "62 tok/s",
    tone: "info",
  },
  {
    stage: "bloom",
    detail: "6 / 6 generated COs at levels 3–5",
    metric: "PASS",
    tone: "ok",
  },
  {
    stage: "cap",
    detail: "6.4 h of 6.75 h fast-track budget consumed",
    metric: "WITHIN 15%",
    tone: "ok",
  },
];

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-good",
  warn: "text-warn",
  info: "text-muted",
};

const TILES = [
  { label: "Alignment", value: "58%", tone: "text-warn" },
  { label: "Obsolete hours", value: "9.5 h", tone: "text-bad" },
  { label: "Patch budget", value: "6.75 h", tone: "text-good" },
];

export function TelemetryPreview() {
  return (
    <section id="telemetry" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] text-pulse">Transparency</p>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
              Every number is a measurement.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Most AI demos show a spinner and hope you assume something happened. CurriPulse streams
              the actual instrumentation: document parsing latency, embedding throughput, pgvector
              index query time, Cypher round-trips, and token generation speed.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              If a stage produces no measurement, the panel says so. Nothing on the HUD is a
              placeholder animation timed to look busy.
            </p>

            <div className="mt-9 grid grid-cols-3 gap-4">
              {TILES.map((tile) => (
                <div key={tile.label} className="rule rounded-xl bg-white/[0.02] p-4">
                  <p className={`font-mono text-2xl font-semibold ${tile.tone}`}>{tile.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-faint">
                    {tile.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="panel overflow-hidden rounded-2xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-bad/70" />
                  <span className="size-2.5 rounded-full bg-warn/70" />
                  <span className="size-2.5 rounded-full bg-good/70" />
                  <span className="ml-3 font-mono text-xs text-faint">audit · live telemetry</span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
                  <span className="size-1.5 animate-pulse rounded-full bg-good" />
                  NVIDIA NIM
                </span>
              </div>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ staggerChildren: 0.13, delayChildren: 0.2 }}
                className="space-y-1.5 p-4 font-mono text-[12.5px] leading-relaxed sm:p-5"
              >
                {LINES.map((line) => (
                  <motion.div
                    key={line.stage}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      show: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.35 }}
                    className="flex items-baseline gap-3"
                  >
                    <span className="w-14 shrink-0 text-pulse">{line.stage}</span>
                    <span className="min-w-0 flex-1 truncate text-faint">{line.detail}</span>
                    <span className={`shrink-0 tabular-nums ${TONE_CLASS[line.tone]}`}>
                      {line.metric}
                    </span>
                  </motion.div>
                ))}
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="flex items-baseline gap-3 pt-1"
                >
                  <span className="w-14 shrink-0 text-good">done</span>
                  <span className="flex-1 text-muted">
                    BoS proposal ready
                    <span className="ml-1 inline-block w-2 animate-blink bg-pulse align-baseline">
                      &nbsp;
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-good">12.4 s</span>
                </motion.div>
              </motion.div>
            </div>

            <p className="mt-3 text-center text-[11px] text-faint">
              Representative output from a sample CS304 run — not a live session.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

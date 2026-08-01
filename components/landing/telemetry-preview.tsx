"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";

type Tone = "ok" | "warn" | "plain";

const LINES: { stage: string; detail: string; metric: string; tone: Tone }[] = [
  { stage: "parse", detail: "CS304_syllabus.pdf · 5 pages · 18,442 chars", metric: "412 ms", tone: "plain" },
  { stage: "chunk", detail: "5 units · 18 sub-topics · 45 lecture hours", metric: "38 ms", tone: "plain" },
  { stage: "embed", detail: "18 chunks → 1024-dim · 42.6 vec/sec", metric: "423 ms", tone: "plain" },
  { stage: "vector", detail: "pgvector HNSW · top-k 12 · cosine", metric: "18 ms", tone: "plain" },
  { stage: "graph", detail: "1,240 concept + 480 tool nodes · depth 4", metric: "122 ms", tone: "plain" },
  { stage: "gap", detail: "alignment 58% · 7 red-flagged · 5 missing", metric: "0.42", tone: "warn" },
  { stage: "llm", detail: "meta/llama-3.3-70b-instruct · TTFT 840 ms", metric: "62 tok/s", tone: "plain" },
  { stage: "bloom", detail: "6 of 6 generated COs at levels 3–5", metric: "PASS", tone: "ok" },
  { stage: "cap", detail: "6.4 h of 6.75 h fast-track budget consumed", metric: "WITHIN", tone: "ok" },
];

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-good",
  warn: "text-warn",
  plain: "text-muted",
};

const TILES = [
  { label: "Alignment", value: "58%", tone: "text-warn" },
  { label: "Obsolete hours", value: "9.5", tone: "text-bad" },
  { label: "Patch budget", value: "6.75", tone: "text-good" },
];

export function TelemetryPreview() {
  return (
    <section id="telemetry" className="relative border-t border-[#d6d0c4] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Reveal>
            <p className="small-caps text-xs text-accent">Transparency</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Every number is a measurement.
            </h2>
            <p className="mt-6 font-serif text-lg leading-[1.7] text-muted">
              Most AI demonstrations show a spinner and hope you assume something happened.
              CurriPulse prints the actual instrumentation: parsing latency, embedding throughput,
              vector index query time, graph round-trips, and token generation speed.
            </p>
            <p className="mt-4 font-serif text-lg leading-[1.7] text-muted">
              If a stage produces no measurement, the readout says so. Nothing here is a placeholder
              animation timed to look busy.
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#d6d0c4] bg-[#d6d0c4]">
              {TILES.map((tile) => (
                <div key={tile.label} className="bg-raised p-5">
                  <dd className={`font-mono text-2xl ${tile.tone}`}>{tile.value}</dd>
                  <dt className="small-caps mt-1 text-[11px] text-faint">{tile.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Styled as a printed audit log rather than a terminal window —
                this is a document product, and the readout is part of the record. */}
            <figure className="panel lift overflow-hidden rounded-lg">
              <figcaption className="flex items-baseline justify-between border-b border-[#d6d0c4] bg-surface px-5 py-3">
                <span className="small-caps text-[11px] text-ink">Audit log · CS304</span>
                <span className="font-mono text-[11px] text-faint">NVIDIA NIM</span>
              </figcaption>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
                className="divide-y divide-[#e2ddd2] px-5 font-mono text-[12.5px]"
              >
                {LINES.map((line) => (
                  <motion.div
                    key={line.stage}
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    transition={{ duration: 0.3 }}
                    className="flex items-baseline gap-3 py-2"
                  >
                    <span className="w-14 shrink-0 text-accent">{line.stage}</span>
                    <span className="min-w-0 flex-1 truncate text-faint">{line.detail}</span>
                    <span className={`shrink-0 tabular-nums ${TONE_CLASS[line.tone]}`}>
                      {line.metric}
                    </span>
                  </motion.div>
                ))}
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="flex items-baseline gap-3 py-2.5"
                >
                  <span className="w-14 shrink-0 text-good">done</span>
                  <span className="flex-1 text-ink">
                    BoS proposal ready
                    <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-blink bg-accent align-middle" />
                  </span>
                  <span className="shrink-0 tabular-nums text-good">12.4 s</span>
                </motion.div>
              </motion.div>
            </figure>

            <p className="mt-3 text-[11px] text-faint">
              Representative output from a sample CS304 run — not a live session.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

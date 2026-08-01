"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";

const SYLLABUS_REVISIONS = [
  { year: "2019", label: "BoS revision" },
  { year: "2024", label: "BoS revision" },
];

const INDUSTRY_SHIFTS = [
  { at: 4, label: "Docker-first deploys" },
  { at: 15, label: "TypeScript default" },
  { at: 27, label: "Serverless Postgres" },
  { at: 38, label: "Prisma / Drizzle ORM" },
  { at: 49, label: "pgvector" },
  { at: 59, label: "RAG pipelines" },
  { at: 70, label: "Vector indexing" },
  { at: 80, label: "LLM eval tooling" },
  { at: 90, label: "Agentic workflows" },
];

const STATS = [
  { value: 3, suffix: "–5 yrs", label: "Between syllabus revisions", tone: "text-bad" },
  { value: 3, suffix: "–6 mo", label: "Between industry stack shifts", tone: "text-warn" },
  { value: 15, suffix: "%", label: "Changeable without re-accreditation", tone: "text-good" },
];

export function GapTimeline() {
  return (
    <section id="gap" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.2em] text-pulse">The problem</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">
            The lag is structural, not negligence.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Faculty know the syllabus is stale. The obstacle is regulatory: changing more than
            roughly 15% of a core syllabus triggers a Board of Studies and Academic Council cycle
            that runs one to two years. So the document freezes while the industry it feeds does not.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <div className="panel rounded-3xl p-6 sm:p-10">
            {/* Syllabus track — sparse */}
            <div className="mb-14">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">CS304 · Database Management Systems</span>
                <span className="text-xs text-faint">2 revisions in 7 years</span>
              </div>
              <div className="relative h-px w-full bg-white/10">
                {SYLLABUS_REVISIONS.map((rev, i) => (
                  <motion.div
                    key={rev.year}
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.25 }}
                    className="absolute -top-1.5 flex flex-col items-center"
                    style={{ left: `${i === 0 ? 4 : 72}%` }}
                  >
                    <span className="size-3.5 rounded-full border-2 border-bad bg-base" />
                    <span className="mt-3 whitespace-nowrap text-xs text-muted">{rev.year}</span>
                    <span className="whitespace-nowrap text-[11px] text-faint">{rev.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Industry track — dense */}
            <div className="pt-8">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">What Bengaluru actually hires for</span>
                <span className="text-xs text-faint">continuous drift</span>
              </div>
              <div className="relative h-px w-full bg-gradient-to-r from-pulse/50 via-flux/50 to-nova/50">
                {INDUSTRY_SHIFTS.map((shift, i) => (
                  <motion.div
                    key={shift.label}
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
                    className="group absolute -top-1 flex flex-col items-center"
                    style={{ left: `${shift.at}%` }}
                  >
                    <span className="size-2 rounded-full bg-pulse shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                    <span
                      className={`mt-3 origin-top -rotate-45 whitespace-nowrap text-[11px] text-faint transition-colors group-hover:text-pulse ${
                        i % 2 === 0 ? "" : "opacity-70"
                      }`}
                    >
                      {shift.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="h-16" />
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.1}>
              <div className="rule rounded-2xl bg-white/[0.02] p-6">
                <p className={`font-mono text-4xl font-semibold ${stat.tone}`}>
                  <Counter to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

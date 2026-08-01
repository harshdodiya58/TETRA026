"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";

const SYLLABUS_REVISIONS = [
  { year: "2019", label: "BoS revision", at: 4 },
  { year: "2024", label: "BoS revision", at: 72 },
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
  { value: 3, suffix: "–5 yrs", label: "Between syllabus revisions", tone: "text-ink" },
  { value: 3, suffix: "–6 mo", label: "Between industry stack shifts", tone: "text-warn" },
  { value: 15, suffix: "%", label: "Changeable without re-accreditation", tone: "text-good" },
];

export function GapTimeline() {
  return (
    <section id="gap" className="relative border-t border-[#d6d0c4] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="small-caps text-xs text-accent">The problem</p>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            The lag is structural, not negligence.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-[1.7] text-muted">
            Faculty know the syllabus is stale. The obstacle is regulatory: changing more than
            roughly fifteen per cent of a core syllabus triggers a Board of Studies and Academic
            Council cycle that runs one to two years. So the document freezes while the industry it
            feeds does not.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-14">
          <figure className="panel lift rounded-lg p-6 sm:p-10">
            {/* Syllabus track — sparse */}
            <div className="mb-16">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="text-sm text-ink">CS304 · Database Management Systems</span>
                <span className="small-caps text-[11px] text-faint">2 revisions in 7 years</span>
              </div>
              <div className="relative h-px w-full bg-[#d6d0c4]">
                {SYLLABUS_REVISIONS.map((rev, i) => (
                  <motion.div
                    key={rev.year}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.2 }}
                    className="absolute -top-[5px] flex flex-col items-center"
                    style={{ left: `${rev.at}%` }}
                  >
                    <span className="size-2.5 rounded-full border border-ink bg-base" />
                    <span className="mt-3 whitespace-nowrap font-mono text-[11px] text-ink">
                      {rev.year}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-faint">{rev.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Industry track — dense, in red pen */}
            <div className="pt-10">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="text-sm text-ink">What Bengaluru actually hires for</span>
                <span className="small-caps text-[11px] text-accent">continuous drift</span>
              </div>
              <div className="relative h-px w-full bg-accent/35">
                {INDUSTRY_SHIFTS.map((shift, i) => (
                  <motion.div
                    key={shift.label}
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                    className="group absolute -top-[3px] flex flex-col items-center"
                    style={{ left: `${shift.at}%` }}
                  >
                    <span className="size-1.5 rounded-full bg-accent" />
                    <span className="mt-3 origin-top -rotate-45 whitespace-nowrap text-[11px] text-muted transition-colors group-hover:text-accent">
                      {shift.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="h-20" />
            </div>

            <figcaption className="border-t border-[#d6d0c4] pt-4 text-[11px] text-faint">
              Illustrative timeline. Actual drift is computed per course during an audit.
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[#d6d0c4] bg-[#d6d0c4] sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="h-full bg-raised p-7">
                <p className={`font-mono text-4xl ${stat.tone}`}>
                  <Counter to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2.5 text-sm text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "motion/react";
import type { GapReport } from "@/lib/gap/score";
import { MARKET_LABELS } from "@/data/job-market";
import { cn } from "@/lib/utils";

/** Alignment bands. Colour here encodes a measured value, never decoration. */
function toneFor(value: number, warnBelow: number, badBelow: number) {
  if (value < badBelow) return { text: "text-bad", bg: "bg-bad" };
  if (value < warnBelow) return { text: "text-warn", bg: "bg-warn" };
  return { text: "text-good", bg: "bg-good" };
}

export function GapReportView({ report }: { report: GapReport }) {
  const alignmentTone = toneFor(report.alignment, 70, 50);
  const maxHours = Math.max(...report.units.map((u) => u.hours ?? 0), 1);

  return (
    <div className="space-y-10">
      {/* Headline */}
      <header className="border-b border-[#d6d0c4] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="small-caps text-xs text-accent">Industry alignment</p>
            <p className={cn("mt-2 font-mono text-6xl", alignmentTone.text)}>
              {report.alignment.toFixed(0)}
              <span className="text-3xl">%</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              of weighted market demand in {MARKET_LABELS[report.market]}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-x-8 gap-y-1 text-right">
            <Stat
              label="Skills covered"
              value={`${report.coveredSkillCount}/${report.inScopeSkillCount}`}
            />
            <Stat
              label="Obsolete hours"
              value={report.obsoleteHours > 0 ? `${report.obsoleteHours} h` : "—"}
              tone={report.obsoleteHours > 0 ? "text-bad" : undefined}
            />
            <Stat
              label="15% budget"
              value={report.modifiableHours !== null ? `${report.modifiableHours} h` : "—"}
              tone="text-good"
            />
          </dl>
        </div>

        <p className="mt-5 text-[11.5px] leading-relaxed text-faint">
          Demand-weighted coverage of the {report.inScopeSkillCount} corpus skills within this
          course&apos;s domain. {report.outOfScopeSkillCount} skills were excluded as belonging to
          another course — measured against the whole market a database syllabus reads as
          &ldquo;missing&rdquo; Git and Docker, which is true and useless. Both cutoffs come from
          this document&apos;s own similarity distribution, not fixed constants: in scope above{" "}
          <span className="font-mono text-muted">{report.relevanceFloor.toFixed(3)}</span> (μ),
          covered above <span className="font-mono text-muted">{report.threshold.toFixed(3)}</span>{" "}
          (μ + σ, σ = {report.similarityStdDev.toFixed(3)}).
        </p>
      </header>

      {/* Heatmap */}
      <section>
        <h3 className="small-caps text-xs text-accent">Unit heatmap</h3>
        <p className="mt-2 text-[12px] text-faint">
          Bar length is teaching hours; colour is the demand this unit uniquely covers. Long and red
          is the problem case — real teaching time spent on content the market no longer rewards.
        </p>

        <ul className="mt-5 space-y-3">
          {report.units.map((unit, i) => {
            const tone = toneFor(unit.ownedDemand, 0.55, 0.35);
            const width = ((unit.hours ?? 0) / maxHours) * 100;

            return (
              <li key={unit.unitIndex}>
                <div className="flex items-baseline justify-between gap-4 text-[12.5px]">
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-[11px] text-accent">{unit.label}</span>{" "}
                    <span className="text-ink">{unit.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-faint">
                    {unit.hours !== null ? `${unit.hours} h` : "— h"} · demand{" "}
                    <span className={tone.text}>{unit.ownedDemand.toFixed(2)}</span>
                  </span>
                </div>

                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-sm bg-[#e4dfd4]">
                  <motion.div
                    className={cn("h-full rounded-sm", tone.bg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-faint">
                  closest market skills: {unit.matches.slice(0, 3).map((m) => m.name).join(" · ")}
                </p>

                {unit.redFlagged && (
                  <p className="mt-1 text-[11px] text-bad">
                    Red-flagged — {unit.hours ?? 0} teaching hours covering little demanded skill.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Missing */}
      <section>
        <h3 className="small-caps text-xs text-accent">Missing critical skills</h3>
        <p className="mt-2 text-[12px] text-faint">
          Within this course&apos;s domain, in demand in this market, and not matched by any unit.
          Ranked by demand — that ranking is the argument for adding them.
        </p>

        <ol className="mt-5 divide-y divide-[#e2ddd2]">
          {report.missing.map((skill) => {
            const tone = toneFor(1 - skill.demand, 0.6, 0.45);
            return (
              <li key={skill.id} className="flex items-baseline gap-4 py-2.5">
                <span className="w-11 shrink-0 font-mono text-[11px] tabular-nums text-faint">
                  {(skill.demand * 100).toFixed(0)}%
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm text-ink">{skill.name}</span>
                  {skill.emerging && (
                    <span className="ml-2 rounded-sm border border-accent/30 px-1.5 py-px text-[9.5px] uppercase tracking-wide text-accent">
                      emerging
                    </span>
                  )}
                  <span className="ml-2 text-[11px] text-faint">
                    nearest {skill.nearestUnit ?? "—"}
                  </span>
                </span>
                <span className={cn("shrink-0 font-mono text-[11px] tabular-nums", tone.text)}>
                  {skill.bestSimilarity.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ol>

        {report.missing.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            Every corpus skill matched a unit above threshold.
          </p>
        )}
      </section>

      <footer className="border-t border-[#d6d0c4] pt-4">
        <p className="text-[11px] leading-relaxed text-faint">
          Demand weights come from a curated seed compiled from public Indian tech job listings and
          the NASSCOM FutureSkills taxonomy — estimates, not a live scrape. Live Adzuna/JSearch
          ingest replaces them once those keys are configured.
        </p>
      </footer>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dd className={cn("font-mono text-lg", tone ?? "text-ink")}>{value}</dd>
      <dt className="small-caps text-[10px] text-faint">{label}</dt>
    </div>
  );
}

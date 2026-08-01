"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import type { SyllabusPatch } from "@/lib/patch/generate";
import { BLOOM_LEVEL_NAMES } from "@/lib/obe/bloom";
import { PROGRAM_OUTCOMES } from "@/lib/obe/program-outcomes";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = {
  lab: "Lab experiment",
  "case-study": "Case study",
  "micro-project": "Micro-project",
};

export function PatchView({ patch }: { patch: SyllabusPatch }) {
  const utilisation = (patch.hoursUsed / patch.hoursBudget) * 100;

  return (
    <div className="space-y-9">
      <header className="border-b border-[#d6d0c4] pb-6">
        <p className="small-caps text-xs text-accent">Proposed amendment</p>
        <h2 className="mt-2 text-3xl leading-tight">15% fast-track patch</h2>

        <div className="mt-6 space-y-2">
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="text-faint">
              {patch.hoursUsed} h proposed of {patch.hoursBudget} h budget ({patch.totalHours} h
              course)
            </span>
            <span className={patch.withinCap ? "text-good" : "text-bad"}>
              {patch.withinCap ? "WITHIN 15%" : "OVER BUDGET"}
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-sm bg-[#e4dfd4]">
            <motion.div
              className={cn("h-full rounded-sm", patch.withinCap ? "bg-good" : "bg-bad")}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilisation, 100)}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-[11px] text-faint">
            {utilisation.toFixed(1)}% of the fast-track allowance. Course code, title, credits, and
            core theory are untouched.
          </p>
        </div>

        {!patch.withinCap && (
          <p className="mt-4 rounded-md border border-bad/30 bg-bad/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-bad">
            The generator could not fit the amendment inside the ceiling after {patch.attempts}{" "}
            drafts. This must not be tabled as a fast-track amendment in its current form — reduce
            it by hand or regenerate.
          </p>
        )}

        <p className="mt-4 font-mono text-[11px] text-faint">
          {patch.provider}/{patch.model} · {patch.attempts} draft
          {patch.attempts === 1 ? "" : "s"}
          {patch.ttftMs !== null && ` · TTFT ${patch.ttftMs} ms`} · {patch.totalMs} ms
        </p>
      </header>

      {/* Rejections are evidence the validators actually bite. */}
      {patch.corrections.length > 0 && (
        <section className="rule rounded-lg bg-warn/[0.06] p-5">
          <h3 className="small-caps text-[11px] text-warn">Drafts rejected by validation</h3>
          <ul className="mt-3 space-y-1.5">
            {patch.corrections.map((correction, i) => (
              <li key={i} className="text-[12px] leading-relaxed text-muted">
                {correction}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            The hour budget and Bloom&apos;s level are checked in code after generation, not
            requested politely in the prompt. Rejected drafts were sent back with the specific
            failure and regenerated.
          </p>
        </section>
      )}

      {/* Additions */}
      <section>
        <h3 className="small-caps text-xs text-accent">Proposed additions</h3>
        <ol className="mt-5 space-y-7">
          {patch.additions.map((addition, i) => {
            const outcome = patch.outcomes[i];
            return (
              <li key={i} className="border-t border-[#d6d0c4] pt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="small-caps text-[10px] text-faint">
                    {KIND_LABELS[addition.kind] ?? addition.kind} · {addition.targetUnit}
                  </span>
                  <span className="font-mono text-[11px] text-ink">{addition.hours} h</span>
                </div>

                <h4 className="mt-2 font-serif text-xl text-ink">{addition.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{addition.description}</p>

                {addition.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {addition.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rule rounded-sm bg-surface px-2 py-0.5 font-mono text-[10.5px] text-muted"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {outcome && (
                  <div className="mt-4 border-l-2 border-accent/40 bg-surface py-3 pl-4 pr-3">
                    <p className="font-serif text-[13.5px] leading-relaxed text-ink">
                      {outcome.statement}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {outcome.bloom.passed && outcome.bloom.level !== null ? (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-good/12 px-2 py-0.5 text-[10.5px] text-good">
                          <Check className="size-3" />
                          Bloom&apos;s L{outcome.bloom.level} ·{" "}
                          {BLOOM_LEVEL_NAMES[outcome.bloom.level]}
                          {outcome.bloom.verb && ` · "${outcome.bloom.verb}"`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-bad/12 px-2 py-0.5 text-[10.5px] text-bad">
                          <AlertTriangle className="size-3" />
                          Failed Bloom&apos;s validation
                        </span>
                      )}

                      {outcome.programOutcomes.map((po) => (
                        <span
                          key={po.po}
                          title={`${PROGRAM_OUTCOMES[po.po]} — ${po.reason}`}
                          className="rule rounded-sm bg-raised px-1.5 py-0.5 font-mono text-[10px] text-muted"
                        >
                          {po.po}
                          <span className="ml-1 text-accent">{"•".repeat(po.strength)}</span>
                        </span>
                      ))}
                    </div>

                    {!outcome.bloom.passed && outcome.bloom.reason && (
                      <p className="mt-2 text-[11px] leading-relaxed text-bad">
                        {outcome.bloom.reason}
                      </p>
                    )}
                  </div>
                )}

                {addition.addressesSkills.length > 0 && (
                  <p className="mt-3 text-[11px] text-faint">
                    closes: {addition.addressesSkills.join(" · ")}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Modernisations */}
      {patch.modernisations.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-accent">Unit modernisations</h3>
          <p className="mt-2 text-[12px] text-faint">
            Emphasis and tooling only — no hours added, no core theory removed.
          </p>
          <ul className="mt-5 space-y-5">
            {patch.modernisations.map((mod, i) => (
              <li key={i} className="border-t border-[#d6d0c4] pt-4">
                <span className="font-mono text-[11px] text-accent">{mod.unit}</span>
                <dl className="mt-2 space-y-1.5 text-[13px] leading-relaxed">
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-[11px] text-faint">current</dt>
                    <dd className="text-muted line-through decoration-bad/40">
                      {mod.currentEmphasis}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-[11px] text-faint">proposed</dt>
                    <dd className="text-ink">{mod.proposedEmphasis}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11.5px] italic text-muted">{mod.rationale}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

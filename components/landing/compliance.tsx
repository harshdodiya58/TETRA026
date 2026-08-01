import { Reveal } from "@/components/ui/reveal";

const BLOOM = [
  { level: "L1–L2", name: "Remember · Understand", use: "Introductory lecture topics only", tone: "text-faint" },
  { level: "L3", name: "Apply", use: "New hands-on lab experiments", tone: "text-pulse" },
  { level: "L4", name: "Analyze", use: "Industry case studies", tone: "text-flux" },
  { level: "L5", name: "Evaluate · Create", use: "Capstone micro-project prompts", tone: "text-nova" },
];

const PO_MAP = [
  { code: "PO1", label: "Engineering Knowledge" },
  { code: "PO3", label: "Design / Development of Solutions" },
  { code: "PO5", label: "Modern Tool Usage" },
];

export function Compliance() {
  return (
    <section id="compliance" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.2em] text-pulse">Accreditation</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">
            Written the way your Board already reads.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            A Dean will not sign a proposal that a language model asserted was compliant. So the
            parts an accreditation body audits are computed and verified in code — the model
            proposes, deterministic rules dispose.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {/* CO formulator */}
          <Reveal>
            <div className="panel h-full rounded-2xl p-7">
              <h3 className="text-lg font-semibold text-ink">Course Outcome formulator</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                Every generated addition carries a CO statement in the standard OBE construction.
              </p>
              <div className="rule mt-6 rounded-xl bg-base/60 p-4 font-mono text-[12px] leading-relaxed">
                <p className="text-faint">
                  At the end of this module, the student will be able to{" "}
                  <span className="text-pulse">[action verb]</span>{" "}
                  <span className="text-flux">[tool / concept]</span> to{" "}
                  <span className="text-nova">[engineering application]</span>.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {PO_MAP.map((po) => (
                  <span
                    key={po.code}
                    className="rule rounded-full bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted"
                  >
                    <span className="font-mono text-pulse">{po.code}</span> · {po.label}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Bloom's */}
          <Reveal delay={0.08}>
            <div className="panel h-full rounded-2xl p-7">
              <h3 className="text-lg font-semibold text-ink">Bloom&apos;s level enforcement</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                A verb lexicon validates every generated outcome. A lab CO opening with
                &ldquo;Understand&rdquo; fails the check and regenerates.
              </p>
              <ul className="mt-6 space-y-3">
                {BLOOM.map((b) => (
                  <li key={b.level} className="flex items-start gap-3 text-sm">
                    <span className={`font-mono text-xs ${b.tone} w-12 shrink-0 pt-0.5`}>
                      {b.level}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-ink">{b.name}</span>
                      <span className="block text-xs text-faint">{b.use}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* 15% cap */}
          <Reveal delay={0.16}>
            <div className="panel h-full rounded-2xl p-7">
              <h3 className="text-lg font-semibold text-ink">The 15% fast-track boundary</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                Contact hours are converted to a hard modification budget in code, handed to the
                model as a constraint, then re-measured against the returned patch.
              </p>

              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="text-faint">45 h course</span>
                  <span className="text-good">6.75 h modifiable</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[15%] rounded-full bg-gradient-to-r from-pulse to-flux" />
                </div>
                <p className="pt-1 text-[11px] text-faint">
                  Over budget → rejected and regenerated, never rounded down quietly.
                </p>
              </div>

              <ul className="mt-6 space-y-2 text-sm text-muted">
                {[
                  "Course code and title unchanged",
                  "Credit weightage unchanged",
                  "Core theoretical foundation intact",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-good" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

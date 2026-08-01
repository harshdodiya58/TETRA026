import { Reveal } from "@/components/ui/reveal";

const BLOOM = [
  { level: "L1–L2", name: "Remember · Understand", use: "Introductory lecture topics only", tone: "text-faint" },
  { level: "L3", name: "Apply", use: "New hands-on lab experiments", tone: "text-ink" },
  { level: "L4", name: "Analyze", use: "Industry case studies", tone: "text-ink" },
  { level: "L5", name: "Evaluate · Create", use: "Capstone micro-project prompts", tone: "text-accent" },
];

const PO_MAP = [
  { code: "PO1", label: "Engineering Knowledge" },
  { code: "PO3", label: "Design / Development of Solutions" },
  { code: "PO5", label: "Modern Tool Usage" },
];

export function Compliance() {
  return (
    <section id="compliance" className="relative border-t border-[#d6d0c4] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="small-caps text-xs text-accent">Accreditation</p>
          <h2 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Written the way your Board already reads.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-[1.7] text-muted">
            A Dean will not sign a proposal whose compliance was merely asserted by a language
            model. So the parts an accreditation body audits are computed and verified in code — the
            model proposes, deterministic rules dispose.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <Reveal>
            <article className="panel lift h-full rounded-lg p-7">
              <h3 className="text-xl text-ink">Course Outcome formulator</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Every generated addition carries a CO statement in the standard OBE construction.
              </p>
              <blockquote className="mt-6 border-l-2 border-accent/40 bg-surface py-3 pl-4 pr-3 font-serif text-[13.5px] leading-relaxed text-ink">
                At the end of this module, the student will be able to{" "}
                <span className="text-accent">[action verb]</span>{" "}
                <span className="text-accent">[tool / concept]</span> to{" "}
                <span className="text-accent">[engineering application]</span>.
              </blockquote>
              <ul className="mt-5 space-y-1.5">
                {PO_MAP.map((po) => (
                  <li key={po.code} className="flex items-baseline gap-2.5 text-[13px] text-muted">
                    <span className="font-mono text-[11px] text-accent">{po.code}</span>
                    {po.label}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>

          <Reveal delay={0.07}>
            <article className="panel lift h-full rounded-lg p-7">
              <h3 className="text-xl text-ink">Bloom&apos;s level enforcement</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                A verb lexicon validates every generated outcome. A lab CO opening with
                &ldquo;Understand&rdquo; fails the check and regenerates.
              </p>
              <dl className="mt-6 divide-y divide-[#e2ddd2]">
                {BLOOM.map((b) => (
                  <div key={b.level} className="flex items-start gap-4 py-2.5">
                    <dt className={`w-12 shrink-0 font-mono text-[11px] ${b.tone} pt-0.5`}>
                      {b.level}
                    </dt>
                    <dd className="min-w-0">
                      <span className="block text-sm text-ink">{b.name}</span>
                      <span className="block text-[12px] text-faint">{b.use}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>

          <Reveal delay={0.14}>
            <article className="panel lift h-full rounded-lg p-7">
              <h3 className="text-xl text-ink">The fifteen per cent boundary</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Contact hours are converted to a hard modification budget in code, handed to the
                model as a constraint, then re-measured against the returned patch.
              </p>

              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-faint">45 h course</span>
                  <span className="text-good">6.75 h modifiable</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-[#ded8cc]">
                  <div className="h-full w-[15%] bg-accent" />
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
                  <li key={item} className="flex items-baseline gap-2.5">
                    <span className="text-good">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

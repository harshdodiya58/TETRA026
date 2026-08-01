import {
  SlidersHorizontal,
  FileUp,
  Activity,
  LayoutGrid,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  {
    icon: SlidersHorizontal,
    title: "Configure the audit",
    body: "Course code, degree and semester, target hiring market — Bengaluru, Hyderabad, NCR, Pune, or the national average. The modification cap is fixed at 15%.",
  },
  {
    icon: FileUp,
    title: "Ingest the syllabus",
    body: "Upload the PDF or DOCX you already submitted to your university. Units, lecture hours, prescribed texts, and existing Course Outcomes are extracted structurally.",
  },
  {
    icon: Activity,
    title: "Watch it think",
    body: "A live HUD reports parsing latency, embedding throughput, pgvector query time, and graph traversal depth as they happen — measured, not simulated.",
  },
  {
    icon: LayoutGrid,
    title: "Read the gap",
    body: "An alignment score, topics consuming teaching hours the market no longer rewards, and in-demand skills your syllabus never mentions.",
  },
  {
    icon: Sparkles,
    title: "Generate the 15% patch",
    body: "New lab experiments, modern tool references, and Course Outcomes written to Bloom's levels 3–5 — sized to fit inside the fast-track hour budget.",
  },
  {
    icon: FileCheck2,
    title: "Export for the Board",
    body: "A formatted Board of Studies revision proposal with CO–PO mapping, ready to table at the Academic Council.",
  },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.2em] text-pulse">The workflow</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">
            Upload a syllabus. Table a proposal.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Six steps, one sitting. Nothing here asks a department to rewrite a course from scratch.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={(i % 3) * 0.08}>
              <div className="group h-full bg-base p-8 transition-colors duration-300 hover:bg-surface">
                <div className="flex items-center gap-3">
                  <span className="rule flex size-9 items-center justify-center rounded-lg bg-white/[0.03] transition-colors group-hover:border-pulse/30">
                    <step.icon className="size-4 text-pulse" />
                  </span>
                  <span className="font-mono text-xs text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

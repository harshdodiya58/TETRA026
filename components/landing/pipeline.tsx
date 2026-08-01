import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  {
    title: "Configure the audit",
    body: "Course code, degree and semester, target hiring market — Bengaluru, Hyderabad, NCR, Pune, or the national average. The modification cap is fixed at fifteen per cent.",
  },
  {
    title: "Ingest the syllabus",
    body: "Upload the PDF or DOCX you already submitted to your university. Units, lecture hours, prescribed texts, and existing Course Outcomes are extracted structurally.",
  },
  {
    title: "Watch it think",
    body: "A live readout reports parsing latency, embedding throughput, vector query time, and graph traversal depth as they happen — measured, not simulated.",
  },
  {
    title: "Read the gap",
    body: "An alignment score, topics consuming teaching hours the market no longer rewards, and in-demand skills your syllabus never mentions.",
  },
  {
    title: "Generate the patch",
    body: "New lab experiments, modern tool references, and Course Outcomes written to Bloom's levels three through five — sized to fit inside the fast-track hour budget.",
  },
  {
    title: "Export for the Board",
    body: "A formatted Board of Studies revision proposal with CO–PO mapping, ready to table at the Academic Council.",
  },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="relative border-t border-[#d6d0c4] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="small-caps text-xs text-accent">The workflow</p>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Upload a syllabus. Table a proposal.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-[1.7] text-muted">
            Six steps, one sitting. Nothing here asks a department to rewrite a course from scratch.
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-x-14 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={(i % 3) * 0.07}>
              <li className="border-t border-[#d6d0c4] pt-5">
                <span className="font-serif text-3xl text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl text-ink">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

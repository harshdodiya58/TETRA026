import type { AuditResult } from "@/lib/audit/use-audit-stream";

/** What the parser actually recovered from the document. */
export function StructureReport({ result }: { result: AuditResult }) {
  const { structure, document, chunkCount } = result;
  const confidence = structure.boundaryConfidence;

  const confidenceTone =
    confidence >= 0.8 ? "text-good" : confidence >= 0.55 ? "text-warn" : "text-bad";

  return (
    <div className="space-y-8">
      <header className="border-b border-[#d6d0c4] pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">
            {structure.courseCode ?? "Unknown code"}
            {structure.courseTitle ? ` · ${structure.courseTitle}` : ""}
          </h2>
          <span className="font-mono text-[11px] text-faint">
            {document.name} · {document.format}
            {document.pages !== null && ` · ${document.pages} pp`}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#d6d0c4] bg-[#d6d0c4] sm:grid-cols-4">
          <Cell label="Units" value={String(structure.units.length)} />
          <Cell
            label="Lecture hours"
            value={structure.summedUnitHours !== null ? `${structure.summedUnitHours} h` : "—"}
          />
          <Cell label="Course outcomes" value={String(structure.courseOutcomes.length)} />
          <Cell
            label="Boundary conf."
            value={confidence.toFixed(2)}
            tone={confidenceTone}
          />
        </dl>

        {confidence < 0.55 && (
          <p className="mt-4 rounded-md border border-warn/30 bg-warn/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-warn">
            Low structural confidence. Unit boundaries were only partly recovered, so any gap
            analysis built on them would attribute skills unreliably. Check that the document uses
            recognisable UNIT or MODULE headings.
          </p>
        )}
      </header>

      <section>
        <h3 className="small-caps text-xs text-accent">Units extracted</h3>
        <ol className="mt-4 divide-y divide-[#e2ddd2]">
          {structure.units.map((unit) => (
            <li key={unit.index} className="py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] text-accent">{unit.label}</span>
                <span className="font-mono text-[11px] text-faint">
                  {unit.hours !== null ? `${unit.hours} h` : "hours not stated"} ·{" "}
                  {unit.topics.length} topics
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink">{unit.title || "Untitled unit"}</p>
              {unit.topics.length > 0 && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {unit.topics.slice(0, 12).join(" · ")}
                  {unit.topics.length > 12 && " …"}
                </p>
              )}
            </li>
          ))}
        </ol>
        {structure.units.length === 0 && (
          <p className="mt-4 text-sm text-muted">No units were recovered from this document.</p>
        )}
      </section>

      {structure.courseOutcomes.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-accent">Existing course outcomes</h3>
          <ol className="mt-4 space-y-2.5">
            {structure.courseOutcomes.map((co, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="shrink-0 font-mono text-[11px] text-faint">CO{i + 1}</span>
                <span>{co}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {structure.textbooks.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-accent">Prescribed texts</h3>
          <ul className="mt-4 space-y-2">
            {structure.textbooks.map((book, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-muted">
                {book}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-[#d6d0c4] pt-4">
        <p className="font-mono text-[11px] text-faint">
          {chunkCount} embedding chunks prepared · awaiting vector stage
        </p>
      </footer>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-raised p-4">
      <p className={`font-mono text-xl ${tone ?? "text-ink"}`}>{value}</p>
      <p className="small-caps mt-1 text-[10px] text-faint">{label}</p>
    </div>
  );
}

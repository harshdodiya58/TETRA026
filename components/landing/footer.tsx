import { Wordmark } from "@/components/brand/logo";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "The gap", href: "#gap" },
      { label: "How it works", href: "#pipeline" },
      { label: "Telemetry", href: "#telemetry" },
      { label: "Compliance", href: "#compliance" },
    ],
  },
  {
    heading: "Frameworks",
    links: [
      { label: "Outcome-Based Education", href: "#compliance" },
      { label: "Bloom's Taxonomy", href: "#compliance" },
      { label: "NBA Program Outcomes", href: "#compliance" },
      { label: "15% BoS fast-track", href: "#compliance" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-faint">
              Syllabus audit and micro-augmentation for Indian higher education. Built for the
              regulation that actually governs curriculum change.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-faint transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-faint">CurriPulse AI — academic audit engine.</p>
          <p className="font-mono text-[11px] text-faint">TETRA026</p>
        </div>
      </div>
    </footer>
  );
}

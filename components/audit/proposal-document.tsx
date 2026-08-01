"use client";

import type { Block } from "@/lib/export/proposal";

/**
 * Renders the proposal blocks as a printable page.
 *
 * Shares buildProposal() with the DOCX exporter, so what a Board sees on paper
 * and what it opens in Word are the same document by construction.
 */
export function ProposalDocument({ blocks }: { blocks: Block[] }) {
  return (
    <article className="proposal mx-auto max-w-[820px] bg-raised px-10 py-12 text-ink lift rounded-lg">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "title":
      return (
        <header className="mb-9 border-b border-[#d6d0c4] pb-5 text-center">
          <h1 className="font-serif text-3xl leading-tight">{block.text}</h1>
          {block.subtitle && (
            <p className="mt-2 text-[13px] text-muted">{block.subtitle}</p>
          )}
        </header>
      );

    case "heading":
      return block.level === 1 ? (
        <h2 className="mt-9 mb-3 font-serif text-xl">{block.text}</h2>
      ) : (
        <h3 className="mt-6 mb-2.5 font-serif text-[17px]">{block.text}</h3>
      );

    case "paragraph":
      return (
        <p
          className={`mb-3.5 text-[13.5px] leading-[1.75] ${
            block.italic ? "italic text-muted" : "text-ink"
          }`}
        >
          {block.text}
        </p>
      );

    case "keyValue":
      return (
        <dl className="mb-6 divide-y divide-[#e2ddd2] border-y border-[#d6d0c4]">
          {block.rows.map(([key, value]) => (
            <div key={key} className="flex gap-4 py-2">
              <dt className="w-52 shrink-0 text-[12.5px] text-muted">{key}</dt>
              <dd className="text-[12.5px] font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      return (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-surface">
                {block.head.map((heading, i) => (
                  <th
                    key={i}
                    style={block.widths ? { width: `${block.widths[i]}%` } : undefined}
                    className="border border-[#d6d0c4] px-2.5 py-2 text-left font-medium text-accent"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((value, c) => (
                    <td
                      key={c}
                      className="border border-[#d6d0c4] px-2.5 py-2 align-top leading-relaxed text-ink"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "list":
      return (
        <ul className="mb-6 space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-muted">
              <span className="text-accent">·</span>
              {item}
            </li>
          ))}
        </ul>
      );

    case "signatures":
      return (
        <section className="mt-14 break-inside-avoid">
          <h3 className="mb-4 font-serif text-[17px]">Endorsements</h3>
          <div className="grid grid-cols-2 gap-x-10 gap-y-9">
            {block.roles.map((role) => (
              <div key={role}>
                <div className="h-10 border-b border-ink/40" />
                <p className="mt-1.5 text-[11.5px] text-muted">{role}</p>
                <p className="text-[10.5px] text-faint">Signature &amp; date</p>
              </div>
            ))}
          </div>
        </section>
      );
  }
}

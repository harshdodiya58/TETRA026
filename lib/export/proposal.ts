import type { SyllabusStructure } from "@/lib/syllabus/chunk";
import type { GapReport } from "@/lib/gap/score";
import type { SyllabusPatch } from "@/lib/patch/generate";
import { BLOOM_LEVEL_NAMES } from "@/lib/obe/bloom";
import { PROGRAM_OUTCOMES, type ProgramOutcome } from "@/lib/obe/program-outcomes";
import { MARKET_LABELS } from "@/data/job-market";

/**
 * Builds the Board of Studies revision proposal as a renderer-agnostic block
 * list. DOCX and the print view both walk this same structure, so the Word
 * file and the printed page cannot drift apart — a real risk when a document
 * is the deliverable and two exporters are maintained separately.
 *
 * The document deliberately states its own method and limits. A proposal that
 * hides how its figures were derived is not one a Board should approve.
 */

export type Block =
  | { type: "title"; text: string; subtitle?: string }
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string; italic?: boolean }
  | { type: "keyValue"; rows: [string, string][] }
  | { type: "table"; head: string[]; rows: string[][]; widths?: number[] }
  | { type: "list"; items: string[] }
  | { type: "signatures"; roles: string[] };

export type ProposalContext = {
  structure: SyllabusStructure;
  gap: GapReport;
  patch: SyllabusPatch;
  /** ISO timestamp, supplied by the caller so renderers stay pure. */
  generatedAt: string;
  institution?: string;
};

export function proposalFilename(ctx: ProposalContext, extension: string): string {
  const code = (ctx.structure.courseCode ?? "COURSE").replace(/[^A-Za-z0-9]/g, "");
  const date = ctx.generatedAt.slice(0, 10);
  return `BoS-Proposal-${code}-${date}.${extension}`;
}

export function buildProposal(ctx: ProposalContext): Block[] {
  const { structure, gap, patch } = ctx;

  const code = structure.courseCode ?? "—";
  const title = structure.courseTitle ?? "—";
  const date = formatDate(ctx.generatedAt);

  const blocks: Block[] = [];

  blocks.push({
    type: "title",
    text: "Proposal for Syllabus Revision",
    subtitle: "Board of Studies — Fast-Track Amendment (within 15% of contact hours)",
  });

  blocks.push({
    type: "keyValue",
    rows: [
      ["Course code", code],
      ["Course title", title],
      ["Total contact hours", `${gap.totalHours ?? "—"} hours`],
      ["Hours proposed for amendment", `${patch.hoursUsed} hours`],
      ["Permitted ceiling (15%)", `${patch.hoursBudget} hours`],
      ["Target hiring market", MARKET_LABELS[gap.market]],
      ["Date of proposal", date],
      ...(ctx.institution ? ([["Institution", ctx.institution]] as [string, string][]) : []),
    ],
  });

  // ---------------------------------------------------------------- preamble
  blocks.push({ type: "heading", level: 1, text: "1. Preamble" });
  blocks.push({
    type: "paragraph",
    text:
      `This proposal seeks approval for a micro-augmentation of ${code} — ${title} under the ` +
      `fast-track provision, which permits amendment of up to 15% of course contact hours without ` +
      `triggering a full re-accreditation cycle. The course code, course title, credit weightage, ` +
      `and core theoretical foundation remain unchanged.`,
  });
  blocks.push({
    type: "paragraph",
    text:
      `The amendment is motivated by a measured divergence between the current syllabus and ` +
      `prevailing industry requirements in the ${MARKET_LABELS[gap.market]} market. The syllabus ` +
      `presently covers ${gap.alignment.toFixed(1)}% of weighted market demand within this ` +
      `course's domain.`,
  });

  // ------------------------------------------------------------- methodology
  blocks.push({ type: "heading", level: 1, text: "2. Method" });
  blocks.push({
    type: "paragraph",
    text:
      `Each syllabus unit was embedded as a dense vector and compared by cosine similarity against ` +
      `a corpus of ${gap.totalSkillCount} industry skill requirements. Of these, ` +
      `${gap.inScopeSkillCount} were judged within this course's domain and ` +
      `${gap.outOfScopeSkillCount} were excluded as belonging to other subjects. A skill counts as ` +
      `covered where its similarity to some unit exceeds ${gap.threshold.toFixed(3)}, being the ` +
      `mean similarity of this document (${gap.similarityMean.toFixed(3)}) plus one standard ` +
      `deviation (${gap.similarityStdDev.toFixed(3)}). Both thresholds are derived from this ` +
      `document rather than fixed in advance.`,
  });
  blocks.push({
    type: "paragraph",
    italic: true,
    text:
      `Limitations. Industry demand weights are drawn from a curated compilation of public Indian ` +
      `technology job listings and the NASSCOM FutureSkills competency taxonomy; they are ` +
      `considered estimates rather than a census. The hour ceiling and the cognitive level of every ` +
      `proposed outcome were verified programmatically, not asserted.`,
  });

  // ------------------------------------------------------------ Part A: gaps
  blocks.push({ type: "heading", level: 1, text: "3. Justification" });

  const redFlagged = gap.units.filter((u) => u.redFlagged);
  blocks.push({ type: "heading", level: 2, text: "3.1 Units carrying low-demand content" });

  if (redFlagged.length > 0) {
    blocks.push({
      type: "table",
      head: ["Unit", "Topic", "Hours", "Demand covered"],
      widths: [12, 48, 14, 26],
      rows: redFlagged.map((u) => [
        u.label,
        u.title || "—",
        u.hours !== null ? `${u.hours}` : "—",
        u.ownedDemand.toFixed(2),
      ]),
    });
    blocks.push({
      type: "paragraph",
      text:
        `These units account for ${gap.obsoleteHours} contact hours addressing skills for which ` +
        `current market demand is low. They are retained for their foundational value; the ` +
        `amendment adjusts emphasis rather than removing them.`,
    });
  } else {
    blocks.push({
      type: "paragraph",
      text: "No unit was found to be spending significant contact hours on low-demand content.",
    });
  }

  blocks.push({ type: "heading", level: 2, text: "3.2 In-demand skills absent from the syllabus" });
  blocks.push({
    type: "table",
    head: ["Skill", "Market demand", "Nearest unit"],
    widths: [54, 22, 24],
    rows: gap.missing
      .slice(0, 8)
      .map((m) => [
        `${m.name}${m.emerging ? " (emerging)" : ""}`,
        `${(m.demand * 100).toFixed(0)}%`,
        m.nearestUnit ?? "—",
      ]),
  });

  // -------------------------------------------------------- Part B: proposal
  blocks.push({ type: "heading", level: 1, text: "4. Proposed additions" });
  blocks.push({
    type: "table",
    head: ["#", "Type", "Title", "Unit", "Hours"],
    widths: [6, 18, 44, 16, 16],
    rows: patch.additions.map((a, i) => [
      String(i + 1),
      labelForKind(a.kind),
      a.title,
      a.targetUnit || "—",
      String(a.hours),
    ]),
  });

  patch.additions.forEach((addition, i) => {
    blocks.push({ type: "heading", level: 2, text: `4.${i + 1} ${addition.title}` });
    blocks.push({ type: "paragraph", text: addition.description });
    if (addition.tools.length > 0) {
      blocks.push({ type: "paragraph", text: `Tools and platforms: ${addition.tools.join(", ")}.` });
    }
    if (addition.addressesSkills.length > 0) {
      blocks.push({
        type: "paragraph",
        text: `Industry requirement addressed: ${addition.addressesSkills.join(", ")}.`,
      });
    }
  });

  // --------------------------------------------------- Part C: modernisation
  if (patch.modernisations.length > 0) {
    blocks.push({ type: "heading", level: 1, text: "5. Revisions of emphasis" });
    blocks.push({
      type: "paragraph",
      text:
        "The following revisions alter emphasis and tooling within existing units. They add no " +
        "contact hours and remove no core theory.",
    });
    blocks.push({
      type: "table",
      head: ["Unit", "Present emphasis", "Proposed emphasis", "Rationale"],
      widths: [10, 30, 30, 30],
      rows: patch.modernisations.map((m) => [
        m.unit,
        m.currentEmphasis,
        m.proposedEmphasis,
        m.rationale,
      ]),
    });
  }

  // ------------------------------------------------------ Part D: COs and POs
  blocks.push({ type: "heading", level: 1, text: "6. Course Outcomes" });
  blocks.push({
    type: "paragraph",
    text:
      "Each outcome below was checked against a Bloom's Taxonomy verb lexicon. Laboratory outcomes " +
      "are required to reach level 3 (Apply), case studies level 4 (Analyze), and micro-projects " +
      "level 5 (Evaluate) or above.",
  });

  blocks.push({
    type: "table",
    head: ["CO", "Statement", "Bloom's level"],
    widths: [8, 70, 22],
    rows: patch.outcomes.map((o, i) => [
      `CO${existingOutcomeCount(structure) + i + 1}`,
      o.statement,
      o.bloom.passed && o.bloom.level !== null
        ? `L${o.bloom.level} — ${BLOOM_LEVEL_NAMES[o.bloom.level]}`
        : "NOT VERIFIED",
    ]),
  });

  blocks.push({ type: "heading", level: 2, text: "6.1 CO–PO mapping" });
  blocks.push({
    type: "paragraph",
    text: "Mapping strength follows the NBA convention: 3 substantial, 2 moderate, 1 slight.",
  });

  const usedPOs = orderedPOs(patch);
  blocks.push({
    type: "table",
    head: ["CO", ...usedPOs],
    widths: [10, ...usedPOs.map(() => 90 / Math.max(usedPOs.length, 1))],
    rows: patch.outcomes.map((o, i) => [
      `CO${existingOutcomeCount(structure) + i + 1}`,
      ...usedPOs.map((po) => {
        const mapping = o.programOutcomes.find((p) => p.po === po);
        return mapping ? String(mapping.strength) : "—";
      }),
    ]),
  });

  blocks.push({
    type: "list",
    items: usedPOs.map((po) => `${po} — ${PROGRAM_OUTCOMES[po]}`),
  });

  // ------------------------------------------------- Part E: compliance
  blocks.push({ type: "heading", level: 1, text: "7. Compliance statement" });
  blocks.push({
    type: "table",
    head: ["Check", "Result"],
    widths: [60, 40],
    rows: [
      ["Total course contact hours", `${patch.totalHours} hours`],
      ["Permitted amendment (15%)", `${patch.hoursBudget} hours`],
      ["Hours proposed", `${patch.hoursUsed} hours`],
      [
        "Within fast-track ceiling",
        patch.withinCap ? "Yes" : "NO — exceeds the permitted ceiling",
      ],
      [
        "Course Outcomes at required Bloom's level",
        `${patch.outcomes.filter((o) => o.bloom.passed).length} of ${patch.outcomes.length}`,
      ],
      ["Course code and title", "Unchanged"],
      ["Credit weightage", "Unchanged"],
      ["Core theoretical foundation", "Retained in full"],
    ],
  });

  if (!patch.withinCap) {
    blocks.push({
      type: "paragraph",
      italic: true,
      text:
        `NOTICE: the proposed amendment totals ${patch.hoursUsed} hours against a permitted ` +
        `ceiling of ${patch.hoursBudget} hours. It does not qualify for fast-track consideration ` +
        `in its present form and must be reduced before being tabled.`,
    });
  }

  blocks.push({
    type: "paragraph",
    italic: true,
    text:
      `Prepared with CurriPulse AI on ${date}. Draft content was generated by ` +
      `${patch.provider}/${patch.model} over ${patch.attempts} draft${patch.attempts === 1 ? "" : "s"}; ` +
      `the hour ceiling and Bloom's levels were verified in software. This document requires review ` +
      `and endorsement by the course faculty before submission.`,
  });

  blocks.push({
    type: "signatures",
    roles: ["Course Faculty", "Head of the Department", "Chairperson, Board of Studies", "Dean of Academics"],
  });

  return blocks;
}

function labelForKind(kind: string): string {
  if (kind === "lab") return "Laboratory";
  if (kind === "case-study") return "Case study";
  if (kind === "micro-project") return "Micro-project";
  return kind;
}

/** New COs are numbered after the ones already in the syllabus. */
function existingOutcomeCount(structure: SyllabusStructure): number {
  return structure.courseOutcomes.length;
}

function orderedPOs(patch: SyllabusPatch): ProgramOutcome[] {
  const seen = new Set<ProgramOutcome>();
  for (const outcome of patch.outcomes) {
    for (const mapping of outcome.programOutcomes) seen.add(mapping.po);
  }
  return [...seen].sort((a, b) =>
    Number(a.replace("PO", "")) - Number(b.replace("PO", "")),
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

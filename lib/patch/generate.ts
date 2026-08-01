import { generate, extractJson, GenerationError, MIN_ATTEMPT_MS } from "@/lib/ai/generate";
import {
  validateOutcome,
  verbsAtOrAbove,
  type AdditionKind,
  type BloomVerdict,
  EXPECTED_MINIMUM,
} from "@/lib/obe/bloom";
import { mapOutcomeToPOs, type POMapping } from "@/lib/obe/program-outcomes";
import type { GapReport } from "@/lib/gap/score";
import type { SyllabusStructure } from "@/lib/syllabus/chunk";
import { MARKET_LABELS } from "@/data/job-market";

/**
 * 15% micro-augmentation patch generation.
 *
 * The model drafts; this module decides. The hour budget is computed here,
 * handed to the model as a hard constraint, and then RE-MEASURED against what
 * comes back — a model asked to stay under 6.75 hours will cheerfully return
 * 9. Likewise every Course Outcome is graded against the Bloom's lexicon
 * rather than trusted. Failures are fed back as explicit corrections and the
 * draft is regenerated.
 *
 * Nothing reaches a Board of Studies on the model's say-so.
 */

const MAX_ATTEMPTS = 3;

/**
 * Wall-clock budget for the whole generate-validate-retry cycle.
 *
 * This must stay comfortably under the route's maxDuration. Vercel kills a
 * function at its limit with no chance to respond, so three retries at a fixed
 * per-attempt timeout is a latent bug: 3 × 20s exceeds a 60s ceiling and the
 * user sees an opaque failure instead of a diagnosed one. Attempts draw from
 * this shared budget and the loop stops while there is still time to reply.
 */
const DEFAULT_BUDGET_MS = 42_000;

/** Reserved so a result can always be serialised and streamed back. */
const RESPONSE_RESERVE_MS = 2_000;

export type PatchAddition = {
  kind: AdditionKind;
  title: string;
  targetUnit: string;
  hours: number;
  description: string;
  tools: string[];
  courseOutcome: string;
  addressesSkills: string[];
};

export type UnitModernisation = {
  unit: string;
  currentEmphasis: string;
  proposedEmphasis: string;
  rationale: string;
};

export type ValidatedOutcome = {
  statement: string;
  kind: AdditionKind;
  bloom: BloomVerdict;
  programOutcomes: POMapping[];
};

export type SyllabusPatch = {
  additions: PatchAddition[];
  modernisations: UnitModernisation[];
  outcomes: ValidatedOutcome[];
  hoursUsed: number;
  hoursBudget: number;
  totalHours: number;
  withinCap: boolean;
  bloomPassRate: number;
  attempts: number;
  model: string;
  provider: string;
  ttftMs: number | null;
  totalMs: number;
  /** Corrections the validators forced between drafts. */
  corrections: string[];
};

export class PatchError extends Error {}

const SYSTEM_PROMPT = `You draft curriculum amendments for Indian university Boards of Studies.

Absolute rules:
- Respond with ONE JSON object and nothing else. No prose, no code fences.
- Never propose changing the course code, course title, credit weightage, or the core theoretical foundation.
- Additions must fit strictly inside the stated hour budget. The budget is a legal ceiling under the Board of Studies fast-track rule, not a target.
- Every course outcome must open with an action verb at the required Bloom's level, in the form:
  "At the end of this module, the student will be able to <verb> <tool or concept> to <real engineering application>."
- Name concrete, current industry tools. Avoid vague phrasing like "modern tools" or "latest technologies".`;

export async function generatePatch(
  structure: SyllabusStructure,
  gap: GapReport,
  onCorrection?: (message: string) => void,
  budgetMs: number = DEFAULT_BUDGET_MS,
): Promise<SyllabusPatch> {
  const startedAt = performance.now();
  const totalHours = gap.totalHours;
  if (totalHours === null || totalHours <= 0) {
    throw new PatchError(
      "Contact hours could not be determined from the syllabus, so the 15% budget is undefined. A patch cannot be sized without it.",
    );
  }

  const budget = gap.modifiableHours ?? Number((totalHours * 0.15).toFixed(2));
  const corrections: string[] = [];

  let feedback = "";
  let lastError = "";

  let lastDraft: { patch: SyllabusPatch; attempt: number } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const remaining = budgetMs - (performance.now() - startedAt) - RESPONSE_RESERVE_MS;

    if (remaining < MIN_ATTEMPT_MS) {
      // Out of time. Return the best draft so far, honestly labelled, rather
      // than letting the platform kill the function mid-attempt.
      if (lastDraft) {
        corrections.push(
          `Stopped after ${lastDraft.attempt} draft${lastDraft.attempt === 1 ? "" : "s"}: time budget exhausted before validation passed.`,
        );
        return { ...lastDraft.patch, corrections };
      }
      throw new PatchError(
        `Patch generation ran out of time after ${Math.round((performance.now() - startedAt) / 1000)}s without a usable draft. ${lastError}`.trim(),
      );
    }

    let result;
    try {
      result = await generate(
        SYSTEM_PROMPT,
        buildPrompt(structure, gap, budget, feedback),
        2200,
        Math.floor(remaining),
      );
    } catch (error) {
      if (error instanceof GenerationError) {
        throw new PatchError(
          `${error.message} ${error.attempts.map((a) => `${a.model}: ${a.error}`).join("; ")}`,
        );
      }
      throw error;
    }

    let draft: RawPatch;
    try {
      draft = normalise(extractJson(result.text));
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unparseable draft.";
      feedback = `Your previous reply could not be parsed: ${lastError}. Return one JSON object only.`;
      corrections.push(`Attempt ${attempt}: ${lastError}`);
      onCorrection?.(`Draft ${attempt} rejected — ${lastError}`);
      continue;
    }

    // --- deterministic validation -----------------------------------------
    const hoursUsed = round(draft.additions.reduce((sum, a) => sum + a.hours, 0));
    const withinCap = hoursUsed <= budget + 1e-9;

    const outcomes: ValidatedOutcome[] = draft.additions.map((addition) => {
      const bloom = validateOutcome(addition.courseOutcome, addition.kind);
      return {
        statement: addition.courseOutcome,
        kind: addition.kind,
        bloom,
        programOutcomes: bloom.passed
          ? mapOutcomeToPOs(
              `${addition.courseOutcome} ${addition.description} ${addition.tools.join(" ")}`,
              bloom.level ?? 3,
              addition.tools.length > 0,
            )
          : [],
      };
    });

    const failures = outcomes.filter((o) => !o.bloom.passed);
    const bloomPassRate = outcomes.length > 0 ? (outcomes.length - failures.length) / outcomes.length : 0;

    if (withinCap && failures.length === 0) {
      return {
        additions: draft.additions,
        modernisations: draft.modernisations,
        outcomes,
        hoursUsed,
        hoursBudget: budget,
        totalHours,
        withinCap: true,
        bloomPassRate: 1,
        attempts: attempt,
        model: result.model,
        provider: result.provider,
        ttftMs: result.ttftMs,
        totalMs: result.totalMs,
        corrections,
      };
    }

    // --- build correction feedback ----------------------------------------
    const notes: string[] = [];

    if (!withinCap) {
      const note = `Hour budget exceeded: proposed ${hoursUsed}h against a ceiling of ${budget}h.`;
      notes.push(
        `${note} Reduce the additions so the total is at most ${budget} hours. Do not round the budget up.`,
      );
      corrections.push(`Attempt ${attempt}: ${note}`);
      onCorrection?.(`Draft ${attempt} rejected — ${note}`);
    }

    for (const failure of failures) {
      const note = `Course outcome "${truncate(failure.statement, 60)}" failed Bloom's: ${failure.bloom.reason}`;
      notes.push(
        `${note} Rewrite it to begin with one of: ${verbsAtOrAbove(EXPECTED_MINIMUM[failure.kind], 8).join(", ")}.`,
      );
      corrections.push(`Attempt ${attempt}: ${note}`);
      onCorrection?.(`Draft ${attempt} rejected — Bloom's level too low`);
    }

    feedback = `Your previous draft was rejected by automated validation:\n${notes.map((n) => `- ${n}`).join("\n")}\nReturn a corrected JSON object.`;
    lastError = notes.join(" ");

    // Keep the rejected draft: if attempts or time run out, returning it
    // clearly marked as failing validation beats returning nothing.
    lastDraft = {
      attempt,
      patch: {
        additions: draft.additions,
        modernisations: draft.modernisations,
        outcomes,
        hoursUsed,
        hoursBudget: budget,
        totalHours,
        withinCap,
        bloomPassRate: round(bloomPassRate, 2),
        attempts: attempt,
        model: result.model,
        provider: result.provider,
        ttftMs: result.ttftMs,
        totalMs: result.totalMs,
        corrections,
      },
    };

    // Attempts exhausted: report honestly rather than shipping an invalid
    // patch marked valid.
    if (attempt === MAX_ATTEMPTS) {
      return { ...lastDraft.patch, corrections };
    }
  }

  throw new PatchError(`Patch generation failed after ${MAX_ATTEMPTS} attempts. ${lastError}`);
}

function buildPrompt(
  structure: SyllabusStructure,
  gap: GapReport,
  budget: number,
  feedback: string,
): string {
  const units = structure.units
    .map((u) => `  ${u.label} (${u.hours ?? "?"}h): ${u.title}`)
    .join("\n");

  const redFlagged = gap.units
    .filter((u) => u.redFlagged)
    .map((u) => `  ${u.label} — ${u.hours ?? "?"}h, covers little demanded skill`)
    .join("\n");

  const missing = gap.missing
    .slice(0, 8)
    .map((m) => `  ${m.name} (demand ${(m.demand * 100).toFixed(0)}%${m.emerging ? ", emerging" : ""})`)
    .join("\n");

  return `COURSE
${structure.courseCode ?? "unknown code"} — ${structure.courseTitle ?? "unknown title"}
Total contact hours: ${gap.totalHours}
Target hiring market: ${MARKET_LABELS[gap.market]}
Current industry alignment: ${gap.alignment.toFixed(1)}%

EXISTING UNITS
${units}

UNITS CONSUMING HOURS ON LOW-DEMAND CONTENT
${redFlagged || "  none"}

IN-DEMAND SKILLS ABSENT FROM THE SYLLABUS
${missing || "  none"}

HARD CONSTRAINT
Total added hours must not exceed ${budget} hours (15% of ${gap.totalHours}).
${feedback ? `\n${feedback}\n` : ""}
Produce exactly this JSON shape:

{
  "additions": [
    {
      "kind": "lab" | "case-study" | "micro-project",
      "title": "short title",
      "targetUnit": "Unit III",
      "hours": 2,
      "description": "what the student actually does, 2-3 sentences",
      "tools": ["PostgreSQL", "pgvector"],
      "courseOutcome": "At the end of this module, the student will be able to ...",
      "addressesSkills": ["Vector indexing"]
    }
  ],
  "modernisations": [
    {
      "unit": "Unit III",
      "currentEmphasis": "what the unit currently over-weights",
      "proposedEmphasis": "the modern framing to use instead",
      "rationale": "one sentence tied to market demand"
    }
  ]
}

Provide 2 or 3 additions and exactly 2 modernisations.
Bloom's minimums by kind: lab = level 3 (Apply), case-study = level 4 (Analyze), micro-project = level 5 (Evaluate) or above.
Modernisations change emphasis and tooling only — they must not add hours or remove core theory.`;
}

type RawPatch = { additions: PatchAddition[]; modernisations: UnitModernisation[] };

const VALID_KINDS: AdditionKind[] = ["lab", "case-study", "micro-project"];

function normalise(value: unknown): RawPatch {
  if (typeof value !== "object" || value === null) throw new Error("Draft is not an object.");
  const record = value as Record<string, unknown>;

  const rawAdditions = Array.isArray(record.additions) ? record.additions : [];
  if (rawAdditions.length === 0) throw new Error("Draft contains no additions.");

  const additions: PatchAddition[] = rawAdditions.map((entry, i) => {
    const a = entry as Record<string, unknown>;
    const kind = VALID_KINDS.includes(a.kind as AdditionKind) ? (a.kind as AdditionKind) : "lab";
    const hours = Number(a.hours);

    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error(`Addition ${i + 1} has a non-numeric or non-positive "hours".`);
    }
    if (typeof a.courseOutcome !== "string" || a.courseOutcome.trim().length === 0) {
      throw new Error(`Addition ${i + 1} is missing "courseOutcome".`);
    }

    return {
      kind,
      title: String(a.title ?? "Untitled addition"),
      targetUnit: String(a.targetUnit ?? ""),
      hours: round(hours),
      description: String(a.description ?? ""),
      tools: Array.isArray(a.tools) ? a.tools.map(String).slice(0, 8) : [],
      courseOutcome: a.courseOutcome.trim(),
      addressesSkills: Array.isArray(a.addressesSkills)
        ? a.addressesSkills.map(String).slice(0, 6)
        : [],
    };
  });

  const rawMods = Array.isArray(record.modernisations) ? record.modernisations : [];
  const modernisations: UnitModernisation[] = rawMods.map((entry) => {
    const m = entry as Record<string, unknown>;
    return {
      unit: String(m.unit ?? ""),
      currentEmphasis: String(m.currentEmphasis ?? ""),
      proposedEmphasis: String(m.proposedEmphasis ?? ""),
      rationale: String(m.rationale ?? ""),
    };
  });

  return { additions, modernisations };
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length)}…`;
}

import { demandFor, type JobSkill, type MarketId } from "@/data/job-market";
import { cosineSimilarity } from "@/lib/gap/vector";
import type { CorpusEntry } from "@/lib/gap/corpus";
import type { SyllabusUnit } from "@/lib/syllabus/chunk";

/**
 * Demand-weighted gap analysis, scoped to the course's own domain.
 *
 * The headline number answers one question a Dean can repeat in a meeting:
 * *what share of the market demand relevant to this course does its syllabus
 * already cover?*
 *
 *   alignment = Σ demand(covered ∩ in-scope) / Σ demand(in-scope)
 *
 * Two data-derived cutoffs, both reported so the figure can be audited:
 *
 *   relevance floor = μ        a skill is in scope for this course
 *   coverage cutoff = μ + σ    an in-scope skill is actually taught
 *
 * over the similarity distribution of *this* document against *this* corpus.
 * Absolute cosine values from an asymmetric retrieval model sit in a narrow
 * band that shifts with the embedding model, so hardcoded cutoffs would
 * silently change meaning after a model swap.
 *
 * Scoping matters more than it looks. Measured against the whole corpus, a
 * database syllabus is reported as "missing" Git, Docker, and REST APIs — all
 * true, all useless, because no DBMS course should teach them. Excluding
 * skills the course was never meant to cover is what makes both the alignment
 * figure and the missing list actionable at a Board of Studies. The count of
 * skills excluded is reported rather than hidden.
 *
 * The floor is similarity-based rather than category-based so this generalises:
 * an operating systems or networks syllabus scopes itself the same way, with no
 * per-domain configuration.
 */

export type SkillMatch = {
  id: string;
  name: string;
  category: string;
  similarity: number;
  demand: number;
};

export type UnitAlignment = {
  unitIndex: number;
  label: string;
  title: string;
  hours: number | null;
  /** Highest demand among skills for which this unit is the best match. */
  ownedDemand: number;
  bestSimilarity: number;
  matches: SkillMatch[];
  redFlagged: boolean;
};

export type MissingSkill = {
  id: string;
  name: string;
  category: string;
  demand: number;
  emerging: boolean;
  bestSimilarity: number;
  /** Unit that came closest, for "where would this fit" guidance. */
  nearestUnit: string | null;
};

export type GapReport = {
  market: MarketId;
  /** 0–100, demand-weighted coverage of in-scope skills. */
  alignment: number;
  /** Coverage cutoff, μ + σ. */
  threshold: number;
  /** Relevance floor, μ. Skills below this are out of scope for the course. */
  relevanceFloor: number;
  similarityMean: number;
  similarityStdDev: number;
  units: UnitAlignment[];
  missing: MissingSkill[];
  coveredSkillCount: number;
  /** Ids of covered skills, for graph prerequisite reasoning. */
  coveredSkillIds: string[];
  /** Skills judged relevant to this course — the alignment denominator. */
  inScopeSkillCount: number;
  /** Corpus skills excluded as outside the course's domain. */
  outOfScopeSkillCount: number;
  totalSkillCount: number;
  totalHours: number | null;
  obsoleteHours: number;
  modifiableHours: number | null;
};

/** The Board of Studies fast-track ceiling. */
export const MODIFICATION_CAP = 0.15;

export function analyseGap(
  units: SyllabusUnit[],
  unitVectors: number[][],
  corpus: CorpusEntry[],
  market: MarketId,
): GapReport {
  if (units.length !== unitVectors.length) {
    throw new Error(
      `Unit/vector count mismatch: ${units.length} units, ${unitVectors.length} vectors.`,
    );
  }

  // Full similarity matrix: units × skills.
  const matrix: number[][] = unitVectors.map((unitVector) =>
    corpus.map((entry) => cosineSimilarity(unitVector, entry.vector)),
  );

  const flat = matrix.flat();
  const mean = flat.reduce((a, b) => a + b, 0) / (flat.length || 1);
  const variance = flat.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (flat.length || 1);
  const stdDev = Math.sqrt(variance);
  const threshold = mean + stdDev;
  // Skills below average similarity to this document belong to another course.
  const relevanceFloor = mean;

  // For each skill: its best-matching unit.
  const bestUnitPerSkill = corpus.map((_, skillIndex) => {
    let bestUnit = -1;
    let bestSimilarity = -Infinity;
    for (let u = 0; u < matrix.length; u += 1) {
      if (matrix[u][skillIndex] > bestSimilarity) {
        bestSimilarity = matrix[u][skillIndex];
        bestUnit = u;
      }
    }
    return { unitIndex: bestUnit, similarity: bestSimilarity };
  });

  let inScopeDemand = 0;
  let coveredDemand = 0;
  let coveredSkillCount = 0;
  let inScopeSkillCount = 0;
  let outOfScopeSkillCount = 0;

  const missing: MissingSkill[] = [];
  const coveredSkillIds: string[] = [];

  corpus.forEach((entry, skillIndex) => {
    const best = bestUnitPerSkill[skillIndex];
    const demand = demandFor(entry.skill, market);

    // Outside this course's domain — neither a credit nor a criticism.
    if (best.similarity < relevanceFloor) {
      outOfScopeSkillCount += 1;
      return;
    }

    inScopeSkillCount += 1;
    inScopeDemand += demand;

    if (best.similarity >= threshold) {
      coveredDemand += demand;
      coveredSkillCount += 1;
      coveredSkillIds.push(entry.skill.id);
      return;
    }

    missing.push({
      id: entry.skill.id,
      name: entry.skill.name,
      category: entry.skill.category,
      demand,
      emerging: entry.skill.emerging,
      bestSimilarity: round(best.similarity),
      nearestUnit: best.unitIndex >= 0 ? (units[best.unitIndex]?.label ?? null) : null,
    });
  });

  // Rank what to add by market demand — that is the argument for adding it.
  missing.sort((a, b) => b.demand - a.demand);

  const alignment = inScopeDemand > 0 ? (coveredDemand / inScopeDemand) * 100 : 0;

  const unitAlignments: UnitAlignment[] = units.map((unit, unitIndex) => {
    const sims = matrix[unitIndex];

    const matches: SkillMatch[] = corpus
      .map((entry, skillIndex) => ({
        id: entry.skill.id,
        name: entry.skill.name,
        category: entry.skill.category,
        similarity: round(sims[skillIndex]),
        demand: demandFor(entry.skill, market),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // Demand this unit is solely responsible for covering. A unit that owns no
    // demanded skill is consuming teaching hours the market does not reward.
    const owned = corpus
      .map((entry, skillIndex) => ({ entry, skillIndex }))
      .filter(
        ({ skillIndex }) =>
          bestUnitPerSkill[skillIndex].unitIndex === unitIndex &&
          bestUnitPerSkill[skillIndex].similarity >= threshold,
      )
      .map(({ entry }) => demandFor(entry.skill, market));

    const ownedDemand = owned.length > 0 ? Math.max(...owned) : 0;

    return {
      unitIndex: unit.index,
      label: unit.label,
      title: unit.title,
      hours: unit.hours,
      ownedDemand: round(ownedDemand),
      bestSimilarity: round(Math.max(...sims)),
      matches,
      // Red flag: real teaching time spent on content that owns little demand.
      redFlagged: ownedDemand < 0.35 && (unit.hours ?? 0) > 0,
    };
  });

  const totalHours = units.reduce<number | null>((sum, u) => {
    if (u.hours === null) return sum;
    return (sum ?? 0) + u.hours;
  }, null);

  const obsoleteHours = unitAlignments
    .filter((u) => u.redFlagged)
    .reduce((sum, u) => sum + (u.hours ?? 0), 0);

  return {
    market,
    alignment: round(alignment, 1),
    threshold: round(threshold),
    relevanceFloor: round(relevanceFloor),
    similarityMean: round(mean),
    similarityStdDev: round(stdDev),
    units: unitAlignments,
    missing: missing.slice(0, 12),
    coveredSkillCount,
    coveredSkillIds,
    inScopeSkillCount,
    outOfScopeSkillCount,
    totalSkillCount: corpus.length,
    totalHours,
    obsoleteHours,
    modifiableHours: totalHours === null ? null : round(totalHours * MODIFICATION_CAP, 2),
  };
}

export type { JobSkill };

function round(value: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

import { JOB_SKILLS, type JobSkill } from "@/data/job-market";
import vectorFile from "@/data/job-vectors.json";

/**
 * Loads the pre-embedded job-market corpus.
 *
 * Vectors are generated offline by scripts/seed-job-vectors.mjs and committed,
 * so an audit embeds only the syllabus chunks. Any skill without a vector is
 * dropped loudly rather than silently scored as un-matchable.
 */

export type CorpusEntry = { skill: JobSkill; vector: number[] };

export type CorpusMeta = {
  model: string;
  dim: number;
  skillCount: number;
  generatedAt: string;
};

const raw = vectorFile as {
  model: string;
  dim: number;
  skillCount: number;
  generatedAt: string;
  vectors: Record<string, number[]>;
};

let cached: CorpusEntry[] | null = null;

export function loadCorpus(): CorpusEntry[] {
  if (cached) return cached;

  const entries: CorpusEntry[] = [];
  const missing: string[] = [];

  for (const skill of JOB_SKILLS) {
    const vector = raw.vectors[skill.id];
    if (!vector) {
      missing.push(skill.id);
      continue;
    }
    entries.push({ skill, vector });
  }

  if (missing.length > 0) {
    // Re-run the seed script; a partially embedded corpus skews every score.
    console.warn(
      `[corpus] ${missing.length} skills have no vector and were dropped: ${missing.join(", ")}`,
    );
  }

  cached = entries;
  return entries;
}

export function corpusMeta(): CorpusMeta {
  return {
    model: raw.model,
    dim: raw.dim,
    skillCount: raw.skillCount,
    generatedAt: raw.generatedAt,
  };
}

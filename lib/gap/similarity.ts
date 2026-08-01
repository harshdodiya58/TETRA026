import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobSkill } from "@/data/job-market";
import { cosineSimilarity } from "@/lib/gap/vector";
import { loadCorpus } from "@/lib/gap/corpus";

/**
 * Builds the unit × skill cosine similarity matrix.
 *
 * Two interchangeable sources, chosen at runtime:
 *
 *   pgvector   distances computed in Postgres through match_job_skills, using
 *              the HNSW index on job_skill_vectors
 *   in-memory  the committed data/job-vectors.json, scanned exactly
 *
 * The in-memory path is not a degraded mode — at 45 skills it is faster than a
 * network round trip, and it keeps the product working on a clean checkout with
 * no database. Which source ran is reported rather than assumed, because the
 * two can disagree if the committed vectors and the seeded table drift apart.
 */

export type SimilaritySource = "pgvector" | "in-memory";

export type SimilarityMatrix = {
  skills: JobSkill[];
  matrix: number[][];
  source: SimilaritySource;
  queryMs: number;
  note?: string;
};

type RpcRow = { skill_id: string; similarity: number };

export async function buildSimilarityMatrix(
  unitVectors: number[][],
  supabase: SupabaseClient | null,
): Promise<SimilarityMatrix> {
  const corpus = loadCorpus();
  const skills = corpus.map((entry) => entry.skill);

  if (supabase) {
    const started = performance.now();
    try {
      const matrix = await pgvectorMatrix(unitVectors, skills, supabase);
      return {
        skills,
        matrix,
        source: "pgvector",
        queryMs: round(performance.now() - started),
      };
    } catch (error) {
      // A database problem must not fail an audit that can be completed
      // locally — but it must be visible, not silently swallowed.
      const started2 = performance.now();
      const matrix = inMemoryMatrix(unitVectors, corpus);
      return {
        skills,
        matrix,
        source: "in-memory",
        queryMs: round(performance.now() - started2),
        note: `pgvector unavailable, fell back to the local corpus: ${
          error instanceof Error ? error.message.slice(0, 140) : "unknown error"
        }`,
      };
    }
  }

  const started = performance.now();
  const matrix = inMemoryMatrix(unitVectors, corpus);
  return { skills, matrix, source: "in-memory", queryMs: round(performance.now() - started) };
}

async function pgvectorMatrix(
  unitVectors: number[][],
  skills: JobSkill[],
  supabase: SupabaseClient,
): Promise<number[][]> {
  // One RPC per unit, issued concurrently. match_count is the full corpus so
  // the complete row comes back rather than a truncated top-k.
  const rows = await Promise.all(
    unitVectors.map(async (vector) => {
      const { data, error } = await supabase.rpc("match_job_skills", {
        query_embedding: `[${vector.join(",")}]`,
        match_count: skills.length,
      });

      if (error) throw new Error(error.message);

      const bySkill = new Map<string, number>();
      for (const row of (data ?? []) as RpcRow[]) {
        bySkill.set(row.skill_id, row.similarity);
      }

      // Reindex into corpus column order. A skill absent from the table would
      // silently read as zero similarity and distort every threshold, so treat
      // it as a hard failure and let the caller fall back.
      return skills.map((skill) => {
        const similarity = bySkill.get(skill.id);
        if (similarity === undefined) {
          throw new Error(
            `job_skill_vectors is missing "${skill.id}" — re-run scripts/seed-supabase-corpus.mjs`,
          );
        }
        return similarity;
      });
    }),
  );

  return rows;
}

function inMemoryMatrix(
  unitVectors: number[][],
  corpus: { vector: number[] }[],
): number[][] {
  return unitVectors.map((unitVector) =>
    corpus.map((entry) => cosineSimilarity(unitVector, entry.vector)),
  );
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

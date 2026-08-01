/**
 * Vector maths for gap scoring.
 *
 * Deliberately plain and dependency-free: these are the numbers the product
 * claims are real, so they should be auditable at a glance.
 */

export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

/**
 * Cosine similarity in [-1, 1]. Throws on dimension mismatch rather than
 * returning a meaningless number — comparing a 1024-dim vector against a
 * 768-dim one is undefined, not merely inaccurate.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Cannot compare vectors of dimension ${a.length} and ${b.length}.`);
  }
  const denominator = norm(a) * norm(b);
  if (denominator === 0) return 0;
  return dot(a, b) / denominator;
}

/** Gap score, per the spec: 1 - cosine similarity, clamped to [0, 1]. */
export function gapScore(a: number[], b: number[]): number {
  return clamp01(1 - cosineSimilarity(a, b));
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Top-k nearest entries by cosine similarity. */
export function topK<T>(
  query: number[],
  candidates: { item: T; vector: number[] }[],
  k: number,
): { item: T; similarity: number }[] {
  return candidates
    .map((candidate) => ({
      item: candidate.item,
      similarity: cosineSimilarity(query, candidate.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

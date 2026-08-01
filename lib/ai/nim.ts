/**
 * NVIDIA NIM client (OpenAI-compatible surface).
 *
 * Two things here are not obvious and were established by probing the live API
 * rather than assumed:
 *
 * 1. `nv-embedqa-e5-v5` is an ASYMMETRIC retrieval model. Requests without an
 *    `input_type` are rejected outright with
 *    "'input_type' parameter is required for asymmetric models". Corpus text
 *    must be embedded as "passage" and search text as "query"; using the same
 *    value for both measurably degrades retrieval.
 *
 * 2. Embedding a batch is dramatically cheaper than looping. Five chunks in one
 *    call returned in ~920ms, against ~900-2100ms *per chunk* individually.
 */

export const EMBEDDING_DIM = Number.parseInt(process.env.EMBEDDING_DIM ?? "1024", 10);

const BASE_URL = process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const API_KEY = process.env.NVIDIA_NIM_API_KEY ?? "";
const EMBED_MODEL = process.env.NVIDIA_NIM_EMBED_MODEL ?? "nvidia/nv-embedqa-e5-v5";

export const isNimConfigured = Boolean(API_KEY);

export type InputType = "query" | "passage";

export class EmbeddingError extends Error {}

export type EmbeddingBatch = {
  vectors: number[][];
  model: string;
  dim: number;
  promptTokens: number;
};

/**
 * Embed a batch of texts in a single request.
 *
 * @param inputType "passage" for corpus documents, "query" for the text being
 *                  matched against them. Not interchangeable.
 */
export async function embedBatch(
  texts: string[],
  inputType: InputType,
  signal?: AbortSignal,
): Promise<EmbeddingBatch> {
  if (!isNimConfigured) {
    throw new EmbeddingError("NVIDIA_NIM_API_KEY is not set.");
  }
  if (texts.length === 0) {
    return { vectors: [], model: EMBED_MODEL, dim: EMBEDDING_DIM, promptTokens: 0 };
  }

  const response = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      input_type: inputType,
      encoding_format: "float",
    }),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new EmbeddingError(
      `NIM embeddings failed (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as {
    data?: { embedding: number[]; index: number }[];
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };

  const rows = json.data ?? [];
  if (rows.length !== texts.length) {
    throw new EmbeddingError(
      `NIM returned ${rows.length} vectors for ${texts.length} inputs.`,
    );
  }

  // The API is not required to preserve input order, and silently mismatched
  // vectors would corrupt every downstream distance.
  const ordered = [...rows].sort((a, b) => a.index - b.index).map((r) => r.embedding);

  const dim = ordered[0]?.length ?? 0;
  if (dim !== EMBEDDING_DIM) {
    throw new EmbeddingError(
      `Embedding dimension mismatch: model returned ${dim}, corpus expects ${EMBEDDING_DIM}. ` +
        `Vectors of differing dimension cannot be compared.`,
    );
  }

  return {
    vectors: ordered,
    model: EMBED_MODEL,
    dim,
    promptTokens: json.usage?.prompt_tokens ?? json.usage?.total_tokens ?? 0,
  };
}

/**
 * Text generation with a cross-provider fallback chain.
 *
 * The chain order was set by measurement against the live free endpoints, not
 * by model size:
 *
 *   mistralai/mistral-nemotron    4.1s total, 315ms TTFT
 *   meta/llama-3.1-8b-instruct    1.0s total, 338ms TTFT
 *   gemini-3.5-flash-lite         1.3s total
 *
 * meta/llama-3.3-70b-instruct — the obvious choice on paper — is excluded: it
 * measured 52s to first token and then returned HTTP 504. Reasoning-tier Gemini
 * flash models are excluded too, because maxOutputTokens is consumed by
 * thinking and leaves almost no usable output.
 */

const NIM_BASE = process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const NIM_KEY = process.env.NVIDIA_NIM_API_KEY ?? "";
const NIM_MODEL = process.env.NVIDIA_NIM_CHAT_MODEL ?? "mistralai/mistral-nemotron";
const NIM_FALLBACK = process.env.NVIDIA_NIM_CHAT_MODEL_FALLBACK ?? "meta/llama-3.1-8b-instruct";

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-3.5-flash-lite";

/**
 * Default ceiling for one attempt. Callers working against a wall-clock
 * deadline should pass their own, smaller value — see generatePatch, which
 * divides its remaining budget across retries so the worst case still fits
 * inside the platform's function timeout.
 */
const ATTEMPT_TIMEOUT_MS = 20_000;

/** Below this there is not enough time for a useful completion. */
export const MIN_ATTEMPT_MS = 6_000;

export type Provider = { id: string; label: string };

export type GenerationResult = {
  text: string;
  provider: string;
  model: string;
  ttftMs: number | null;
  totalMs: number;
  attempts: { model: string; error: string }[];
};

export class GenerationError extends Error {
  // Declared and assigned explicitly rather than as a constructor parameter
  // property: those are not erasable syntax, so they break any runtime that
  // strips types instead of compiling them.
  attempts: { model: string; error: string }[];

  constructor(message: string, attempts: { model: string; error: string }[]) {
    super(message);
    this.attempts = attempts;
  }
}

export function generationChain(): Provider[] {
  const chain: Provider[] = [];
  if (NIM_KEY) {
    chain.push({ id: `nim:${NIM_MODEL}`, label: NIM_MODEL });
    if (NIM_FALLBACK && NIM_FALLBACK !== NIM_MODEL) {
      chain.push({ id: `nim:${NIM_FALLBACK}`, label: NIM_FALLBACK });
    }
  }
  if (GEMINI_KEY) chain.push({ id: `gemini:${GEMINI_MODEL}`, label: GEMINI_MODEL });
  return chain;
}

export const isGenerationConfigured = () => generationChain().length > 0;

export async function generate(
  system: string,
  user: string,
  maxTokens = 2200,
  timeoutMs = ATTEMPT_TIMEOUT_MS,
): Promise<GenerationResult> {
  const chain = generationChain();
  if (chain.length === 0) {
    throw new GenerationError("No generation provider is configured.", []);
  }

  const attempts: { model: string; error: string }[] = [];
  // Every provider in the chain shares the budget; otherwise a three-provider
  // failover could take three times longer than the caller allowed for.
  const perProvider = Math.max(Math.floor(timeoutMs / chain.length), MIN_ATTEMPT_MS);

  for (const provider of chain) {
    const started = performance.now();
    try {
      const [kind, model] = splitProvider(provider.id);

      const result =
        kind === "nim"
          ? await nimGenerate(model, system, user, maxTokens, perProvider)
          : await geminiGenerate(model, system, user, maxTokens, perProvider);

      if (result.text.trim().length === 0) {
        throw new Error("Provider returned an empty completion.");
      }

      return {
        ...result,
        provider: kind,
        model,
        totalMs: Math.round(performance.now() - started),
        attempts,
      };
    } catch (error) {
      attempts.push({
        model: provider.label,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new GenerationError(
    `All ${chain.length} generation providers failed.`,
    attempts,
  );
}

function splitProvider(id: string): [string, string] {
  const index = id.indexOf(":");
  return [id.slice(0, index), id.slice(index + 1)];
}

async function nimGenerate(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<{ text: string; ttftMs: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  let ttftMs: number | null = null;

  try {
    const response = await fetch(`${NIM_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${NIM_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.25,
        top_p: 0.9,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            if (ttftMs === null) ttftMs = Math.round(performance.now() - started);
            text += delta;
          }
        } catch {
          // Ignore a malformed frame rather than abandon a good stream.
        }
      }
    }

    return { text, ttftMs };
  } finally {
    clearTimeout(timer);
  }
}

async function geminiGenerate(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<{ text: string; ttftMs: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.25 },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
    }

    const json = await response.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";

    return { text, ttftMs: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pull the first JSON object out of a completion.
 *
 * Models wrap JSON in prose or fences no matter how firmly instructed not to,
 * so this brace-matches rather than trusting the response to be clean. String
 * literals are tracked so a brace inside a value cannot end the scan early.
 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : raw;

  const start = source.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in the completion.");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, i + 1));
    }
  }

  throw new Error("JSON object in the completion was not closed.");
}

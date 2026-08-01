/**
 * Embeds the job-market skill corpus offline and writes data/job-vectors.json.
 *
 * Run once, commit the output. Doing this at request time would embed ~48
 * documents on every audit — several seconds of latency and a large share of
 * the free NIM credit allowance, for a corpus that does not change between
 * runs. Request time then only embeds the handful of syllabus chunks.
 *
 *   node scripts/seed-job-vectors.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Load .env.local without a dependency.
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
}

const { JOB_SKILLS } = await import(pathToFileURL(resolve(root, "data/job-market.ts")).href);

const BASE_URL = process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const API_KEY = process.env.NVIDIA_NIM_API_KEY;
const MODEL = process.env.NVIDIA_NIM_EMBED_MODEL ?? "nvidia/nv-embedqa-e5-v5";
const DIM = Number.parseInt(process.env.EMBEDDING_DIM ?? "1024", 10);

if (!API_KEY) {
  console.error("NVIDIA_NIM_API_KEY is not set in .env.local");
  process.exit(1);
}

const BATCH = 24;

async function embed(texts) {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      // Corpus documents are passages. Query text uses input_type "query".
      input_type: "passage",
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    throw new Error(`NIM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const json = await res.json();
  return {
    vectors: [...json.data].sort((a, b) => a.index - b.index).map((r) => r.embedding),
    tokens: json.usage?.total_tokens ?? 0,
  };
}

console.log(`Embedding ${JOB_SKILLS.length} skills with ${MODEL}…`);

const vectors = {};
let totalTokens = 0;
const started = Date.now();

for (let i = 0; i < JOB_SKILLS.length; i += BATCH) {
  const slice = JOB_SKILLS.slice(i, i + BATCH);
  // Embed name and description together: the name carries the tool keyword a
  // job advertisement would use, the description carries the context.
  const texts = slice.map((s) => `${s.name}. ${s.description}`);

  const { vectors: batch, tokens } = await embed(texts);
  totalTokens += tokens;

  batch.forEach((vector, j) => {
    if (vector.length !== DIM) {
      throw new Error(`Dimension mismatch: got ${vector.length}, expected ${DIM}`);
    }
    // 5 decimals is far below cosine's sensitivity and roughly halves file size.
    vectors[slice[j].id] = vector.map((v) => Number(v.toFixed(5)));
  });

  console.log(`  ${Math.min(i + BATCH, JOB_SKILLS.length)}/${JOB_SKILLS.length}`);
}

const payload = {
  model: MODEL,
  dim: DIM,
  inputType: "passage",
  skillCount: JOB_SKILLS.length,
  generatedAt: new Date().toISOString(),
  vectors,
};

const outPath = resolve(root, "data/job-vectors.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload));

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `\nWrote data/job-vectors.json · ${JOB_SKILLS.length} vectors · dim ${DIM} · ${totalTokens} tokens · ${seconds}s`,
);

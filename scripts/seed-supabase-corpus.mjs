/**
 * Pushes the job-market corpus and its pre-computed vectors into Supabase.
 *
 *   node scripts/seed-supabase-corpus.mjs
 *
 * Idempotent — upserts on primary key, so re-running after editing
 * data/job-market.ts or re-embedding is safe.
 *
 * Uses the service-role key deliberately: this is reference data shared across
 * institutions, and RLS grants authenticated users read-only access to it.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const { JOB_SKILLS } = await import(pathToFileURL(resolve(root, "data/job-market.ts")).href);
const vectorFile = JSON.parse(readFileSync(resolve(root, "data/job-vectors.json"), "utf8"));

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function upsert(table, rows, onConflict) {
  const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`${table}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
}

console.log(`seeding ${JOB_SKILLS.length} skills into ${url}`);

await upsert(
  "job_skills",
  JOB_SKILLS.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    emerging: s.emerging,
    demand: s.demand,
  })),
  "id",
);
console.log(`  job_skills: ${JOB_SKILLS.length} rows`);

// pgvector accepts its text representation over PostgREST: "[0.1,0.2,…]".
const vectorRows = [];
for (const skill of JOB_SKILLS) {
  const vector = vectorFile.vectors[skill.id];
  if (!vector) {
    console.warn(`  ! no vector for ${skill.id} — skipped`);
    continue;
  }
  vectorRows.push({
    skill_id: skill.id,
    embedding: `[${vector.join(",")}]`,
    embedding_model: vectorFile.model,
    embedding_dim: vectorFile.dim,
  });
}

// Batched: 45 rows of 1024 floats is a few megabytes of JSON in one request.
const BATCH = 10;
for (let i = 0; i < vectorRows.length; i += BATCH) {
  await upsert("job_skill_vectors", vectorRows.slice(i, i + BATCH), "skill_id");
  console.log(`  job_skill_vectors: ${Math.min(i + BATCH, vectorRows.length)}/${vectorRows.length}`);
}

// Confirm the index is actually usable by calling the search function.
const probe = await fetch(`${url}/rest/v1/rpc/match_job_skills`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    query_embedding: `[${vectorFile.vectors[JOB_SKILLS[0].id].join(",")}]`,
    match_count: 3,
  }),
});

if (!probe.ok) {
  console.error(`\nmatch_job_skills probe failed: ${(await probe.text()).slice(0, 300)}`);
  process.exit(1);
}

const matches = await probe.json();
console.log(`\nmatch_job_skills probe (querying with "${JOB_SKILLS[0].name}"):`);
for (const m of matches) {
  console.log(`  ${m.similarity.toFixed(4)}  ${m.name}`);
}
console.log("\nCorpus seeded.");

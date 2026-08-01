# CurriPulse AI — Design Spec

**Date:** 2026-08-01
**Status:** Approved
**Repo:** `harshdodiya58/TETRA026` (branch: `main`)

---

## 1. Problem

Indian university syllabi are revised every 3–5 years; industry tooling turns over every 3–6 months. A full syllabus rewrite triggers a 1–2 year Board of Studies (BoS) and Academic Council approval cycle, so faculty who *know* the syllabus is stale still cannot fix it.

Indian academic regulation does, however, permit a fast-track amendment path when the modification stays under roughly **15% of course contact hours** and leaves course code, title, credit weightage, and core theory untouched.

CurriPulse AI audits an existing syllabus against real Indian tech job-market demand, then generates a **15% micro-augmentation patch** — new lab experiments, mini-projects, modern tool references, and Course Outcomes — that fits inside the fast-track envelope and complies with OBE, Bloom's Taxonomy, and NBA/NAAC requirements.

## 2. Scope

**In scope:** syllabus upload and parsing, gap analysis against a job-market vector corpus and a skill knowledge graph, live processing telemetry, 15%-capped patch generation, BoS proposal export, institutional auth with RBAC.

**Out of scope:** student-facing features, LMS integration, timetable/scheduling, multi-university benchmarking, mobile apps.

## 3. Architecture

### 3.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions), TypeScript |
| UI | Tailwind v4, Framer Motion, custom primitives |
| Auth | Supabase Auth (magic link / SSO) |
| Relational + Vector | Supabase Postgres + pgvector |
| Knowledge Graph | Neo4j AuraDB Free |
| Generation | NVIDIA NIM (`meta/llama-3.3-70b-instruct`) → Gemini fallback |
| Embeddings | Single pinned model (see §3.3) |
| Job data | Kaggle Indian tech job CSVs, seeded offline; optional Adzuna/JSearch top-up |

### 3.2 Telemetry: measured, not simulated

The platform's central credibility claim is that the processing HUD reflects real computation. The binding rule:

> **Every value rendered on the HUD originates from an instrumented operation that actually executed. No `setTimeout`, no interpolated progress, no fabricated latencies.**

A `TelemetryBus` collects events from spans wrapping each pipeline stage:

```
parse.page      → pages, chars, ms
chunk.emit      → unit boundaries, overlap, boundary-confidence
embed.batch     → vec/sec, tokens, dimension, batch latency
vector.query    → pgvector HNSW execution ms, cosine distances
graph.traverse  → nodes visited, hop depth, Cypher round-trip ms
llm.token       → TTFT, tokens/sec
bloom.validate  → pass rate over generated verbs
```

**Transport: SSE** from a single streaming Route Handler (`/api/audit/stream`, `runtime = 'nodejs'`, `maxDuration = 60`). Chosen over WebSockets and Supabase Realtime because the traffic is strictly one-way server→client, it needs no additional infrastructure, it survives serverless hosting, and LLM token streaming rides the same channel.

If a stage produces no measurement, the HUD renders that field as unavailable rather than inventing one.

### 3.3 Embedding dimension is pinned, and fallback is generation-only

A pgvector column has one fixed dimension. Cosine distance between vectors of differing dimension is undefined, so **failing over between embedding models mid-corpus is a correctness bug, not a resilience feature.** Gemini `text-embedding-004` is 768-dim; NVIDIA's retrieval models are 1024-dim (`nv-embedqa-e5-v5`) and 2048-dim (`llama-3.2-nv-embedqa-1b-v2`).

Decisions:

1. **One embedding model for the entire corpus** — syllabus chunks and job postings alike.
2. Every embedded row stores `embedding_model` and `dim`. A query refuses to compare across mismatched values.
3. **The Gemini fallback covers generation only.** It is never used for embeddings.
4. If the embedding provider is unreachable, the system degrades to a local deterministic embedder and marks the audit as degraded — it does not silently mix vector spaces.
5. Exact NIM model IDs are verified against the live catalog at implementation time; the embedding client is dimension-agnostic and config-driven so a swap is a config change.

### 3.4 Job vectors are embedded offline

A seed script ingests Kaggle CSVs, embeds them once, and writes to Supabase. Request time embeds only the ~5–18 syllabus chunks of the uploaded document.

This is what makes the <15s audit target reachable and keeps usage inside the 1,000 NIM credit allowance. Embedding thousands of job postings per audit would blow both.

### 3.5 Regulatory logic is deterministic code, not LLM output

A Dean will not accept a hallucinated hour count. Anything an accreditation body would audit is computed in TypeScript and used to *constrain* and then *verify* the model:

- **15% cap.** Total contact hours → modifiable budget (45h → 6.75h). The budget is passed to the LLM as a hard constraint, then the returned patch is re-measured against it. Over budget → reject and regenerate.
- **Bloom's validation.** A verb lexicon maps action verbs to levels 1–6. Lab COs must sit at level 3+, case studies at 4+, capstone prompts at 5+. A CO opening with "Understand" on a lab fails and regenerates. The HUD's validation index is this validator's real pass rate.
- **CO→PO mapping.** A deterministic matrix over the 12 NBA Program Outcomes.

The LLM proposes; deterministic code disposes.

### 3.6 Data model (outline)

`institutions` · `profiles` (role, institution_id) · `audit_sessions` · `syllabus_documents` · `syllabus_units` · `syllabus_chunks` (vector) · `job_postings` (vector) · `gap_findings` · `patches` · `exports`

RLS policies scope every row by `institution_id`. Uploaded syllabi are never used to train public models.

### 3.7 Auth

Supabase magic link with institutional domain whitelist (e.g. `@university.edu.in`). Next.js middleware guards protected routes and redirects to `/login`. RBAC via `profiles.role`:

- **Institution Admin / Dean** — upload, configure market bias, trigger audits, sign off proposals
- **Department Head / Faculty** — view department audits, tweak patches, export

## 4. Failure handling

| Failure | Response |
|---|---|
| NIM credits exhausted / rate limited | Fall back to Gemini for generation; banner surfaces the active model |
| Embedding provider down | Local deterministic embedder; audit flagged degraded |
| Neo4j unreachable | Vector-only gap analysis; graph panel marked unavailable |
| Unparseable upload | Surface extraction diagnostics rather than a silent empty audit |
| Patch exceeds 15% | Automatic regeneration with a tightened budget; hard-fail after retries |

## 5. Performance targets

- Full audit (parse → vector → graph → heatmap): **<15s**
- Patch generation TTFT **<2s**, complete **<20s**
- Demo path: messy 5-page real syllabus → NBA-compliant BoS proposal in **<40s**

## 6. Milestones

Each milestone is a commit and push to `main`.

1. Landing page, design system, auth shell
2. Supabase schema, RLS, RBAC, domain whitelist
3. Syllabus ingestion and structural chunker (VTU / Anna / GTU formats)
4. Embeddings, pgvector HNSW, job-market seed corpus
5. Neo4j skill graph and traversal
6. Telemetry bus and live processing HUD
7. Gap dashboard and obsolete-topic heatmap
8. 15% patch generation with Bloom's and PO validators
9. BoS proposal PDF/DOCX export

## 7. Open items

- NIM model IDs confirmed against the live catalog before Milestone 4.
- Kaggle dataset selection for the job corpus, pending review of available Indian tech job datasets.
- Secrets live in `.env.local` (gitignored); `.env.local.example` documents required keys.

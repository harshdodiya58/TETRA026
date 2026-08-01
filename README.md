# CurriPulse AI

**Bridge the 3-year higher education gap in 30 seconds.**

Syllabus audit and micro-augmentation for Indian higher education. CurriPulse compares an existing
university syllabus against live Indian tech hiring data and national skill frameworks, then drafts
a **15% micro-augmentation patch** that fits inside the Board of Studies fast-track envelope —
leaving course code, title, credit weightage, and core theory untouched.

Design spec: [`docs/superpowers/specs/2026-08-01-curripulse-design.md`](docs/superpowers/specs/2026-08-01-curripulse-design.md)

---

## Why this shape

Indian syllabi are revised every 3–5 years; the stack they teach turns over every 3–6 months. The
obstacle is regulatory, not motivational: changing more than roughly 15% of a core syllabus triggers
a BoS and Academic Council cycle that runs one to two years. CurriPulse works *inside* that limit
instead of ignoring it.

Two principles drive the implementation:

1. **Every telemetry value is a measurement.** The processing HUD reports real parsing latency,
   embedding throughput, pgvector query time, Cypher round-trips, and token generation speed. No
   simulated progress, no placeholder animation timed to look busy. If a stage produces no
   measurement, the HUD says so.
2. **Regulatory logic is deterministic code, not model output.** The 15% hour budget and Bloom's
   Taxonomy level enforcement are computed and verified in TypeScript. The model proposes; code
   disposes. A Dean will not sign a proposal whose compliance was merely asserted by an LLM.
3. **Colour encodes information; it never decorates.** The interface is set as warm paper and ink
   with a single oxblood accent — the red pen on a manuscript. Aligned reads forest, drifting
   ochre, obsolete oxblood. Multi-stop decorative gradients are prohibited: they are the visual
   signature of generated boilerplate, and this product's credibility depends on not looking like
   one.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), TypeScript |
| UI | Tailwind v4, Motion, lucide-react |
| Auth | Supabase Auth — passwordless magic link |
| Relational + vector | Supabase Postgres + pgvector |
| Knowledge graph | Neo4j AuraDB |
| Generation | NVIDIA NIM (`meta/llama-3.3-70b-instruct`), Gemini fallback |
| Embeddings | NVIDIA NIM, single pinned model |

### A note on embeddings

A pgvector column has one fixed dimension, and cosine distance between vectors of differing
dimension is undefined — so failing over between embedding models mid-corpus is a correctness bug,
not a resilience feature. One embedding model is pinned for the entire corpus, every row records its
`embedding_model` and `dim`, and **the Gemini fallback covers generation only.**

`nv-embedqa-e5-v5` is **asymmetric**: every request must carry `input_type` — `"passage"` for corpus
documents, `"query"` for the syllabus text matched against them. Omitting it returns HTTP 400.

### Model selection — measured, not assumed

⚠️ **`.env.local.example` still lists the original spec's model IDs. Both are unusable.** Override
them. Measured against the live free endpoints:

| Model | Result |
|---|---|
| `meta/llama-3.3-70b-instruct` | ❌ 52s to first token, then HTTP 504 |
| `gemini-1.5-flash` | ❌ 404 — retired from v1beta |
| `mistralai/mistral-nemotron` | ✅ 4.1s total, **315ms TTFT** — primary |
| `meta/llama-3.1-8b-instruct` | ✅ 1.0s total, 338ms TTFT — first fallback |
| `gemini-3.5-flash-lite` | ✅ 1.3s — cross-provider fallback |
| `gemini-2.5-flash`, `gemini-3.6-flash` | ⚠️ reasoning tier: `maxOutputTokens` is consumed by thinking, ~15 usable tokens |

Working values:

```bash
NVIDIA_NIM_CHAT_MODEL=mistralai/mistral-nemotron
GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
```

### A note on gap scoring

Alignment is **demand-weighted coverage scoped to the course's own domain**:

```
alignment = Σ demand(covered ∩ in-scope) / Σ demand(in-scope)
```

Both cutoffs are derived from the similarity distribution of *this* document against *this* corpus —
in scope above μ, covered above μ + σ — and both are reported in the UI. Fixed constants would
silently change meaning after an embedding-model swap.

Scoping is not cosmetic. Measured against the entire corpus, a database syllabus is reported as
missing Git, Docker, and REST APIs: all true, all useless, because no DBMS course should teach them.
Excluding out-of-domain skills moved the sample audit from a meaningless 31.7% to 52.8%, and turned
the missing list into query optimisation, Redis caching, connection pooling, and sharding — things a
Board of Studies can actually act on. The count of excluded skills is reported rather than hidden.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

The landing page and `/login` render without any credentials. Protected routes redirect to `/login`
with an explanation until Supabase is configured.

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## Project layout

```
app/                    routes — landing, login, auth callback, dashboard
components/
  landing/              landing page sections
  auth/                 login form, sign-out
  ui/                   design-system primitives
  brand/                logo and wordmark
lib/
  env.ts                environment access with explicit configured-checks
  auth/institutions.ts  role model + institutional domain whitelist
  supabase/             browser and server clients
proxy.ts                route guard and session refresh
docs/superpowers/specs/ design spec
```

`proxy.ts` rather than `middleware.ts` — Next 16 renamed the convention; the old name still builds
but logs a deprecation warning.

## Status

| # | Milestone | State |
|---|---|---|
| 1 | Landing page, design system, auth shell | ✅ |
| 2 | Supabase schema, RLS, RBAC, domain whitelist | 🟡 SQL written, not yet applied |
| 3 | Syllabus ingestion and structural chunker | ✅ |
| 4 | Embeddings and job-market corpus | ✅ in-memory; pgvector pending |
| 5 | Neo4j skill graph and traversal | ◻ |
| 6 | Telemetry bus and live processing HUD | ✅ |
| 7 | Gap dashboard and obsolete-topic heatmap | ✅ |
| 8 | 15% patch generation with Bloom's and PO validators | ◻ |
| 9 | BoS proposal PDF/DOCX export | ◻ |

A full audit of the bundled sample currently runs in **~1.3s**: parse 1.7ms, chunk 2.6ms,
embed 786ms (5 chunks, 6.4 vec/sec), vector 0.3ms, gap 3.7ms.

## Applying the database schema

`supabase/migrations/0001_init.sql` is paste-ready and idempotent. Open the Supabase SQL editor,
paste the whole file, run it once. It creates the institution/profile/session/document/chunk tables,
the job-market corpus tables, HNSW indexes, a signup trigger that provisions a profile and
institution from the email domain, and institution-scoped RLS on every table.

Until it is applied the app runs entirely in memory — audits work, but nothing is persisted between
sessions.

> The service-role key **cannot** run this. It authenticates against PostgREST, which does not
> expose DDL. It has to go through the SQL editor, the Supabase CLI, or a direct Postgres
> connection.

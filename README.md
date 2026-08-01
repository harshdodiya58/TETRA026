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
| 2 | Supabase schema, RLS, RBAC, domain whitelist | ◻ |
| 3 | Syllabus ingestion and structural chunker | ◻ |
| 4 | Embeddings, pgvector HNSW, job-market seed corpus | ◻ |
| 5 | Neo4j skill graph and traversal | ◻ |
| 6 | Telemetry bus and live processing HUD | ◻ |
| 7 | Gap dashboard and obsolete-topic heatmap | ◻ |
| 8 | 15% patch generation with Bloom's and PO validators | ◻ |
| 9 | BoS proposal PDF/DOCX export | ◻ |

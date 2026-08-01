-- ===========================================================================
-- Fix: match_job_skills silently returned at most 40 rows.
--
-- An HNSW index scan returns at most `hnsw.ef_search` candidates, and that
-- setting defaults to 40. The function's LIMIT was therefore capped at 40
-- regardless of match_count: asking for 100 returned 40, with no error.
--
-- This is quiet and damaging here. CurriPulse needs the FULL similarity row
-- per syllabus unit, because its coverage and relevance cutoffs are derived
-- from the mean and standard deviation of the whole distribution. A silently
-- truncated result set does not merely omit a few skills — it shifts every
-- threshold and therefore the headline alignment figure.
--
-- Raising ef_search per call fixes it. set_config(..., true) scopes the change
-- to the current transaction, so it cannot leak into other queries.
--
-- Paste into the Supabase SQL editor and run. Safe to re-run.
-- ===========================================================================

create or replace function public.match_job_skills(
  query_embedding vector(1024),
  match_count int default 10
)
returns table (
  skill_id   text,
  name       text,
  category   text,
  similarity double precision
)
language plpgsql
stable
as $$
begin
  -- Must be at least match_count, with headroom: HNSW recall improves as
  -- ef_search grows, and at this corpus size the cost is negligible.
  perform set_config('hnsw.ef_search', greatest(match_count * 2, 100)::text, true);

  return query
  select
    v.skill_id,
    s.name,
    s.category,
    1 - (v.embedding <=> query_embedding) as similarity
  from public.job_skill_vectors v
  join public.job_skills s on s.id = v.skill_id
  order by v.embedding <=> query_embedding
  limit match_count;
end;
$$;

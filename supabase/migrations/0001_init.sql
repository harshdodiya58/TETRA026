-- ===========================================================================
-- CurriPulse AI — initial schema
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is idempotent: re-running is safe.
--
-- IMPORTANT: vector columns are declared vector(1024) to match
-- nvidia/nv-embedqa-e5-v5 and the EMBEDDING_DIM env var. A pgvector column has
-- one fixed dimension and cosine distance between differing dimensions is
-- undefined, so changing the embedding model means changing these columns AND
-- re-embedding every stored vector. Do not mix.
-- ===========================================================================

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('faculty', 'hod', 'dean', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_status') then
    create type public.audit_status as enum ('draft', 'analysed', 'patched', 'approved');
  end if;

  if not exists (select 1 from pg_type where typname = 'patch_status') then
    create type public.patch_status as enum ('generated', 'edited', 'approved', 'rejected');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Institutions and profiles
-- ---------------------------------------------------------------------------
create table if not exists public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  institution_id  uuid not null references public.institutions (id) on delete cascade,
  email           text not null,
  full_name       text,
  department      text,
  role            public.user_role not null default 'faculty',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_institution_idx on public.profiles (institution_id);

-- ---------------------------------------------------------------------------
-- Audit sessions
-- ---------------------------------------------------------------------------
create table if not exists public.audit_sessions (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions (id) on delete cascade,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  course_code     text,
  course_title    text,
  degree          text,
  semester        smallint,
  market          text not null default 'bengaluru',
  -- The Board of Studies fast-track ceiling. Stored per session so a change in
  -- policy does not silently rewrite the basis of past proposals.
  modification_cap numeric(4,3) not null default 0.150,
  status          public.audit_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists audit_sessions_institution_idx on public.audit_sessions (institution_id);
create index if not exists audit_sessions_created_by_idx on public.audit_sessions (created_by);

-- ---------------------------------------------------------------------------
-- Syllabus documents, units, chunks
-- ---------------------------------------------------------------------------
create table if not exists public.syllabus_documents (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.audit_sessions (id) on delete cascade,
  filename              text not null,
  format                text not null,
  pages                 integer,
  characters            integer not null default 0,
  raw_text              text,
  declared_total_hours  integer,
  summed_unit_hours     integer,
  boundary_confidence   numeric(4,3),
  course_outcomes       jsonb not null default '[]'::jsonb,
  textbooks             jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists syllabus_documents_session_idx on public.syllabus_documents (session_id);

create table if not exists public.syllabus_units (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.syllabus_documents (id) on delete cascade,
  unit_index   smallint not null,
  label        text not null,
  title        text,
  body         text,
  hours        smallint,
  topics       jsonb not null default '[]'::jsonb,
  unique (document_id, unit_index)
);

create index if not exists syllabus_units_document_idx on public.syllabus_units (document_id);

create table if not exists public.syllabus_chunks (
  id               uuid primary key default gen_random_uuid(),
  unit_id          uuid not null references public.syllabus_units (id) on delete cascade,
  session_id       uuid not null references public.audit_sessions (id) on delete cascade,
  content          text not null,
  embedding        vector(1024),
  -- Recorded so a corpus embedded with a different model is never silently
  -- compared against this row.
  embedding_model  text,
  embedding_dim    smallint,
  created_at       timestamptz not null default now()
);

create index if not exists syllabus_chunks_session_idx on public.syllabus_chunks (session_id);
create index if not exists syllabus_chunks_embedding_idx
  on public.syllabus_chunks using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Job-market corpus (reference data, shared across institutions)
-- ---------------------------------------------------------------------------
create table if not exists public.job_skills (
  id           text primary key,
  name         text not null,
  category     text not null,
  description  text not null,
  emerging     boolean not null default false,
  -- { "bengaluru": 0.82, "hyderabad": 0.78, ... }
  demand       jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create table if not exists public.job_skill_vectors (
  skill_id         text primary key references public.job_skills (id) on delete cascade,
  embedding        vector(1024) not null,
  embedding_model  text not null,
  embedding_dim    smallint not null,
  created_at       timestamptz not null default now()
);

create index if not exists job_skill_vectors_embedding_idx
  on public.job_skill_vectors using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Gap reports and patches
-- ---------------------------------------------------------------------------
create table if not exists public.gap_reports (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.audit_sessions (id) on delete cascade,
  market              text not null,
  alignment           numeric(5,2) not null,
  -- Both cutoffs are derived per document; stored so a past figure can be
  -- audited rather than merely trusted.
  relevance_floor     numeric(6,4),
  coverage_threshold  numeric(6,4),
  similarity_mean     numeric(6,4),
  similarity_stddev   numeric(6,4),
  in_scope_skills     smallint,
  covered_skills      smallint,
  out_of_scope_skills smallint,
  total_hours         smallint,
  obsolete_hours      smallint,
  modifiable_hours    numeric(6,2),
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists gap_reports_session_idx on public.gap_reports (session_id);

create table if not exists public.patches (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.audit_sessions (id) on delete cascade,
  status         public.patch_status not null default 'generated',
  model          text,
  hours_used     numeric(6,2),
  hours_budget   numeric(6,2),
  bloom_passed   boolean,
  content        jsonb not null default '{}'::jsonb,
  approved_by    uuid references public.profiles (id) on delete set null,
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists patches_session_idx on public.patches (session_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'audit_sessions', 'patches']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Profile provisioning on signup
--
-- Institutions are created on first sight of a domain, so an institution's
-- first user does not need an administrator to exist beforehand.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain          text;
  v_institution_id  uuid;
begin
  v_domain := lower(split_part(new.email, '@', 2));

  select id into v_institution_id
  from public.institutions
  where domain = v_domain;

  if v_institution_id is null then
    insert into public.institutions (name, domain)
    values (initcap(replace(split_part(v_domain, '.', 1), '-', ' ')), v_domain)
    on conflict (domain) do update set domain = excluded.domain
    returning id into v_institution_id;
  end if;

  insert into public.profiles (id, institution_id, email)
  values (new.id, v_institution_id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Every institution-scoped row is visible only to members of that institution.
-- current_institution_id() is SECURITY DEFINER so that policies on `profiles`
-- can call it without recursing through those same policies.
-- ---------------------------------------------------------------------------
create or replace function public.current_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select institution_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role_is(required public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(required)
  )
$$;

alter table public.institutions       enable row level security;
alter table public.profiles           enable row level security;
alter table public.audit_sessions     enable row level security;
alter table public.syllabus_documents enable row level security;
alter table public.syllabus_units     enable row level security;
alter table public.syllabus_chunks    enable row level security;
alter table public.gap_reports        enable row level security;
alter table public.patches            enable row level security;
alter table public.job_skills         enable row level security;
alter table public.job_skill_vectors  enable row level security;

-- institutions ---------------------------------------------------------------
drop policy if exists institutions_select on public.institutions;
create policy institutions_select on public.institutions
  for select to authenticated
  using (id = public.current_institution_id());

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (institution_id = public.current_institution_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Only deans and admins may change roles within their own institution.
drop policy if exists profiles_update_by_admin on public.profiles;
create policy profiles_update_by_admin on public.profiles
  for update to authenticated
  using (
    institution_id = public.current_institution_id()
    and public.current_role_is(array['dean', 'admin']::public.user_role[])
  )
  with check (institution_id = public.current_institution_id());

-- audit_sessions -------------------------------------------------------------
drop policy if exists audit_sessions_select on public.audit_sessions;
create policy audit_sessions_select on public.audit_sessions
  for select to authenticated
  using (institution_id = public.current_institution_id());

drop policy if exists audit_sessions_insert on public.audit_sessions;
create policy audit_sessions_insert on public.audit_sessions
  for insert to authenticated
  with check (
    institution_id = public.current_institution_id()
    and created_by = auth.uid()
  );

drop policy if exists audit_sessions_update on public.audit_sessions;
create policy audit_sessions_update on public.audit_sessions
  for update to authenticated
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

drop policy if exists audit_sessions_delete on public.audit_sessions;
create policy audit_sessions_delete on public.audit_sessions
  for delete to authenticated
  using (
    institution_id = public.current_institution_id()
    and (created_by = auth.uid()
         or public.current_role_is(array['dean', 'admin']::public.user_role[]))
  );

-- Child tables inherit scope through their session. ---------------------------
drop policy if exists syllabus_documents_all on public.syllabus_documents;
create policy syllabus_documents_all on public.syllabus_documents
  for all to authenticated
  using (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()))
  with check (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()));

drop policy if exists syllabus_units_all on public.syllabus_units;
create policy syllabus_units_all on public.syllabus_units
  for all to authenticated
  using (exists (
    select 1 from public.syllabus_documents d
    join public.audit_sessions s on s.id = d.session_id
    where d.id = document_id and s.institution_id = public.current_institution_id()))
  with check (exists (
    select 1 from public.syllabus_documents d
    join public.audit_sessions s on s.id = d.session_id
    where d.id = document_id and s.institution_id = public.current_institution_id()));

drop policy if exists syllabus_chunks_all on public.syllabus_chunks;
create policy syllabus_chunks_all on public.syllabus_chunks
  for all to authenticated
  using (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()))
  with check (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()));

drop policy if exists gap_reports_all on public.gap_reports;
create policy gap_reports_all on public.gap_reports
  for all to authenticated
  using (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()))
  with check (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()));

drop policy if exists patches_all on public.patches;
create policy patches_all on public.patches
  for all to authenticated
  using (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()))
  with check (exists (
    select 1 from public.audit_sessions s
    where s.id = session_id and s.institution_id = public.current_institution_id()));

-- Job-market corpus is shared reference data: readable by any signed-in user,
-- writable only by the service role (which bypasses RLS entirely).
drop policy if exists job_skills_select on public.job_skills;
create policy job_skills_select on public.job_skills
  for select to authenticated using (true);

drop policy if exists job_skill_vectors_select on public.job_skill_vectors;
create policy job_skill_vectors_select on public.job_skill_vectors
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Similarity search helper
--
-- <=> is cosine DISTANCE, so similarity is 1 - distance and the gap score the
-- product reports is the distance itself.
-- ---------------------------------------------------------------------------
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
language sql
stable
as $$
  select
    v.skill_id,
    s.name,
    s.category,
    1 - (v.embedding <=> query_embedding) as similarity
  from public.job_skill_vectors v
  join public.job_skills s on s.id = v.skill_id
  order by v.embedding <=> query_embedding
  limit match_count
$$;

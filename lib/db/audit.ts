import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyllabusStructure } from "@/lib/syllabus/chunk";
import type { GapReport } from "@/lib/gap/score";
import type { SyllabusPatch } from "@/lib/patch/generate";
import type { MarketId } from "@/data/job-market";

/**
 * Persistence for completed audits.
 *
 * Everything here is best-effort by design: an audit that ran correctly must
 * still be shown to the user even if writing it away fails. A failed insert
 * therefore returns null and is surfaced as a telemetry note rather than thrown
 * — losing the record is a smaller harm than discarding a result the user
 * watched being computed.
 *
 * All writes go through the caller's session client, so RLS decides what may be
 * written. Nothing here uses the service role.
 */

export type PersistedAudit = { sessionId: string; documentId: string };

type ParsedMeta = {
  name: string;
  format: string;
  pages: number | null;
  characters: number;
};

export async function loadProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, institution_id, email, role, department")
    .eq("id", userId)
    .maybeSingle();

  return data as
    | { id: string; institution_id: string; email: string; role: string; department: string | null }
    | null;
}

export async function persistAudit(
  supabase: SupabaseClient,
  params: {
    userId: string;
    institutionId: string;
    market: MarketId;
    document: ParsedMeta;
    structure: SyllabusStructure;
    gap: GapReport | null;
    rawText: string;
  },
): Promise<{ result: PersistedAudit | null; error: string | null }> {
  const { structure, gap, document } = params;

  try {
    const { data: session, error: sessionError } = await supabase
      .from("audit_sessions")
      .insert({
        institution_id: params.institutionId,
        created_by: params.userId,
        course_code: structure.courseCode,
        course_title: structure.courseTitle,
        market: params.market,
        status: gap ? "analysed" : "draft",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return { result: null, error: sessionError?.message ?? "Could not create the audit session." };
    }

    const { data: doc, error: docError } = await supabase
      .from("syllabus_documents")
      .insert({
        session_id: session.id,
        filename: document.name,
        format: document.format,
        pages: document.pages,
        characters: document.characters,
        // Truncated: the source document is kept for provenance, not as a
        // document store, and Supabase's free tier is 500 MB.
        raw_text: params.rawText.slice(0, 200_000),
        declared_total_hours: structure.declaredTotalHours,
        summed_unit_hours: structure.summedUnitHours,
        boundary_confidence: structure.boundaryConfidence,
        course_outcomes: structure.courseOutcomes,
        textbooks: structure.textbooks,
      })
      .select("id")
      .single();

    if (docError || !doc) {
      return { result: null, error: docError?.message ?? "Could not store the document." };
    }

    if (structure.units.length > 0) {
      const { error: unitsError } = await supabase.from("syllabus_units").insert(
        structure.units.map((unit) => ({
          document_id: doc.id,
          unit_index: unit.index,
          label: unit.label,
          title: unit.title,
          body: unit.body.slice(0, 20_000),
          hours: unit.hours,
          topics: unit.topics,
        })),
      );
      if (unitsError) return { result: null, error: unitsError.message };
    }

    if (gap) {
      const { error: gapError } = await supabase.from("gap_reports").insert({
        session_id: session.id,
        market: gap.market,
        alignment: gap.alignment,
        relevance_floor: gap.relevanceFloor,
        coverage_threshold: gap.threshold,
        similarity_mean: gap.similarityMean,
        similarity_stddev: gap.similarityStdDev,
        in_scope_skills: gap.inScopeSkillCount,
        covered_skills: gap.coveredSkillCount,
        out_of_scope_skills: gap.outOfScopeSkillCount,
        total_hours: gap.totalHours,
        obsolete_hours: gap.obsoleteHours,
        modifiable_hours: gap.modifiableHours,
        // The whole report, so a saved audit can be reopened exactly as it was
        // rather than approximately re-derived.
        payload: gap,
      });
      if (gapError) return { result: null, error: gapError.message };
    }

    return { result: { sessionId: session.id, documentId: doc.id }, error: null };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "Persistence failed.",
    };
  }
}

export async function persistPatch(
  supabase: SupabaseClient,
  sessionId: string,
  patch: SyllabusPatch,
): Promise<string | null> {
  const { error } = await supabase.from("patches").insert({
    session_id: sessionId,
    status: "generated",
    model: `${patch.provider}/${patch.model}`,
    hours_used: patch.hoursUsed,
    hours_budget: patch.hoursBudget,
    bloom_passed: patch.outcomes.every((o) => o.bloom.passed),
    content: patch,
  });

  if (error) return error.message;

  await supabase.from("audit_sessions").update({ status: "patched" }).eq("id", sessionId);
  return null;
}

export type AuditSummary = {
  id: string;
  courseCode: string | null;
  courseTitle: string | null;
  market: string;
  status: string;
  createdAt: string;
  alignment: number | null;
  totalHours: number | null;
  filename: string | null;
};

/** Recent audits for the signed-in user's institution. */
export async function listAudits(
  supabase: SupabaseClient,
  limit = 20,
): Promise<AuditSummary[]> {
  const { data, error } = await supabase
    .from("audit_sessions")
    .select(
      `id, course_code, course_title, market, status, created_at,
       gap_reports ( alignment, total_hours ),
       syllabus_documents ( filename )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const gap = Array.isArray(row.gap_reports) ? row.gap_reports[0] : row.gap_reports;
    const doc = Array.isArray(row.syllabus_documents)
      ? row.syllabus_documents[0]
      : row.syllabus_documents;

    return {
      id: row.id as string,
      courseCode: row.course_code as string | null,
      courseTitle: row.course_title as string | null,
      market: row.market as string,
      status: row.status as string,
      createdAt: row.created_at as string,
      alignment: gap?.alignment != null ? Number(gap.alignment) : null,
      totalHours: gap?.total_hours != null ? Number(gap.total_hours) : null,
      filename: doc?.filename ?? null,
    };
  });
}

import type { BloomLevel } from "@/lib/obe/bloom";

/**
 * NBA Program Outcomes and deterministic CO→PO mapping.
 *
 * The mapping is rule-based rather than model-generated for the same reason as
 * the Bloom's validator: a CO–PO matrix is an accreditation artefact, and an
 * assessor is entitled to ask why a mapping exists and get an answer that does
 * not begin "the model decided". Every mapping produced here carries the reason
 * it fired.
 */

export const PROGRAM_OUTCOMES = {
  PO1: "Engineering Knowledge",
  PO2: "Problem Analysis",
  PO3: "Design/Development of Solutions",
  PO4: "Conduct Investigations of Complex Problems",
  PO5: "Modern Tool Usage",
  PO6: "The Engineer and Society",
  PO7: "Environment and Sustainability",
  PO8: "Ethics",
  PO9: "Individual and Team Work",
  PO10: "Communication",
  PO11: "Project Management and Finance",
  PO12: "Life-long Learning",
} as const;

export type ProgramOutcome = keyof typeof PROGRAM_OUTCOMES;

export type POMapping = {
  po: ProgramOutcome;
  /** 1 = slight, 2 = moderate, 3 = substantial — the NBA convention. */
  strength: 1 | 2 | 3;
  reason: string;
};

const TOOL_HINT =
  /\b(postgres|postgresql|mysql|mongodb|redis|kafka|docker|kubernetes|prisma|drizzle|pgvector|terraform|airflow|grafana|prometheus|jdbc|pgbouncer|hikari|debezium|snowflake|bigquery|elasticsearch|git|ci\/cd|pipeline|tool|framework|library|platform)\b/i;

const INVESTIGATE_HINT =
  /\b(experiment|measure|benchmark|profile|investigate|observe|instrument|latency|throughput|explain analyze|execution plan|slow query)\b/i;

const ETHICS_HINT = /\b(privacy|consent|dpdp|gdpr|personal data|ethic|compliance|audit trail)\b/i;

const SOCIETY_HINT = /\b(societal|public|citizen|healthcare|governance|accessib)\b/i;

const SUSTAINABILITY_HINT = /\b(sustainab|energy|carbon|footprint|efficien(t|cy) use of resources)\b/i;

const TEAM_HINT = /\b(team|pair|group|collaborat|peer review|code review)\b/i;

const COMMUNICATION_HINT =
  /\b(document|report|present|justify in writing|data dictionary|readme|write-up)\b/i;

const MANAGEMENT_HINT = /\b(cost|budget|capacity planning|estimate|resource|schedule|sla)\b/i;

const LIFELONG_HINT = /\b(emerging|evolving|new tool|self-study|keep pace|latest|modern stack)\b/i;

/**
 * Map a Course Outcome to Program Outcomes.
 *
 * PO1 always applies — any course outcome exercises engineering knowledge.
 * Everything else must be earned by evidence in the statement or by the
 * outcome's cognitive level.
 */
export function mapOutcomeToPOs(
  statement: string,
  level: BloomLevel,
  usesNamedTool: boolean,
): POMapping[] {
  const mappings: POMapping[] = [
    {
      po: "PO1",
      strength: 3,
      reason: "Applies domain knowledge from the course.",
    },
  ];

  if (level >= 4) {
    mappings.push({
      po: "PO2",
      strength: level >= 5 ? 3 : 2,
      reason: `Bloom's level ${level} requires analysing the problem before acting.`,
    });
  }

  if (level >= 6) {
    mappings.push({
      po: "PO3",
      strength: 3,
      reason: "Create-level outcome: the student designs or develops a solution.",
    });
  } else if (level >= 3) {
    mappings.push({
      po: "PO3",
      strength: 2,
      reason: "Apply-level outcome producing a working artefact.",
    });
  }

  if (INVESTIGATE_HINT.test(statement)) {
    mappings.push({
      po: "PO4",
      strength: 2,
      reason: "Requires empirical investigation or measurement.",
    });
  }

  if (usesNamedTool || TOOL_HINT.test(statement)) {
    mappings.push({
      po: "PO5",
      strength: 3,
      reason: "Names a specific modern engineering tool.",
    });
  }

  if (SOCIETY_HINT.test(statement)) {
    mappings.push({ po: "PO6", strength: 1, reason: "Addresses societal context." });
  }

  if (SUSTAINABILITY_HINT.test(statement)) {
    mappings.push({
      po: "PO7",
      strength: 1,
      reason: "Considers resource or environmental efficiency.",
    });
  }

  if (ETHICS_HINT.test(statement)) {
    mappings.push({
      po: "PO8",
      strength: 2,
      reason: "Engages data protection or professional ethics.",
    });
  }

  if (TEAM_HINT.test(statement)) {
    mappings.push({ po: "PO9", strength: 2, reason: "Carried out as team work." });
  }

  if (COMMUNICATION_HINT.test(statement)) {
    mappings.push({
      po: "PO10",
      strength: 2,
      reason: "Requires a written or presented deliverable.",
    });
  }

  if (MANAGEMENT_HINT.test(statement)) {
    mappings.push({
      po: "PO11",
      strength: 1,
      reason: "Involves cost, capacity or scheduling judgement.",
    });
  }

  if (LIFELONG_HINT.test(statement)) {
    mappings.push({
      po: "PO12",
      strength: 2,
      reason: "Engages tooling that post-dates the syllabus, requiring self-directed learning.",
    });
  }

  // Keep the strongest mapping per PO.
  const strongest = new Map<ProgramOutcome, POMapping>();
  for (const mapping of mappings) {
    const existing = strongest.get(mapping.po);
    if (!existing || mapping.strength > existing.strength) strongest.set(mapping.po, mapping);
  }

  return [...strongest.values()].sort((a, b) => a.po.localeCompare(b.po, undefined, { numeric: true }));
}

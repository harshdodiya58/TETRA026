import { getDriver } from "@/lib/graph/neo4j";

/**
 * Prerequisite reasoning over the skill graph.
 *
 * Every figure returned here is a count of something the query actually
 * matched — graph size, paths returned, the longest path length in the result.
 * Notably absent is any "nodes traversed" statistic: the driver does not expose
 * the planner's internal visit count, and inventing a large-sounding number
 * would be exactly the theatre this product exists to avoid.
 */

export type TeachableSkill = {
  id: string;
  name: string;
  prerequisites: string[];
  depth: number;
};

export type BlockedSkill = TeachableSkill & { missingPrerequisites: string[] };

export type RoleCoverage = {
  role: string;
  covered: number;
  total: number;
  share: number;
};

export type GraphInsight = {
  skillNodes: number;
  toolNodes: number;
  roleNodes: number;
  prerequisiteEdges: number;
  pathsReturned: number;
  maxHopDepth: number;
  teachableNow: TeachableSkill[];
  needsGroundwork: BlockedSkill[];
  roles: RoleCoverage[];
};

export async function traverseSkillGraph(
  coveredSkillIds: string[],
  missingSkillIds: string[],
): Promise<GraphInsight> {
  const session = getDriver().session({ defaultAccessMode: "READ" });

  try {
    const sizes = await session.run(`
      MATCH (s:Skill) WITH count(s) AS skills
      MATCH (t:Tool) WITH skills, count(t) AS tools
      MATCH (r:Role) WITH skills, tools, count(r) AS roles
      MATCH ()-[req:REQUIRES]->()
      RETURN skills, tools, roles, count(req) AS prerequisites
    `);

    const sizeRow = sizes.records[0];
    const skillNodes = toNumber(sizeRow?.get("skills"));
    const toolNodes = toNumber(sizeRow?.get("tools"));
    const roleNodes = toNumber(sizeRow?.get("roles"));
    const prerequisiteEdges = toNumber(sizeRow?.get("prerequisites"));

    // Prerequisite closure for each missing skill, to a depth of 3. Beyond
    // that the chain reaches foundations any degree course already covers.
    const paths = await session.run(
      `
      UNWIND $missing AS missingId
      MATCH (s:Skill {id: missingId})
      OPTIONAL MATCH path = (s)-[:REQUIRES*1..3]->(p:Skill)
      WITH s, collect(DISTINCT p.id) AS prereqIds, coalesce(max(length(path)), 0) AS depth
      RETURN s.id AS id, s.name AS name, prereqIds, depth
      `,
      { missing: missingSkillIds },
    );

    const covered = new Set(coveredSkillIds);
    const teachableNow: TeachableSkill[] = [];
    const needsGroundwork: BlockedSkill[] = [];
    let maxHopDepth = 0;

    for (const record of paths.records) {
      const prerequisites = (record.get("prereqIds") as string[]).filter(Boolean);
      const depth = toNumber(record.get("depth"));
      maxHopDepth = Math.max(maxHopDepth, depth);

      const entry: TeachableSkill = {
        id: record.get("id") as string,
        name: record.get("name") as string,
        prerequisites,
        depth,
      };

      const unmet = prerequisites.filter((id) => !covered.has(id));

      // A skill whose prerequisites the syllabus already teaches can be added
      // without laying new groundwork — the cheapest possible amendment.
      if (unmet.length === 0) teachableNow.push(entry);
      else needsGroundwork.push({ ...entry, missingPrerequisites: unmet });
    }

    const roleResult = await session.run(
      `
      MATCH (r:Role)-[:DEMANDS]->(s:Skill)
      WITH r, collect(s.id) AS ids
      RETURN r.name AS role,
             size(ids) AS total,
             size([x IN ids WHERE x IN $covered]) AS covered
      ORDER BY covered * 1.0 / total DESC
      `,
      { covered: coveredSkillIds },
    );

    const roles: RoleCoverage[] = roleResult.records.map((record) => {
      const total = toNumber(record.get("total"));
      const coveredCount = toNumber(record.get("covered"));
      return {
        role: record.get("role") as string,
        covered: coveredCount,
        total,
        share: total > 0 ? Math.round((coveredCount / total) * 1000) / 10 : 0,
      };
    });

    return {
      skillNodes,
      toolNodes,
      roleNodes,
      prerequisiteEdges,
      pathsReturned: paths.records.length,
      maxHopDepth,
      teachableNow,
      needsGroundwork,
      roles,
    };
  } finally {
    await session.close();
  }
}

/** neo4j returns 64-bit Integer objects for counts. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * Seeds the Neo4j skill graph from the job-market corpus.
 *
 *   node scripts/seed-skill-graph.mjs
 *
 * Idempotent: uses MERGE throughout, so re-running updates rather than
 * duplicates. Safe to run after editing data/skill-graph.ts.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(pathToFileURL(resolve(root, "package.json")).href);

for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

const neo4j = require("neo4j-driver");
const { JOB_SKILLS } = await import(pathToFileURL(resolve(root, "data/job-market.ts")).href);
const { PREREQUISITES, SKILL_TOOLS, ROLE_SKILLS } = await import(
  pathToFileURL(resolve(root, "data/skill-graph.ts")).href
);

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME ?? "neo4j";
const password = process.env.NEO4J_PASSWORD;

if (!uri || !password) {
  console.error("NEO4J_URI and NEO4J_PASSWORD must be set in .env.local");
  process.exit(1);
}
if (!/^(neo4j|bolt)(\+s|\+ssc)?:\/\//.test(uri)) {
  console.error(
    `NEO4J_URI is not a Bolt connection string: ${uri}\n` +
      "It should look like neo4j+s://<id>.databases.neo4j.io — not a console.neo4j.io link.",
  );
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

try {
  await driver.getServerInfo();
  console.log(`connected to ${uri}`);
} catch (error) {
  console.error(`connection failed: ${error.message}`);
  if (String(error.code).includes("Unauthorized")) {
    console.error("Check NEO4J_USERNAME/NEO4J_PASSWORD against the Aura credentials file.");
  }
  await driver.close();
  process.exit(1);
}

const session = driver.session();

try {
  console.log("creating constraints…");
  for (const statement of [
    "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT tool_name IF NOT EXISTS FOR (t:Tool) REQUIRE t.name IS UNIQUE",
    "CREATE CONSTRAINT role_name IF NOT EXISTS FOR (r:Role) REQUIRE r.name IS UNIQUE",
  ]) {
    await session.run(statement);
  }

  console.log(`merging ${JOB_SKILLS.length} skill nodes…`);
  await session.run(
    `
    UNWIND $skills AS skill
    MERGE (s:Skill {id: skill.id})
    SET s.name = skill.name,
        s.category = skill.category,
        s.emerging = skill.emerging,
        s.demandNational = skill.demandNational
    `,
    {
      skills: JOB_SKILLS.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        emerging: s.emerging,
        demandNational: s.demand.national,
      })),
    },
  );

  console.log(`merging ${PREREQUISITES.length} REQUIRES edges…`);
  await session.run(
    `
    UNWIND $pairs AS pair
    MATCH (a:Skill {id: pair[0]})
    MATCH (b:Skill {id: pair[1]})
    MERGE (a)-[:REQUIRES]->(b)
    `,
    { pairs: PREREQUISITES },
  );

  const toolPairs = Object.entries(SKILL_TOOLS).flatMap(([skillId, tools]) =>
    tools.map((tool) => ({ skillId, tool })),
  );
  console.log(`merging ${toolPairs.length} IMPLEMENTED_BY edges…`);
  await session.run(
    `
    UNWIND $pairs AS pair
    MATCH (s:Skill {id: pair.skillId})
    MERGE (t:Tool {name: pair.tool})
    MERGE (s)-[:IMPLEMENTED_BY]->(t)
    `,
    { pairs: toolPairs },
  );

  const rolePairs = Object.entries(ROLE_SKILLS).flatMap(([role, skills]) =>
    skills.map((skillId) => ({ role, skillId })),
  );
  console.log(`merging ${rolePairs.length} DEMANDS edges…`);
  await session.run(
    `
    UNWIND $pairs AS pair
    MERGE (r:Role {name: pair.role})
    WITH r, pair
    MATCH (s:Skill {id: pair.skillId})
    MERGE (r)-[:DEMANDS]->(s)
    `,
    { pairs: rolePairs },
  );

  const summary = await session.run(`
    MATCH (s:Skill) WITH count(s) AS skills
    MATCH (t:Tool) WITH skills, count(t) AS tools
    MATCH (r:Role) WITH skills, tools, count(r) AS roles
    MATCH ()-[e]->()
    RETURN skills, tools, roles, count(e) AS edges
  `);

  const row = summary.records[0];
  console.log(
    `\ngraph: ${row.get("skills")} skills · ${row.get("tools")} tools · ${row.get("roles")} roles · ${row.get("edges")} relationships`,
  );
} catch (error) {
  console.error("seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await session.close();
  await driver.close();
}

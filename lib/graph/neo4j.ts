import neo4j, { type Driver } from "neo4j-driver";

/**
 * Neo4j AuraDB driver.
 *
 * The driver is cached on globalThis rather than module scope because serverless
 * hot-reload and route isolation can evaluate a module more than once per
 * process; a fresh driver per invocation exhausts AuraDB Free's connection
 * allowance quickly.
 */

const URI = process.env.NEO4J_URI ?? "";
const USERNAME = process.env.NEO4J_USERNAME ?? "neo4j";
const PASSWORD = process.env.NEO4J_PASSWORD ?? "";

/**
 * A console URL is not a connection string. This is a real mistake to make
 * when copying from the Aura dashboard, and it fails with a confusing error
 * much later, so reject it up front.
 */
const VALID_SCHEME = /^(neo4j|neo4j\+s|neo4j\+ssc|bolt|bolt\+s|bolt\+ssc):\/\//;

export const isNeo4jConfigured = Boolean(URI && PASSWORD && VALID_SCHEME.test(URI));

export function neo4jConfigProblem(): string | null {
  if (!URI) return "NEO4J_URI is not set.";
  if (!VALID_SCHEME.test(URI)) {
    return "NEO4J_URI is not a Bolt connection string — it should look like neo4j+s://<id>.databases.neo4j.io, not a console.neo4j.io link.";
  }
  if (!PASSWORD) return "NEO4J_PASSWORD is not set.";
  return null;
}

const globalForNeo4j = globalThis as unknown as { __curripulseNeo4j?: Driver };

export function getDriver(): Driver {
  if (!isNeo4jConfigured) {
    throw new Error(neo4jConfigProblem() ?? "Neo4j is not configured.");
  }

  if (!globalForNeo4j.__curripulseNeo4j) {
    globalForNeo4j.__curripulseNeo4j = neo4j.driver(
      URI,
      neo4j.auth.basic(USERNAME, PASSWORD),
      {
        // AuraDB Free is small; a large pool provides no benefit and risks
        // hitting the instance's connection ceiling.
        maxConnectionPoolSize: 5,
        connectionAcquisitionTimeout: 10_000,
        connectionTimeout: 10_000,
        maxTransactionRetryTime: 8_000,
      },
    );
  }

  return globalForNeo4j.__curripulseNeo4j;
}

/** Cheap reachability probe used before a stage commits to running. */
export async function checkConnectivity(): Promise<{ ok: boolean; detail: string }> {
  if (!isNeo4jConfigured) {
    return { ok: false, detail: neo4jConfigProblem() ?? "Not configured." };
  }

  try {
    const info = await getDriver().getServerInfo();
    return { ok: true, detail: info.address ?? "connected" };
  } catch (error) {
    const code = (error as { code?: string })?.code ?? "";
    if (code.includes("Unauthorized")) {
      return {
        ok: false,
        detail:
          "Neo4j rejected the credentials. Check NEO4J_USERNAME and NEO4J_PASSWORD against the credentials file Aura issued at instance creation.",
      };
    }
    return {
      ok: false,
      detail: error instanceof Error ? error.message.slice(0, 180) : "Connection failed.",
    };
  }
}

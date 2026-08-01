/**
 * Indian tech job-market skill corpus.
 *
 * PROVENANCE — read before quoting these numbers anywhere.
 *
 * This is a *curated seed* compiled from public Indian tech job listings and
 * the NASSCOM FutureSkills competency taxonomy. It is NOT a live scrape, and
 * the demand weights are considered estimates rather than measurements. The
 * product surfaces that distinction in the UI, because a Dean is entitled to
 * know whether a number was counted or judged.
 *
 * Live Adzuna / JSearch top-up replaces these weights once those keys are set;
 * the shape of this file is what that ingest writes into.
 *
 * `demand` is the share of relevant data/backend postings in that market that
 * mention the skill, on 0-1. `description` is what actually gets embedded, so
 * it is written the way a job advertisement would phrase the requirement —
 * matching a syllabus unit against advertisement prose is the whole point.
 */

export const MARKETS = [
  "bengaluru",
  "hyderabad",
  "ncr",
  "pune",
  "national",
  "nasscom",
] as const;

export type MarketId = (typeof MARKETS)[number];

export const MARKET_LABELS: Record<MarketId, string> = {
  bengaluru: "Bengaluru · Tier-1 tech",
  hyderabad: "Hyderabad · Tier-1 tech",
  ncr: "Delhi NCR",
  pune: "Pune",
  national: "National average",
  nasscom: "NASSCOM FutureSkills",
};

export type SkillCategory = "data" | "backend" | "platform" | "ai" | "practice";

export type JobSkill = {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  demand: Record<MarketId, number>;
  /** Recent enough that syllabi rarely contain it — drives "missing" ranking. */
  emerging: boolean;
};

const d = (
  bengaluru: number,
  hyderabad: number,
  ncr: number,
  pune: number,
  nasscom: number,
): Record<MarketId, number> => ({
  bengaluru,
  hyderabad,
  ncr,
  pune,
  national: Number(((bengaluru + hyderabad + ncr + pune) / 4).toFixed(2)),
  nasscom,
});

export const JOB_SKILLS: JobSkill[] = [
  // ---------------------------------------------------------------- data
  {
    id: "sql-querying",
    name: "SQL querying",
    category: "data",
    description:
      "Write and optimise SQL queries: joins, aggregations, subqueries, window functions and common table expressions against a relational database.",
    demand: d(0.94, 0.93, 0.9, 0.91, 0.95),
    emerging: false,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "data",
    description:
      "Hands-on PostgreSQL in production: schema design, EXPLAIN ANALYZE, extensions, roles and permissions, and psql tooling.",
    demand: d(0.82, 0.78, 0.73, 0.76, 0.8),
    emerging: false,
  },
  {
    id: "query-optimisation",
    name: "Query optimisation & execution plans",
    category: "data",
    description:
      "Diagnose slow queries by reading execution plans, choosing access paths, and rewriting queries to eliminate sequential scans.",
    demand: d(0.71, 0.68, 0.62, 0.66, 0.74),
    emerging: false,
  },
  {
    id: "indexing-strategy",
    name: "Index design (B-tree, GIN, composite)",
    category: "data",
    description:
      "Design indexes for real workloads: B-tree, composite and covering indexes, partial and GIN indexes, and the write-amplification cost of over-indexing.",
    demand: d(0.69, 0.65, 0.6, 0.63, 0.72),
    emerging: false,
  },
  {
    id: "vector-indexing",
    name: "Vector indexing (pgvector, HNSW)",
    category: "data",
    description:
      "Store and search embedding vectors using pgvector with HNSW or IVFFlat indexes, tuning recall against query latency for semantic search.",
    demand: d(0.44, 0.36, 0.28, 0.3, 0.52),
    emerging: true,
  },
  {
    id: "orm-prisma-drizzle",
    name: "ORM tooling (Prisma, Drizzle, Hibernate)",
    category: "data",
    description:
      "Model schemas and run type-safe database access through an ORM such as Prisma, Drizzle or Hibernate, including generated migrations.",
    demand: d(0.66, 0.6, 0.58, 0.61, 0.63),
    emerging: true,
  },
  {
    id: "schema-migrations",
    name: "Versioned schema migrations",
    category: "data",
    description:
      "Evolve a live schema safely with versioned, reversible migrations applied through CI, including backward-compatible column changes and zero-downtime deploys.",
    demand: d(0.61, 0.57, 0.53, 0.56, 0.66),
    emerging: true,
  },
  {
    id: "connection-pooling",
    name: "Connection pooling",
    category: "data",
    description:
      "Configure and size database connection pools such as PgBouncer or HikariCP, and reason about pool exhaustion under concurrent load.",
    demand: d(0.53, 0.48, 0.42, 0.47, 0.55),
    emerging: true,
  },
  {
    id: "normalisation",
    name: "Normalisation & schema design",
    category: "data",
    description:
      "Apply functional dependencies and normal forms up to BCNF to design relational schemas, and judge when denormalisation is warranted.",
    demand: d(0.58, 0.56, 0.55, 0.55, 0.7),
    emerging: false,
  },
  {
    id: "transactions-isolation",
    name: "Transactions & isolation levels",
    category: "data",
    description:
      "Reason about ACID guarantees and isolation levels in production: read committed versus repeatable read, phantom reads, deadlocks and retry logic.",
    demand: d(0.64, 0.61, 0.57, 0.6, 0.72),
    emerging: false,
  },
  {
    id: "nosql-document",
    name: "NoSQL document stores (MongoDB, DynamoDB)",
    category: "data",
    description:
      "Model data in a document store such as MongoDB or DynamoDB, choosing partition keys and accepting eventual consistency trade-offs.",
    demand: d(0.57, 0.54, 0.52, 0.5, 0.58),
    emerging: false,
  },
  {
    id: "redis-caching",
    name: "Caching layers (Redis)",
    category: "data",
    description:
      "Use Redis or Memcached as a cache-aside layer, choosing eviction policies and TTLs and handling cache invalidation and stampedes.",
    demand: d(0.62, 0.58, 0.54, 0.57, 0.6),
    emerging: false,
  },
  {
    id: "sharding-partitioning",
    name: "Sharding & partitioning",
    category: "data",
    description:
      "Scale a database horizontally with table partitioning, read replicas and sharding, and handle cross-shard queries and rebalancing.",
    demand: d(0.46, 0.42, 0.36, 0.39, 0.5),
    emerging: false,
  },
  {
    id: "cdc-streaming",
    name: "Change data capture & streaming (Kafka, Debezium)",
    category: "data",
    description:
      "Stream database changes into downstream systems using Kafka and change data capture tools such as Debezium for event-driven architectures.",
    demand: d(0.43, 0.39, 0.33, 0.37, 0.48),
    emerging: true,
  },
  {
    id: "data-warehouse",
    name: "Analytical warehouses (Snowflake, BigQuery)",
    category: "data",
    description:
      "Model and query analytical data in a columnar warehouse such as Snowflake, BigQuery or Redshift, including star schemas and dbt transformations.",
    demand: d(0.45, 0.47, 0.38, 0.4, 0.53),
    emerging: true,
  },
  {
    id: "elasticsearch",
    name: "Search engines (Elasticsearch, OpenSearch)",
    category: "data",
    description:
      "Index and query documents in Elasticsearch or OpenSearch, tuning analysers, relevance scoring and aggregations for full-text search.",
    demand: d(0.38, 0.34, 0.31, 0.33, 0.4),
    emerging: false,
  },
  {
    id: "backup-recovery",
    name: "Backup, PITR & disaster recovery",
    category: "data",
    description:
      "Operate backups and point-in-time recovery, rehearse restores, and reason about recovery point and recovery time objectives.",
    demand: d(0.41, 0.39, 0.37, 0.38, 0.47),
    emerging: false,
  },
  {
    id: "stored-procedures",
    name: "Stored procedures & PL/SQL",
    category: "data",
    description:
      "Write server-side stored procedures, triggers and cursors in PL/SQL or T-SQL for legacy enterprise database applications.",
    demand: d(0.19, 0.22, 0.26, 0.21, 0.18),
    emerging: false,
  },
  {
    id: "er-diagram-manual",
    name: "Manual ER diagram drafting",
    category: "data",
    description:
      "Draw entity-relationship diagrams by hand using Chen or crow's-foot notation as a documentation exercise, without schema generation tooling.",
    demand: d(0.08, 0.09, 0.11, 0.09, 0.12),
    emerging: false,
  },
  {
    id: "relational-algebra",
    name: "Relational algebra & calculus",
    category: "data",
    description:
      "Express queries in relational algebra and tuple or domain relational calculus as a formal foundation for query languages.",
    demand: d(0.07, 0.07, 0.08, 0.07, 0.15),
    emerging: false,
  },
  {
    id: "legacy-data-models",
    name: "Hierarchical & network data models",
    category: "data",
    description:
      "Describe pre-relational hierarchical and network database models such as IMS and CODASYL and their navigational access patterns.",
    demand: d(0.02, 0.02, 0.03, 0.02, 0.03),
    emerging: false,
  },

  // ------------------------------------------------------------- backend
  {
    id: "rest-api-design",
    name: "REST API design",
    category: "backend",
    description:
      "Design and implement REST APIs with sensible resource modelling, status codes, pagination, versioning and error contracts.",
    demand: d(0.84, 0.8, 0.79, 0.81, 0.82),
    emerging: false,
  },
  {
    id: "python-backend",
    name: "Python (FastAPI, Django)",
    category: "backend",
    description:
      "Build backend services in Python using FastAPI or Django, including async request handling and dependency injection.",
    demand: d(0.72, 0.74, 0.7, 0.71, 0.75),
    emerging: false,
  },
  {
    id: "java-spring",
    name: "Java & Spring Boot",
    category: "backend",
    description:
      "Develop enterprise services with Java and Spring Boot, including JPA persistence, dependency injection and Spring Data repositories.",
    demand: d(0.68, 0.71, 0.72, 0.74, 0.7),
    emerging: false,
  },
  {
    id: "typescript-node",
    name: "TypeScript & Node.js",
    category: "backend",
    description:
      "Write server-side TypeScript on Node.js with strict typing, async patterns and a typed data-access layer.",
    demand: d(0.7, 0.63, 0.66, 0.62, 0.64),
    emerging: false,
  },
  {
    id: "auth-security",
    name: "Authentication & authorisation",
    category: "backend",
    description:
      "Implement authentication and authorisation with OAuth2, JWT, session management and role-based access control.",
    demand: d(0.66, 0.62, 0.6, 0.62, 0.71),
    emerging: false,
  },
  {
    id: "sql-injection-defence",
    name: "Injection defence & parameterised queries",
    category: "backend",
    description:
      "Prevent SQL injection with parameterised queries and prepared statements, and validate untrusted input at the persistence boundary.",
    demand: d(0.58, 0.55, 0.54, 0.55, 0.68),
    emerging: false,
  },
  {
    id: "api-testing",
    name: "Automated testing of data access",
    category: "backend",
    description:
      "Write automated tests for database-backed code using fixtures, test containers and transactional rollback between cases.",
    demand: d(0.57, 0.53, 0.5, 0.54, 0.62),
    emerging: true,
  },

  // ------------------------------------------------------------ platform
  {
    id: "docker",
    name: "Containers (Docker)",
    category: "platform",
    description:
      "Package and run services in Docker containers, including multi-stage builds and running a database locally with docker compose.",
    demand: d(0.78, 0.74, 0.71, 0.75, 0.79),
    emerging: false,
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "platform",
    description:
      "Deploy and operate workloads on Kubernetes, including stateful sets for databases, config maps, secrets and health probes.",
    demand: d(0.55, 0.5, 0.45, 0.51, 0.58),
    emerging: false,
  },
  {
    id: "cloud-managed-db",
    name: "Managed cloud databases (RDS, Cloud SQL)",
    category: "platform",
    description:
      "Provision and operate managed database services such as Amazon RDS, Aurora, Cloud SQL or Azure SQL, including failover and scaling.",
    demand: d(0.63, 0.61, 0.55, 0.58, 0.67),
    emerging: false,
  },
  {
    id: "ci-cd",
    name: "CI/CD pipelines",
    category: "platform",
    description:
      "Automate build, test and deployment through CI/CD pipelines, including running schema migrations as a deployment step.",
    demand: d(0.67, 0.63, 0.59, 0.64, 0.69),
    emerging: false,
  },
  {
    id: "observability",
    name: "Observability (metrics, tracing, slow-query logs)",
    category: "platform",
    description:
      "Instrument services with metrics, structured logs and distributed tracing, and use slow-query logs to find database bottlenecks.",
    demand: d(0.52, 0.48, 0.43, 0.47, 0.57),
    emerging: true,
  },
  {
    id: "infra-as-code",
    name: "Infrastructure as code (Terraform)",
    category: "platform",
    description:
      "Declare cloud infrastructure including database instances and networking using Terraform or equivalent tooling.",
    demand: d(0.44, 0.41, 0.36, 0.42, 0.49),
    emerging: true,
  },
  {
    id: "git-collaboration",
    name: "Git & code review",
    category: "platform",
    description:
      "Collaborate through Git with branching strategies, pull requests and code review, including reviewing schema change proposals.",
    demand: d(0.86, 0.84, 0.82, 0.84, 0.85),
    emerging: false,
  },

  // ------------------------------------------------------------------ ai
  {
    id: "rag-pipelines",
    name: "Retrieval-augmented generation pipelines",
    category: "ai",
    description:
      "Build retrieval-augmented generation systems that chunk documents, embed them into a vector store and retrieve context for a language model.",
    demand: d(0.48, 0.4, 0.32, 0.34, 0.61),
    emerging: true,
  },
  {
    id: "embeddings",
    name: "Text embeddings & semantic search",
    category: "ai",
    description:
      "Generate text embeddings and rank results by cosine similarity to power semantic search over unstructured content.",
    demand: d(0.45, 0.38, 0.3, 0.32, 0.58),
    emerging: true,
  },
  {
    id: "llm-api-integration",
    name: "LLM API integration",
    category: "ai",
    description:
      "Integrate large language model APIs into applications with streaming responses, structured output, retries and rate-limit handling.",
    demand: d(0.5, 0.43, 0.36, 0.38, 0.62),
    emerging: true,
  },
  {
    id: "graph-databases",
    name: "Graph databases (Neo4j, Cypher)",
    category: "ai",
    description:
      "Model connected data as a property graph and traverse it with Cypher for recommendations, fraud detection and knowledge graphs.",
    demand: d(0.24, 0.2, 0.18, 0.19, 0.33),
    emerging: true,
  },
  {
    id: "data-pipelines",
    name: "Data pipelines & orchestration (Airflow)",
    category: "ai",
    description:
      "Schedule and monitor batch data pipelines with an orchestrator such as Airflow or Dagster, including idempotent reruns and backfills.",
    demand: d(0.42, 0.44, 0.35, 0.38, 0.5),
    emerging: false,
  },
  {
    id: "pandas-analysis",
    name: "Data analysis (pandas, SQL analytics)",
    category: "ai",
    description:
      "Explore and aggregate datasets with pandas and analytical SQL to answer business questions and validate data quality.",
    demand: d(0.59, 0.61, 0.55, 0.56, 0.66),
    emerging: false,
  },

  // ------------------------------------------------------------ practice
  {
    id: "system-design",
    name: "System design",
    category: "practice",
    description:
      "Design systems end to end, choosing a data store for the access pattern and reasoning about consistency, availability and scale.",
    demand: d(0.64, 0.6, 0.57, 0.6, 0.7),
    emerging: false,
  },
  {
    id: "data-privacy",
    name: "Data privacy & the DPDP Act",
    category: "practice",
    description:
      "Handle personal data lawfully under India's Digital Personal Data Protection Act, including consent, retention limits, encryption at rest and audit trails.",
    demand: d(0.35, 0.33, 0.34, 0.32, 0.55),
    emerging: true,
  },
  {
    id: "capacity-cost",
    name: "Capacity planning & cloud cost awareness",
    category: "practice",
    description:
      "Estimate storage growth, query throughput and the cloud cost implications of a data architecture decision.",
    demand: d(0.33, 0.31, 0.29, 0.31, 0.4),
    emerging: true,
  },
  {
    id: "documentation",
    name: "Technical documentation & data dictionaries",
    category: "practice",
    description:
      "Document schemas, data dictionaries and architectural decisions so that other engineers can safely change the system.",
    demand: d(0.4, 0.38, 0.37, 0.39, 0.5),
    emerging: false,
  },
];

/** Demand for a skill in a given market. */
export function demandFor(skill: JobSkill, market: MarketId): number {
  return skill.demand[market];
}

export function skillById(id: string): JobSkill | undefined {
  return JOB_SKILLS.find((s) => s.id === id);
}

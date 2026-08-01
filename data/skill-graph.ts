/**
 * Skill dependency graph over the job-market corpus.
 *
 * The vector layer answers "is this skill present in the syllabus?". The graph
 * answers a question vectors cannot: "given what this course already teaches,
 * is this addition even teachable?" A Board of Studies rejects proposals that
 * assume groundwork the course does not lay, so an addition whose
 * prerequisites are already covered is a far easier motion to carry than one
 * that is not.
 *
 * Edges are curated domain knowledge, not inferred. They are asserted here
 * rather than derived so that a wrong edge can be argued with and corrected.
 */

/** [skill, requires] — the first skill depends on the second. */
export const PREREQUISITES: [string, string][] = [
  // Retrieval and AI stack
  ["vector-indexing", "indexing-strategy"],
  ["vector-indexing", "embeddings"],
  ["rag-pipelines", "vector-indexing"],
  ["rag-pipelines", "embeddings"],
  ["rag-pipelines", "llm-api-integration"],
  ["embeddings", "sql-querying"],
  ["llm-api-integration", "rest-api-design"],

  // Core relational chain
  ["query-optimisation", "sql-querying"],
  ["query-optimisation", "indexing-strategy"],
  ["indexing-strategy", "sql-querying"],
  ["normalisation", "sql-querying"],
  ["postgresql", "sql-querying"],
  ["transactions-isolation", "sql-querying"],
  ["stored-procedures", "sql-querying"],
  ["relational-algebra", "sql-querying"],

  // Scaling and operations
  ["sharding-partitioning", "indexing-strategy"],
  ["sharding-partitioning", "transactions-isolation"],
  ["connection-pooling", "postgresql"],
  ["redis-caching", "query-optimisation"],
  ["backup-recovery", "transactions-isolation"],
  ["cdc-streaming", "transactions-isolation"],
  ["cdc-streaming", "postgresql"],
  ["observability", "query-optimisation"],
  ["cloud-managed-db", "postgresql"],
  ["data-warehouse", "sql-querying"],
  ["data-warehouse", "normalisation"],
  ["elasticsearch", "indexing-strategy"],
  ["nosql-document", "normalisation"],

  // Application layer
  ["orm-prisma-drizzle", "normalisation"],
  ["orm-prisma-drizzle", "sql-querying"],
  ["schema-migrations", "orm-prisma-drizzle"],
  ["schema-migrations", "ci-cd"],
  ["sql-injection-defence", "sql-querying"],
  ["api-testing", "rest-api-design"],
  ["api-testing", "transactions-isolation"],
  ["auth-security", "rest-api-design"],

  // Platform
  ["kubernetes", "docker"],
  ["ci-cd", "git-collaboration"],
  ["infra-as-code", "cloud-managed-db"],
  ["cloud-managed-db", "docker"],
  ["data-pipelines", "sql-querying"],
  ["pandas-analysis", "sql-querying"],

  // Practice
  ["system-design", "transactions-isolation"],
  ["system-design", "sharding-partitioning"],
  ["capacity-cost", "cloud-managed-db"],
  ["data-privacy", "auth-security"],
  ["documentation", "normalisation"],
];

/** Tools that implement a skill, for Skill→Tool traversal. */
export const SKILL_TOOLS: Record<string, string[]> = {
  postgresql: ["PostgreSQL", "psql"],
  "vector-indexing": ["pgvector", "HNSW", "IVFFlat"],
  "orm-prisma-drizzle": ["Prisma", "Drizzle", "Hibernate"],
  "connection-pooling": ["PgBouncer", "HikariCP"],
  "redis-caching": ["Redis", "Memcached"],
  "cdc-streaming": ["Kafka", "Debezium"],
  "data-warehouse": ["Snowflake", "BigQuery", "dbt"],
  elasticsearch: ["Elasticsearch", "OpenSearch"],
  docker: ["Docker", "docker compose"],
  kubernetes: ["Kubernetes"],
  "ci-cd": ["GitHub Actions", "GitLab CI"],
  observability: ["Grafana", "Prometheus", "OpenTelemetry"],
  "infra-as-code": ["Terraform"],
  "data-pipelines": ["Airflow", "Dagster"],
  "pandas-analysis": ["pandas"],
  "graph-databases": ["Neo4j", "Cypher"],
  "nosql-document": ["MongoDB", "DynamoDB"],
  "cloud-managed-db": ["Amazon RDS", "Cloud SQL", "Aurora"],
  "query-optimisation": ["EXPLAIN ANALYZE"],
  "schema-migrations": ["Flyway", "Prisma Migrate"],
  "stored-procedures": ["PL/SQL", "T-SQL"],
  "git-collaboration": ["Git"],
  "python-backend": ["FastAPI", "Django"],
  "java-spring": ["Spring Boot"],
  "typescript-node": ["TypeScript", "Node.js"],
  "rag-pipelines": ["LangChain", "LlamaIndex"],
};

/** Roles that demand a skill, for Skill→Role traversal. */
export const ROLE_SKILLS: Record<string, string[]> = {
  "Backend Engineer": [
    "sql-querying", "rest-api-design", "postgresql", "orm-prisma-drizzle",
    "auth-security", "transactions-isolation", "redis-caching", "docker",
    "sql-injection-defence", "api-testing",
  ],
  "Data Engineer": [
    "sql-querying", "data-warehouse", "data-pipelines", "cdc-streaming",
    "pandas-analysis", "sharding-partitioning", "normalisation", "postgresql",
  ],
  "Database Administrator": [
    "postgresql", "query-optimisation", "indexing-strategy", "backup-recovery",
    "connection-pooling", "transactions-isolation", "sharding-partitioning",
    "observability", "cloud-managed-db",
  ],
  "Platform Engineer": [
    "docker", "kubernetes", "ci-cd", "infra-as-code", "observability",
    "cloud-managed-db", "git-collaboration",
  ],
  "AI Engineer": [
    "embeddings", "vector-indexing", "rag-pipelines", "llm-api-integration",
    "postgresql", "graph-databases",
  ],
};

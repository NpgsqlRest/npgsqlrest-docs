// Shared blog posts data - single source of truth for blog navigation
// Update this file when adding new blog posts

export interface BlogPost {
  title: string
  path: string
}

export const blogPosts: BlogPost[] = [
  { title: 'Benchmark 2026-07 (Series)', path: '/blog/benchmarks-2026-07/' },
  { title: 'NpgsqlRest 3.20.0: Dart, Hooks & Tool Schemas', path: '/blog/npgsqlrest-3.20-dart-client-react-query-tool-schemas' },
  { title: 'Tests Are SQL Files Too', path: '/blog/npgsqlrest-3.19-sql-test-runner-watch-mode' },
  { title: 'The Backend That Writes Itself (Slide Deck)', path: '/blog/the-backend-that-writes-itself-presentation' },
  { title: 'PostgreSQL as MCP Tools for AI Agents', path: '/blog/mcp-server-postgresql-ai-tools-npgsqlrest' },
  { title: 'Web Scraping with HTTP Types', path: '/blog/web-scraping-postgresql-http-types-xml' },
  { title: 'Case Study: 74 Endpoints, Zero Backend Code', path: '/blog/case-study-zero-backend-code' },
  { title: 'TypeScript Code Generation Walkthrough', path: '/blog/typescript-codegen-walkthrough' },
  { title: 'NpgsqlRest 3.13.0: Production Patterns', path: '/blog/npgsqlrest-3.13-production-patterns' },
  { title: 'SQL REST API', path: '/blog/sql-rest-api' },
  { title: 'SQL File Source', path: '/blog/sql-file-source-rest-api-from-plain-sql' },
  { title: 'Excel Exports Done Right', path: '/blog/excel-export-table-format-postgresql-npgsqlrest' },
  { title: 'Passkey SQL Auth', path: '/blog/passkey-sql-auth' },
  { title: 'Custom Types & Multiset', path: '/blog/custom-types-multiset-rest-api' },
  { title: 'Performance & High Availability', path: '/blog/performance-scalability-high-availability-npgsqlrest' },
  { title: 'Benchmark 2026 (January)', path: '/blog/postgresql-rest-api-benchmark-2026' },
  { title: 'End-to-End Type Checking', path: '/blog/end-to-end-static-type-checking-postgresql-typescript' },
  { title: 'Database-Level Security', path: '/blog/database-level-security-postgresql-authentication' },
  { title: 'Multiple Auth Schemes & RBAC', path: '/blog/multiple-auth-schemes-rbac-external-providers' },
  { title: 'PostgreSQL BI Server', path: '/blog/postgresql-bi-server-excel-csv-basic-auth' },
  { title: 'Secure Image Uploads', path: '/blog/secure-image-uploads-postgresql-typescript' },
  { title: 'CSV & Excel Ingestion', path: '/blog/csv-excel-ingestion-postgresql-npgsqlrest' },
  { title: 'Real-Time Chat with SSE', path: '/blog/real-time-chat-postgresql-sse-npgsqlrest' },
  { title: 'External API Calls', path: '/blog/external-api-calls-postgresql-http-types' },
  { title: 'Reverse Proxy & AI Service', path: '/blog/reverse-proxy-postgresql-ai-service-npgsqlrest' },
  { title: 'NpgsqlRest vs PostgREST vs Supabase', path: '/blog/npgsqlrest-vs-postgrest-supabase-comparison' },
  { title: 'What Have Stored Procedures Done for Us?', path: '/blog/what-have-stored-procedures-ever-done-for-us' },
  { title: 'The Power of Simplicity', path: '/blog/the-power-of-simplicity' },
]

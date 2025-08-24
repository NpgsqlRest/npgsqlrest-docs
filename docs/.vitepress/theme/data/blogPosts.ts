// Shared blog posts data - single source of truth for blog navigation
// Update this file when adding new blog posts

export interface BlogPost {
  title: string
  path: string
}

export const blogPosts: BlogPost[] = [
  { title: 'Excel Exports Done Right', path: '/blog/excel-export-table-format-postgresql-npgsqlrest' },
  { title: 'Passkey SQL Auth', path: '/blog/passkey-sql-auth' },
  { title: 'Custom Types & Multiset', path: '/blog/custom-types-multiset-rest-api' },
  { title: 'Performance & High Availability', path: '/blog/performance-scalability-high-availability-npgsqlrest' },
  { title: 'Benchmark 2026', path: '/blog/postgresql-rest-api-benchmark-2026' },
  { title: 'End-to-End Type Checking', path: '/blog/end-to-end-static-type-checking-postgresql-typescript' },
  { title: 'Database-Level Security', path: '/blog/database-level-security-postgresql-authentication' },
  { title: 'Multiple Auth Schemes & RBAC', path: '/blog/multiple-auth-schemes-rbac-external-providers' },
  { title: 'PostgreSQL BI Server', path: '/blog/postgresql-bi-server-excel-csv-basic-auth' },
  { title: 'Secure Image Uploads', path: '/blog/secure-image-uploads-postgresql-typescript' },
  { title: 'CSV & Excel Ingestion', path: '/blog/csv-excel-ingestion-postgresql-npgsqlrest' },
  { title: 'Real-Time Chat with SSE', path: '/blog/real-time-chat-postgresql-sse-npgsqlrest' },
  { title: 'External API Calls', path: '/blog/external-api-calls-postgresql-http-types' },
  { title: 'Reverse Proxy & AI Service', path: '/blog/reverse-proxy-postgresql-ai-service-npgsqlrest' },
  { title: 'Zero to CRUD API', path: '/blog/zero-to-crud-api-postgresql-tables-npgsqlrest' },
  { title: 'NpgsqlRest vs PostgREST vs Supabase', path: '/blog/npgsqlrest-vs-postgrest-supabase-comparison' },
  { title: 'Optimization Labels 101', path: '/blog/optimization-labels-101' },
  { title: 'The NpgsqlRest Story', path: '/blog/npgsqlrest-story-told-without-ai' },
  { title: 'What Have Stored Procedures Done for Us?', path: '/blog/what-have-stored-procedures-ever-done-for-us' },
]

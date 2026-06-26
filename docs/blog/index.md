---
title: Blog
description: "NpgsqlRest blog: tutorials, feature deep dives, benchmarks, and comparisons for building REST APIs directly from PostgreSQL functions and SQL files."
---

# Blog Posts & Tutorials

<div class="blog-links blog-hero">
  <a href="/blog/benchmarks-2026-07/" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>PostgreSQL REST API Benchmark, July 2026 — 20 Services, 760 Tests</strong>
    <span>The most controlled benchmark round to date: equalized workers, pools, and CPU budgets across 16 frameworks and 6 NpgsqlRest configurations. A full analysis series — per-framework deep dives, the routine-vs-SQL-files verdict, resource efficiency, and the complete raw dataset</span>
  </a>
</div>

<div class="blog-links">
  <a href="/blog/npgsqlrest-3.20-dart-client-react-query-tool-schemas" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>NpgsqlRest 3.20.0: Dart Clients for Flutter, React Query Hooks, and Tool Schemas for AI Agents</strong>
    <span>A code-generation release: typed Dart clients for every Flutter target, TanStack Query hooks with exported key factories generated alongside the TypeScript client, the @mcp tool catalog projected into OpenAI/Anthropic tools documents and llms.txt, and the new HTTP QUERY method across the stack</span>
  </a>
  <a href="/blog/npgsqlrest-3.19-sql-test-runner-watch-mode" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>Tests Are SQL Files Too</strong>
    <span>The story behind NpgsqlRest 3.19.0 — write endpoint tests as plain .sql files that invoke the real endpoint in-process, inside the test's own transaction; watch mode that turns the live database schema into your type checker; and why database testing was never actually impossible — you were just using the wrong database</span>
  </a>
  <a href="/blog/case-study-zero-backend-code" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>Case Study: 74 Endpoints, Zero Backend Code — A Production App Built Entirely on NpgsqlRest</strong>
    <span>What it actually looks like to ship a production application without a controller layer. Real numbers from a finance/visualization app: ~74 HTTP endpoints, 12K LOC of SQL, zero lines of C# or Python, and an estimated 3,500–7,300 LOC of host-language boilerplate eliminated</span>
  </a>
  <a href="/blog/the-backend-that-writes-itself-presentation" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>The Backend That Writes Itself — NpgsqlRest in 19 Slides</strong>
    <span>An interactive slide deck with page controls, keyboard navigation, and speaker notes. The whole NpgsqlRest pitch — PostgreSQL in, REST API + typed TypeScript client + AI-agent tools out — with real, reproducible numbers from a product in production</span>
  </a>
  <a href="/blog/mcp-server-postgresql-ai-tools-npgsqlrest" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>Turn PostgreSQL into MCP Tools an AI Agent Can Call</strong>
    <span>NpgsqlRest 3.17.0 adds Model Context Protocol support. Annotate a function or .sql file with @mcp and it becomes a tool an AI agent can discover and call — one source, two interfaces (REST + MCP), with structured output, MCP-only tools, and per-tool authorization</span>
  </a>
  <a href="/blog/typescript-codegen-walkthrough" class="featured">
    <strong>From SQL to Type-Safe TypeScript: A Walkthrough of NpgsqlRest's Code Generator</strong>
    <span>Generate typed fetch modules and TypeScript interfaces directly from PostgreSQL functions and SQL files. End-to-end type safety, per-endpoint control with @tsclient annotations, and real-world dev/prod workflow</span>
  </a>
  <a href="/blog/npgsqlrest-3.13-production-patterns" class="featured">
    <strong>NpgsqlRest 3.13.0: Cache Profiles, Auth Schemes, Per-User Rate Limits, and pgBouncer Compatibility</strong>
    <span>Conditional caching with When rules, short-lived sensitive sessions, per-user rate limiting, and multi-tenant search_path with pgBouncer — all real-world production patterns</span>
  </a>
  <a href="/blog/sql-rest-api" class="featured">
    <strong>SQL REST API</strong>
    <span>The story behind NpgsqlRest 3.12.0 — SQL file endpoints, the philosophy of database-first development, AI tools, and why I think Clean Architecture got it wrong</span>
  </a>
  <a href="/blog/sql-file-source-rest-api-from-plain-sql" class="featured">
    <strong>REST APIs from Plain SQL Files: The Complete Guide to SQL File Source</strong>
    <span>Build REST APIs directly from .sql files - no functions, no procedures, no boilerplate. Multi-command endpoints, automatic parameter inference, and TypeScript generation</span>
  </a>
  <a href="/blog/excel-export-table-format-postgresql-npgsqlrest" class="featured">
    <strong>Excel Exports Done Right: Zero-Allocation Streaming from PostgreSQL</strong>
    <span>Stream .xlsx exports directly from PostgreSQL with constant memory - zero allocations, native types, one SQL annotation</span>
  </a>
  <a href="/blog/passkey-sql-auth" class="featured">
    <strong>Implementing WebAuthn Passkeys with Pure SQL</strong>
    <span>Passwordless authentication using device biometrics - complete SQL-based passkey registration, login, and credential management</span>
  </a>
  <a href="/blog/npgsqlrest-vs-postgrest-supabase-comparison" class="featured">
    <strong>NpgsqlRest vs PostgREST vs Supabase: Complete Feature Comparison</strong>
    <span>Side-by-side comparison with performance benchmarks, features, authentication, file handling, and deployment options</span>
  </a>
  <a href="/blog/postgresql-rest-api-benchmark-2026" class="featured">
    <strong>PostgreSQL REST API Benchmark 2026: 14 Frameworks Compared</strong>
    <span>The January 2026 round: NpgsqlRest, PostgREST, Swoole PHP, Go, Rust, Express, FastAPI, Spring Boot and more serving the same PostgreSQL functions under load</span>
  </a>
  <a href="/blog/performance-scalability-high-availability-npgsqlrest" class="featured">
    <strong>Performance, Scalability, and High Availability</strong>
    <span>Caching strategies, retry logic, rate limiting, and multi-host PostgreSQL connections for production APIs</span>
  </a>
  <a href="/blog/custom-types-multiset-rest-api">
    <strong>Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs</strong>
    <span>Use PostgreSQL custom types and table types to build hierarchical REST API responses with automatic TypeScript generation</span>
  </a>
  <a href="/blog/the-power-of-simplicity">
    <strong>The Power of Simplicity</strong>
    <span>How collapsing the standard data access pattern down to UI → RDBMS could save enough energy to power a small country</span>
  </a>
  <a href="/blog/end-to-end-static-type-checking-postgresql-typescript">
    <strong>End-to-End Static Type Checking: PostgreSQL to TypeScript</strong>
    <span>How to achieve compile-time type safety from database to frontend with NpgsqlRest</span>
  </a>
  <a href="/blog/database-level-security-postgresql-authentication">
    <strong>Database-Level Security: PostgreSQL Authentication</strong>
    <span>Implementing the Principle of Least Privilege with secure cookie-based authentication</span>
  </a>
  <a href="/blog/multiple-auth-schemes-rbac-external-providers">
    <strong>Multiple Auth Schemes, RBAC & External Providers</strong>
    <span>Built-in password verification, cookies/JWT/Bearer tokens, role-based access, and Google OAuth</span>
  </a>
  <a href="/blog/postgresql-bi-server-excel-csv-basic-auth">
    <strong>Turn PostgreSQL into a BI Server: CSV Exports, Basic Auth & Excel</strong>
    <span>Serve CSV reports directly to Excel with Basic Auth, SSL, and type composition - a complete BI system for free</span>
  </a>
  <a href="/blog/secure-image-uploads-postgresql-typescript">
    <strong>Secure Image Uploads with PostgreSQL: File System, Large Objects & TypeScript</strong>
    <span>Build a complete upload system with progress callbacks, image validation, and type-safe generated clients</span>
  </a>
  <a href="/blog/csv-excel-ingestion-postgresql-npgsqlrest">
    <strong>CSV and Excel Ingestion Made Easy: PostgreSQL Row Processing</strong>
    <span>Transform file imports into declarative row-by-row processing with automatic TypeScript clients and progress tracking</span>
  </a>
  <a href="/blog/real-time-chat-postgresql-sse-npgsqlrest">
    <strong>Build a Real-Time Chat App with PostgreSQL and Server-Sent Events</strong>
    <span>Secure real-time messaging with 25 lines of SQL - no WebSockets, no message brokers, no LISTEN/NOTIFY scaling issues</span>
  </a>
  <a href="/blog/external-api-calls-postgresql-http-types">
    <strong>Call External APIs from PostgreSQL: HTTP Types in NpgsqlRest</strong>
    <span>Define external API calls using .http file syntax in type comments - no HTTP extensions, no middleware, just SQL</span>
  </a>
  <a href="/blog/web-scraping-postgresql-http-types-xml">
    <strong>Web Scraping with PostgreSQL: HTTP Types + XML Functions</strong>
    <span>Fetch a page with an HTTP Custom Type, parse the HTML with PostgreSQL's built-in XPath functions, and serve JSON - a web scraper with no application code</span>
  </a>
  <a href="/blog/reverse-proxy-postgresql-ai-service-npgsqlrest">
    <strong>Reverse Proxy & AI Service: PostgreSQL Caching with Transform Mode</strong>
    <span>Proxy external services through PostgreSQL functions - cache AI responses, enrich data, and avoid connection pool exhaustion</span>
  </a>
  <a href="/blog/what-have-stored-procedures-ever-done-for-us">
    <strong>What Have PostgreSQL Functions Ever Done for Us?</strong>
    <span>Apart from security, performance, maintainability, testability, and zero boilerplate code, what have they really done for us?</span>
  </a>
</div>

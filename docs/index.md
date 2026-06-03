---
layout: home
title: "NpgsqlRest - Automatic REST API for PostgreSQL"
titleTemplate: false
description: "Your SQL is the API. Annotate PostgreSQL functions and SQL files to declare HTTP routes, auth, caching, and rate limits — get a fast, typed REST API with no controllers and no boilerplate."
head:
  - - meta
    - name: keywords
      content: npgsqlrest, postgresql rest api, postgres api generator, database rest api, automatic api, postgresql web server, typescript code generation, database first development, postgresql mcp server, mcp tools, ai agent api, model context protocol, declarative backend
  - - meta
    - property: og:image
      content: https://npgsqlrest.github.io/terminal.png
  - - meta
    - property: og:title
      content: NpgsqlRest - Automatic PostgreSQL Web Server
  - - meta
    - property: og:description
      content: "Your SQL is the API. PostgreSQL is the architecture, not a detail to abstract away."
  - - meta
    - name: twitter:card
      content: summary
  - - meta
    - name: twitter:image
      content: https://npgsqlrest.github.io/terminal.png

hero:
  name: NpgsqlRest
  text: Your SQL is the API
  tagline: "Annotate PostgreSQL functions and SQL files with comments to declare HTTP routes, auth, caching, retries, and rate limits. Get a fast, typed REST API — no controllers, no models, no boilerplate."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/NpgsqlRest/NpgsqlRest

features:
  - icon: ⚡
    title: Fast & native
    details: AOT executables. 4,500+ req/s on a single host in independent benchmarks.
  - icon: 📝
    title: Declare in SQL
    details: Caching, auth, retries, rate limits — declared as SQL comments next to the query.
  - icon: 🐘
    title: Database-first
    details: PostgreSQL is the architecture — not a detail to abstract away.
  - icon: 🔄
    title: Typed clients
    details: PostgreSQL types generate typed TypeScript clients automatically. No drift.
  - icon: 🔒
    title: Secure by default
    details: Cookies, JWT, OAuth2, conditional caching, per-user limits — built in.
  - icon: 🤖
    title: AI-agent ready
    details: "@mcp exposes any endpoint as an MCP tool for AI agents — same auth, same rate limits (v3.17)."
  - icon: 💚
    title: Open source
    details: MIT-licensed. No paid tier, no telemetry, no vendor lock-in.

---

<script setup>
import { presentationSlides } from './.vitepress/theme/data/presentationSlides'
</script>

<div class="hero-stats">
  <div class="stat">
    <div class="stat-num">#1 of 14</div>
    <div class="stat-label">frameworks benchmarked,<br/>4,500+ req/s<sup><a href="/blog/postgresql-rest-api-benchmark-2026" title="2026 benchmark, high-concurrency scenario">¹</a></sup></div>
  </div>
  <div class="stat">
    <div class="stat-num">0</div>
    <div class="stat-label">lines of C# or Python<br/>in a production app<sup><a href="/blog/case-study-zero-backend-code" title="Production case study">²</a></sup></div>
  </div>
  <div class="stat">
    <div class="stat-num">5×</div>
    <div class="stat-label">faster iteration on<br/>signature changes<sup><a href="/blog/case-study-zero-backend-code#time-saved-quantified" title="Time saved, quantified">³</a></sup></div>
  </div>
  <div class="stat">
    <div class="stat-num">MIT</div>
    <div class="stat-label">licensed,<br/>open source</div>
  </div>
</div>

<div class="value-prop">
  <ul>
    <li><strong>Declare, don't code</strong> — caching, auth, retries, rate limiting — all declared as SQL annotations.</li>
    <li><strong>PostgreSQL at the center</strong> — the opposite of Clean Architecture: the database drives everything.</li>
    <li><strong>Types flow outward</strong> — PostgreSQL types generate TypeScript clients automatically.</li>
    <li><strong>No middle tier</strong> — no controllers, no models, no mapping layers, no boilerplate.</li>
    <li><strong>Iterate 5× faster</strong> — schema is the single source of truth; signature changes propagate to typed clients automatically, and an entire class of type-drift bugs simply cannot happen.</li>
    <li><strong>Production-grade by default</strong> — response caching, rate limiting, retries, PostgreSQL multi-host failover, load balancing, and Excel/HTML response rendering — configured in JSON, not custom middleware.</li>
    <li><strong>You write SQL, not a URL query language</strong> — unlike client-composed query APIs, the API surface is exactly the SQL you wrote: joins, CTEs, window functions — auditable with grep.</li>
    <li><strong>Built for the AI era</strong> — one type system to reason about, machine-verified output (schema check at startup, generated TypeScript checked by <code>tsc</code>), and MCP tools for AI agents arriving in v3.17.</li>
  </ul>
</div>

<h2 id="pitch" tabindex="-1" class="section-heading">
  The Whole Idea, in 19 Slides
  <a class="header-anchor" href="#pitch" aria-label="Permalink to &quot;The Whole Idea, in 19 Slides&quot;">​</a>
</h2>

<p class="section-sub">
  PostgreSQL in. REST API, typed TypeScript client, and AI-agent tools out — with real, reproducible numbers from a product in production.
  Use the arrows, thumbnails, or your keyboard (←/→, <strong>F</strong> for fullscreen, <strong>N</strong> for speaker notes).
</p>

<SlideDeck :slides="presentationSlides" title="The backend that writes itself · 2026" />

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/blog/the-backend-that-writes-itself-presentation" class="annotation-link">Open the full deck with narration →</a>
</div>

<h2 id="thesis" tabindex="-1" class="section-heading">
  A Fully Declarative Backend
  <a class="header-anchor" href="#thesis" aria-label="Permalink to &quot;A Fully Declarative Backend&quot;">​</a>
</h2>

<p class="section-sub">
  SQL declares <em>what data</em>. Annotations declare <em>what behavior</em>. Configuration declares <em>what infrastructure</em>.
  There is no imperative glue anywhere — no controllers, no services, no mappers to keep in sync.
  And it is built on the declarative language that has been running the world's data for 50 years —
  the one every developer, and every LLM, already knows: <strong>SQL</strong>.
</p>

<h2 id="annotations" tabindex="-1" class="section-heading">
  Declarative Annotations
  <a class="header-anchor" href="#annotations" aria-label="Permalink to &quot;Declarative Annotations&quot;">​</a>
</h2>

<p class="section-sub">
  Declare what you want from your endpoint — caching, authorization, timeouts, retries, rate limiting — right where the SQL lives.
</p>

<h3 id="sql-file-example" tabindex="-1" class="section-sub-heading">
  SQL File
</h3>

<div class="annotation-showcase">
  <SqlFileShowcase />
</div>

<div style="text-align: center; margin: 1rem 0;">
  <a href="/guide/sql-files" class="annotation-link">SQL File Endpoints Guide →</a>
</div>

<h3 id="function-example" tabindex="-1" class="section-sub-heading">
  PostgreSQL Function
</h3>

<div class="annotation-showcase">
  <FunctionShowcase />
</div>

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/annotations/" class="annotation-link">View all annotations →</a>
</div>

<h2 id="blog" tabindex="-1" class="section-heading">
  From the Blog
  <a class="header-anchor" href="#blog" aria-label="Permalink to &quot;From the Blog&quot;">​</a>
</h2>

<div class="blog-links blog-hero">
  <a href="/blog/case-study-zero-backend-code" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>Case Study: 74 Endpoints, Zero Backend Code — A Production App Built Entirely on NpgsqlRest</strong>
    <span>What it actually looks like to ship a production application without a controller layer. Real numbers from a finance/visualization app: ~74 HTTP endpoints, 12K LOC of SQL, zero lines of C# or Python, an estimated 3,500–7,300 LOC of host-language boilerplate eliminated, a 5× faster iteration loop on signature changes, and roughly 55–100 hours of typing avoided across the project's evolution.</span>
  </a>
</div>

<div class="blog-links">
  <a href="/blog/the-backend-that-writes-itself-presentation" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>The Backend That Writes Itself — NpgsqlRest in 19 Slides</strong>
    <span>An interactive slide deck with page controls, keyboard navigation, and speaker notes — the whole NpgsqlRest pitch with real, reproducible numbers from a product in production.</span>
  </a>
  <a href="/blog/mcp-server-postgresql-ai-tools-npgsqlrest" class="featured">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <strong>Turn PostgreSQL into MCP Tools an AI Agent Can Call</strong>
    <span>NpgsqlRest 3.17.0 adds Model Context Protocol support. Annotate a function or .sql file with @mcp and it becomes a tool an AI agent can discover and call — one source, two interfaces (REST + MCP), structured output, and per-tool authorization.</span>
  </a>
  <a href="/blog/typescript-codegen-walkthrough" class="featured">
    <strong>From SQL to Type-Safe TypeScript</strong>
    <span>Generate typed fetch modules and TypeScript interfaces directly from PostgreSQL functions and SQL files. End-to-end type safety with @tsclient annotations.</span>
  </a>
  <a href="/blog/npgsqlrest-3.13-production-patterns" class="featured">
    <strong>NpgsqlRest 3.13.0: Cache Profiles, Auth Schemes, Per-User Rate Limits</strong>
    <span>Conditional caching with When rules, short-lived sensitive sessions, per-user rate limiting, and multi-tenant search_path with pgBouncer.</span>
  </a>
  <a href="/blog/postgresql-rest-api-benchmark-2026" class="featured">
    <strong>PostgreSQL REST API Benchmark 2026</strong>
    <span>Performance comparison of NpgsqlRest vs PostgREST, Django, FastAPI, Spring Boot, Go, Rust, and more — 14 frameworks, identical PostgreSQL functions.</span>
  </a>
  <a href="/blog/sql-rest-api" class="featured human-written">
    <img class="badge" src="https://img.shields.io/badge/Human-Written-blue" alt="Human Written">
    <strong>SQL REST API</strong>
    <span>The story behind NpgsqlRest 3.12.0 — SQL file endpoints, the philosophy of database-first development, and why I think Clean Architecture got it wrong.</span>
  </a>
  <a href="/blog/npgsqlrest-vs-postgrest-supabase-comparison" class="featured">
    <strong>NpgsqlRest vs PostgREST vs Supabase</strong>
    <span>Side-by-side comparison of three PostgreSQL REST API platforms: performance benchmarks, features, authentication, file handling, and self-hosting complexity.</span>
  </a>
  <a href="/blog/performance-scalability-high-availability-npgsqlrest" class="featured">
    <strong>Performance, Scalability, and High Availability</strong>
    <span>Production patterns built into the runtime: caching with profiles and When-rules, connection and command retries, partitioned rate limiting, thread-pool tuning, multi-host failover, and read-replica routing.</span>
  </a>
</div>

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/blog/" class="annotation-link">View all posts →</a>
</div>

<hr />

<div class="bottom">
  <a style="background-image: url(./logo.gif?v2);" href="https://github.com/NpgsqlRest/NpgsqlRest" target="_blank"></a>
  <div class="badges">
    <a href="https://github.com/NpgsqlRest/NpgsqlRest/actions/workflows/build-test-publish.yml" target="_blank"><img src="https://github.com/NpgsqlRest/NpgsqlRest/actions/workflows/build-test-publish.yml/badge.svg" alt="Build, Test, Publish and Release"></a>
    <a href="https://github.com/NpgsqlRest/NpgsqlRest/blob/master/LICENSE" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
    <a href="https://github.com/NpgsqlRest/NpgsqlRest/stargazers" target="_blank"><img src="https://img.shields.io/github/stars/NpgsqlRest/NpgsqlRest?style=social" alt="GitHub Stars"></a>
    <a href="https://github.com/NpgsqlRest/NpgsqlRest/fork" target="_blank"><img src="https://img.shields.io/github/forks/NpgsqlRest/NpgsqlRest?style=social" alt="GitHub Forks"></a>
    <a href="https://claude.ai" target="_blank" class="ai-badge" title="Documentation crafted with Claude"><img src="https://img.shields.io/badge/crafted_with-Claude-cc785c?logo=anthropic" alt="Crafted with Claude"></a>
  </div>
</div>

<div style="text-align: center; margin-top: 2rem; padding: 1.5rem 0; border-top: 1px solid var(--vp-c-divider);">
  <div style="font-size: 1rem; font-weight: 800; margin-bottom: 0.5rem;">
    ❤️ Support this project:
    <a href="https://patreon.com/vbconsulting" target="_blank" style="display: inline-flex; align-items: center; gap: 4px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 7.463 3.097 9.746 2.602 2.124 6.19 2.078 9.402 1.836 1.883-.142 3.939-.358 5.477-1.528 1.564-1.19 1.873-3.298 1.972-5.151.134-2.51.187-5.016-.037-7.233zm-2.55 7.703c-.078 1.593-.383 3.473-1.795 4.334-1.351.824-3.151.973-4.686 1.083-2.891.207-6.063.276-8.514-1.399C3.106 17.39 2.924 14.34 2.95 11.67c.03-3.206.678-6.721 3.654-8.375 2.756-1.531 6.556-1.727 9.544-.872 2.339.669 4.351 2.678 4.355 5.217.007 2.583-.016 5.168-.095 7.273z"/><path d="M16.088 5.19c-1.008-.542-2.607-.48-3.441.388-.568.591-.773 1.389-.8 2.172-.034.993.068 2.013.361 2.953.307.985 1.034 1.848 2.077 2.012.878.138 1.83-.088 2.458-.732.7-.718.88-1.81.877-2.779-.003-.989-.084-1.99-.423-2.91-.268-.726-.654-1.328-1.109-1.104zm-.294 5.482c-.182.462-.581.771-1.091.696-.532-.078-.859-.533-1.04-1.005-.248-.647-.327-1.375-.312-2.06.01-.46.095-.939.371-1.313.345-.467.993-.447 1.426-.115.41.315.607.835.74 1.32.18.66.211 1.675-.094 2.477zM8.4 10.394c.233 1.084.755 2.299 1.907 2.579.934.227 1.993-.165 2.434-1.048.455-.91.346-1.995.166-2.972-.165-.893-.46-1.885-1.207-2.445-.745-.559-1.832-.457-2.479.192-.84.843-.958 2.138-.955 3.277.001.147.119.364.134.417zm1.363-2.808c.302-.321.805-.336 1.14-.054.445.375.618 1.015.75 1.558.131.54.212 1.156.082 1.703-.1.423-.378.821-.84.882-.469.062-.886-.306-1.088-.704-.326-.644-.401-1.426-.381-2.148.013-.465.104-.993.337-1.237z"/></svg>
      Patreon
    </a> ·
    <a href="https://buymeacoffee.com/vbilopavu" target="_blank" style="display: inline-flex; align-items: center; gap: 4px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/></svg>
      Buy Me a Coffee
    </a>
  </div>
  <div style="font-size: 0.875rem; color: var(--vp-c-text-2); margin-top: 0.5rem;">Released under the MIT License.</div>
  <div style="font-size: 0.875rem; color: var(--vp-c-text-2); margin-top: 0.25rem;">Copyright © 2024-2026 VB Consulting</div>
</div>

---
layout: home
title: "NpgsqlRest - Automatic REST API for PostgreSQL"
titleTemplate: false
description: "SQL is declarative — your API should be too. Declare caching, auth, retries, rate limiting as SQL annotations. Put PostgreSQL at the dead center of your architecture."
head:
  - - meta
    - name: keywords
      content: npgsqlrest, postgresql rest api, postgres api generator, database rest api, automatic api, postgresql web server, crud api generator, typescript code generation, database first development
  - - meta
    - property: og:image
      content: https://npgsqlrest.github.io/logo.png
  - - meta
    - property: og:title
      content: NpgsqlRest - Automatic PostgreSQL Web Server
  - - meta
    - property: og:description
      content: "SQL is declarative — your API should be too. Put PostgreSQL at the dead center of your architecture."
  - - meta
    - name: twitter:card
      content: summary
  - - meta
    - name: twitter:image
      content: https://npgsqlrest.github.io/logo.png

hero:
  name: NpgsqlRest
  text: Automatic PostgreSQL Web Server
  tagline: "SQL is declarative — your API should be too. Write SQL, annotate it with comments to declare caching, auth, retries, rate limiting, and everything in between. PostgreSQL is the architecture."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/NpgsqlRest/NpgsqlRest

features:
  - icon: ⚡
    title: Top Performance, Native Executables, Low Latency

  - icon: 📝
    title: Declarative Annotations for Backend Features

  - icon: 🐘
    title: PostgreSQL Is the Architecture, Not a Detail

  - icon: 🔄
    title: Code Generation and End-to-End Type Safety

  - icon: 💚
    title: Free and Open Source, MIT License

---

<div style="display: flex; flex-direction: column; align-items: center; margin: 2rem 0;">
  <img src="/clean.png" alt="NpgsqlRest Architecture - PostgreSQL at the center with automatic REST API, TypeScript generation, authentication, caching, and more" style="max-width: min(400px, 100%);" />
  <p style="font-style: italic; color: var(--vp-c-text-2); margin-top: 0.75rem; font-size: 0.9rem; text-align: center;">
    PostgreSQL is the architecture — not a detail to abstract away
  </p>
</div>

<div style="max-width: 640px; margin: 1.5rem auto; padding: 0 1rem;">
  <ul style="color: var(--vp-c-text-2); padding-left: 1.5rem; margin: 0; list-style: none;">
    <li>✓ <strong>Declare, don't code</strong> — Caching, auth, retries, rate limiting — all declared as SQL annotations</li>
    <li>✓ <strong>PostgreSQL at the center</strong> — The opposite of Clean Architecture: the database drives everything</li>
    <li>✓ <strong>Types flow outward</strong> — PostgreSQL types generate TypeScript clients automatically</li>
    <li>✓ <strong>No middle tier</strong> — No controllers, no models, no mapping layers, no boilerplate</li>
  </ul>
</div>

<h2 id="annotations" tabindex="-1" style="text-align: center; margin-top: 2rem;">
  Declarative Annotations
  <a class="header-anchor" href="#annotations" aria-label="Permalink to &quot;Declarative Annotations&quot;">​</a>
</h2>

<p style="text-align: center; color: var(--vp-c-text-2); margin-bottom: 1.5rem;">
  Declare what you want from your endpoint — caching, authorization, timeouts, retries, rate limiting — right where the SQL lives.
</p>

<h3 id="sql-file-example" tabindex="-1" style="text-align: center; margin-top: 1rem; margin-bottom: 0.5rem;">
  SQL File
</h3>

<div class="annotation-showcase">

```sql
/*
HTTP GET /users/
@authorize admin, user
@cached
@cache_expires_in 30sec
@timeout 5min
@table_format = excel
@excel_file_name = users.xlsx
*/
select id, name, email, role
from users
where $1 is null or department_id = $1;
```

</div>

<div style="text-align: center; margin: 1rem 0;">
  <a href="/guide/sql-files" style="color: var(--vp-c-brand-1); font-weight: 500;">SQL File Endpoints Guide →</a>
</div>

<h3 id="function-example" tabindex="-1" style="text-align: center; margin-top: 1.5rem; margin-bottom: 0.5rem;">
  PostgreSQL Function
</h3>

<div class="annotation-showcase">

```sql
create or replace function api.get_users(
  _department_id int
)
returns table (id int, name text, email text, role text)
language sql
begin atomic;
select id, name, email, role
from users
where
  _department_id is null
  or department_id = _department_id;
end;

comment on function api.get_users(int) is '
HTTP GET /users/
@authorize admin, user
@cached
@cache_expires_in 30sec
@timeout 10sec
@retry_strategy aggressive
@rate_limiter_policy authenticated_limit
@tsclient_module = users
';
```

</div>

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/annotations/" style="color: var(--vp-c-brand-1); font-weight: 500;">View all annotations →</a>
</div>

<h2 id="blog" tabindex="-1" style="text-align: center; margin-top: 2rem;">
  Blog
  <a class="header-anchor" href="#blog" aria-label="Permalink to &quot;Blog&quot;">​</a>
</h2>

<div class="blog-links" style="display: flex; justify-content: center; margin-bottom: 2rem;">
  <a href="/blog/sql-rest-api" class="featured" style="border: 3px outset var(--vp-c-brand-1); width: 75%;">
    <img class="badge" src="https://img.shields.io/badge/New-brightgreen" alt="New">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <img class="badge" src="https://img.shields.io/badge/Human-Written-blue" alt="Human Written">
    <strong style="font-size: 1.15em;">SQL REST API</strong>
    <span>The story behind NpgsqlRest 3.12.0 — SQL file endpoints, the philosophy of database-first development, AI tools, and why I think Clean Architecture got it wrong</span>
  </a>
</div>

<div class="blog-links">
  <a href="/blog/sql-file-source-rest-api-from-plain-sql" class="featured">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>REST APIs from Plain SQL Files: The Complete Guide to SQL File Source</strong>
    <span>Build REST APIs directly from .sql files - no functions, no procedures, no boilerplate. Multi-command endpoints, automatic parameter inference, and TypeScript generation</span>
  </a>
  <a href="/blog/excel-export-table-format-postgresql-npgsqlrest" class="featured">
    <strong>Excel Exports Done Right: Zero-Allocation Streaming from PostgreSQL</strong>
    <span>Stream .xlsx exports directly from PostgreSQL with constant memory - zero allocations, native types, one SQL annotation</span>
  </a>
  <a href="/blog/postgresql-rest-api-benchmark-2026" class="featured">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>PostgreSQL REST API Benchmark 2026</strong>
    <span>Performance comparison of NpgsqlRest vs PostgREST, Django, FastAPI, Spring Boot, and more</span>
  </a>
  <a href="/blog/npgsqlrest-vs-postgrest-supabase-comparison" class="featured">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>NpgsqlRest vs PostgREST vs Supabase: Complete Feature Comparison</strong>
    <span>Side-by-side comparison with performance benchmarks, features, authentication, file handling, and deployment options</span>
  </a>
  <a href="/blog/performance-scalability-high-availability-npgsqlrest" class="featured">
    <img class="badge" src="https://img.shields.io/badge/Featured-gold" alt="Featured">
    <strong>Performance, Scalability, and High Availability</strong>
    <span>Caching strategies, retry logic, rate limiting, and multi-host PostgreSQL connections for production APIs</span>
  </a>
  <a href="/blog/custom-types-multiset-rest-api" class="human-written">
    <img class="badge" src="https://img.shields.io/badge/Human-Written-blue" alt="Human Written">
    <strong>Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs</strong>
    <span>Use PostgreSQL custom types and table types to build hierarchical REST API responses with automatic TypeScript generation</span>
  </a>
</div>

<div style="text-align: center; margin: 1.5rem 0;">
  <a href="/blog/" style="color: var(--vp-c-brand-1); font-weight: 500;">View all posts →</a>
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

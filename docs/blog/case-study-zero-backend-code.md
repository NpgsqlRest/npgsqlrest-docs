---
layout: doc
outline: [2, 3]
title: "Case Study: 74 Endpoints, Zero Backend Code — A Production App Built Entirely on NpgsqlRest"
titleTemplate: NpgsqlRest
description: "What it actually looks like to ship a production application without a controller layer. Real numbers from a finance/visualization app: ~74 HTTP endpoints, 12K LOC of SQL, zero lines of C# or Python, and an estimated 3,500–7,300 LOC of host-language boilerplate eliminated versus an equivalent ASP.NET Core build."
head:
  - - meta
    - name: keywords
      content: npgsqlrest case study, postgresql first development, no backend code, sql first architecture, asp.net core comparison, fastapi comparison, production npgsqlrest, webauthn sql, lines of code saved
  - - meta
    - property: og:title
      content: "Case Study: A Production App with Zero Backend Code"
  - - meta
    - property: og:description
      content: "74 endpoints, 12K LOC of SQL, zero C# or Python. Real numbers from the first production-grade NpgsqlRest deployment we know of."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Case Study: 74 Endpoints, Zero Backend Code"
  - - meta
    - name: twitter:description
      content: "What it actually looks like to ship a production application without a controller layer. Real numbers, honest tradeoffs."
---

# Case Study: 74 Endpoints, Zero Backend Code

<p class="blog-meta">
  <span>May 2026</span> ·
  <span class="tag">Case Study</span>
  <span class="tag">Architecture</span>
  <span class="tag">NpgsqlRest</span>
</p>

---

Most of the blog posts on this site argue *why* you might want to build an application with NpgsqlRest. This one is different: it reports what happened when a team actually did, end-to-end, on a real product. The application is anonymized — it's a finance/visualization platform with time-series charts, expression-based metric computation, and per-user dashboards — but the numbers are unmodified, taken directly from the repository on the day this post was written.

It is, as far as we know, the first production-grade application built entirely on NpgsqlRest. No C#. No Python. No Node backend. The HTTP layer is the binary. Everything else lives in PostgreSQL.

## What's in the repository

| Layer | Files | Lines of code |
|---|---|---|
| Public API SQL (auto-exposed as HTTP) | 80 | 4,889 |
| System / migrations / helpers SQL | 53 | ~2,000 |
| pgTAP-style SQL tests | 110 | 4,756 |
| Auto-generated TypeScript API client | 24 | 5,679 |
| Hand-written frontend TypeScript | ~36 | ~1,700 |
| Svelte components | 43 | 14,419 |
| **Hand-written backend host code (C#/Python/Node)** | **0** | **0** |
| Backend host config (`appsettings.json`) | 1 | 217 |

Approximately **74 HTTP endpoints** are exposed. There are no controllers, no DTO classes, no repository layer, no hand-written API client. The single `appsettings.json` replaces what would otherwise be a `Program.cs` plus DI registration plus route mapping plus auth pipeline configuration.

The application has shipped to production at build number **2.9.1517** — fifteen hundred production builds with no backend host code at any point in the project's history.

## What NpgsqlRest is doing for them

Reading the repository, the workload NpgsqlRest absorbs is broader than most users probably realize from the docs:

- **All ~74 endpoints** are auto-exposed from annotated PostgreSQL functions. HTTP verb, route, authorization, response shape, and per-module grouping are declared in SQL comments via `HTTP POST` / `HTTP GET`, `authorize`, `tsclient_module = ...`. There is no route table.
- **The entire TypeScript client (~5,679 lines across 12 modules)** is regenerated from the live database catalog on every dev-mode startup. The frontend imports the generated per-module API files (e.g. `from "./<feature>Api.ts"`) — files no human ever touches.
- **The full WebAuthn / passkey ceremony** is implemented as nine named SQL commands wired up in `appsettings.json`. Challenge generation, attestation, authentication, sign-count validation — all in PL/pgSQL. The host process knows the protocol; the application logic lives in functions.
- **Data-protection key storage** (the keys ASP.NET uses to encrypt cookies and other transient state) is two SQL commands, not a custom `IXmlRepository` implementation in C#.
- **Server-Sent Events streaming** for the long-running compute endpoint. The SQL function emits `RAISE INFO` notices as it processes; NpgsqlRest forwards them as SSE events so the frontend can update progress UI without polling. The generator emits the `EventSource` factory in TypeScript automatically. Both ends of the streaming protocol are configured through annotations — there is no custom streaming middleware.
- **Admin and observability endpoints** — `/stats/routines`, `/stats/tables`, `/stats/indexes`, `/stats/activity` — are built in. The team gets per-routine performance stats, table stats, and active-query visibility without writing any of it.
- **Static file serving with claims templating** into `index.html` injects user identity into the SPA shell. No separate Node server in front of the app.

Equally telling is what's *available without writing host code* and either already configured or queued for near-term addition. Two features being added next to the compute path illustrate how additions to this stack actually work:

- **Rate limiting on the compute endpoint** — roughly five lines of `appsettings.json` to define a `Concurrency` policy plus one `@rate_limiter_policy` annotation on the function. Four policy types are available (FixedWindow, SlidingWindow, TokenBucket, Concurrency); choosing one is a config decision, not an implementation.
- **Response caching for the read-heavy endpoints** — a [cache profile](/config/cache-options) in `appsettings.json` (Memory / Redis / Hybrid backend, default expiration, key parameter list, conditional `When` rules) plus one `@cache_profile` annotation per cached endpoint. Automatic invalidation endpoints are emitted as a side effect.

The same applies to several other features the team has not yet needed but could enable with one config block and one annotation each: parameter validation rules ([`@validate`](/annotations/validate)), security headers (CSP / X-Frame-Options / Permissions-Policy via [SecurityHeaders config](/config/security-headers)), Kubernetes health probes ([HealthChecks config](/config/health-checks)), automatic OpenAPI/Swagger generation ([OpenApiOptions](/config/openapi)), transparent column encryption ([`@encrypt` / `@decrypt`](/annotations/encrypt-decrypt)) using ASP.NET Data Protection, parameter hashing for passwords ([`@parameter_hash`](/annotations/parameter-hash)), security-sensitive log obfuscation ([`@security_sensitive`](/annotations/security-sensitive)), antiforgery, response compression, command retry, CORS, external OAuth (Google / GitHub / Microsoft / LinkedIn / Facebook), and Excel/HTML table-format response rendering.

To be precise about what "configuration" means here: ASP.NET Core and FastAPI applications also configure these features — they configure them in *startup code* (`Program.cs`, DI registration, middleware pipeline ordering). NpgsqlRest configures them in layered JSON. The binary ships with a documented [defaults baseline](/config/latest) of roughly **2,900 lines** covering every available knob; this project overrides it with `appsettings.json` (**217 lines**, production) and `appsettings.development.json` (**88 lines**, dev override that layers cleanly on top of prod — diagnostic logs turned up, codegen and HTTP-file generation enabled, WebAuthn relying-party pointed at localhost). **Combined application-specific configuration: 305 lines of JSON. Combined application-specific startup code: zero lines.**

The savings aren't that the features arrive magically. They're that they arrive pre-wired with sensible defaults, the override surface is uniform JSON rather than framework-specific DI ceremony, and prod-vs-dev layering is first-class. Every cross-cutting concern in the table below — caching, rate limiting, validation, security headers, health probes, OpenAPI — is enabled or tuned by adding keys to those 305 lines, not by modifying a startup pipeline.

The blast radius of "stop using NpgsqlRest" is therefore much wider than just losing the routing layer. It would mean replacing roughly a dozen distinct, individually load-bearing features and re-expressing 305 lines of declarative JSON as several hundred lines of imperative startup code.

## The comparison: equivalent build in ASP.NET Core

The realistic alternative for a .NET-shop building this application would be ASP.NET Core with Minimal APIs or controllers, plus Dapper or Npgsql for data access (an ORM doesn't fit the workload — most of the endpoints return composite records or aggregated time-series data, which fights ORMs). A typical per-endpoint cost in that stack:

- Request DTO: 5–15 LOC
- Response DTO: 5–15 LOC
- Controller / Minimal API handler with validation, model binding, error mapping: 10–25 LOC
- Repository or data-access method: 10–30 LOC
- Service-layer method (often present even when not strictly necessary): 5–15 LOC
- DI registration: 1–2 LOC

Conservatively: **40–80 lines of C# per endpoint**, spread across 3–5 files. For 74 endpoints, that is **~3,000–6,000 LOC** before any application-specific concern is addressed.

On top of the per-endpoint cost, the cross-cutting concerns NpgsqlRest already absorbs (or will absorb the moment a config block is added). Most of these features exist in classic ASP.NET Core too — built into the framework, exposed as attributes, or provided as official NuGet packages — so the honest LOC estimate assumes a disciplined .NET team using those built-ins, not reinventing them from scratch:

| Concern | NpgsqlRest | Hand-rolled ASP.NET Core (honest LOC est.) |
|---|---|---|
| `Program.cs` / DI / routing | config | 50–150 (Minimal APIs are dense) |
| Cookie auth | config | 10–30 (`AddAuthentication().AddCookie()`) |
| **WebAuthn / passkey ceremonies** | 9 named SQL commands | **300–600** (Fido2.NET-Core plumbing, not built-in) |
| Data-protection keys → PostgreSQL | 2 SQL commands | 0–50 (filesystem default works for many cases) |
| TypeScript client generation + drift management | regenerated, free | 0–ongoing (NSwag CLI if you want it; otherwise hand-write the frontend client) |
| Stats / activity / index admin endpoints | built-in | 0 (optional; most apps don't have them) |
| SSE streaming endpoint(s) | `@sse` annotation | 50–100 (`Results.Stream`, you own the protocol) |
| Parameter validation pipeline | `@validate` annotation + rules in config | 20–50 (`[Required]`, `[Range]`, `[StringLength]` attributes are free) |
| Rate limiting (compute endpoint) | config + `@rate_limiter_policy` annotation | 20–50 (.NET 7+ built-in `AddRateLimiter()`) |
| Response caching (multi-backend, profiles, invalidation) | config + `@cache_profile` annotation | 30–100 (`ResponseCacheAttribute` + `IDistributedCache`; Redis adds more if needed) |
| Health checks (Kubernetes probes) | config | 10–30 (`AddHealthChecks()` built-in) |
| Security headers middleware (CSP, X-Frame, etc.) | config | 10–30 (NuGet package + a few lines) |
| OpenAPI / Swagger documentation | config | 5–20 (Swashbuckle is nearly free) |
| Retry, forwarded headers, antiforgery, compression, CORS | config | 30–80 (mostly built-in middleware) |
| **Cross-cutting subtotal** | — | **~550–1,300** |

Adding the per-endpoint plumbing (~3,000–6,000 LOC for 74 composite/aggregated endpoints) to the honest cross-cutting subtotal gives a **realistic ASP.NET Core equivalent total of ~3,500–7,300 lines of C#** — plus a `.csproj`, a layered project structure, and a CI step to keep the generated TypeScript client in sync with the deployed API. None of this exists in the case-study repository.

A FastAPI / Python equivalent comes out leaner still — Pydantic is denser than C# DTOs, and FastAPI ships validation, OpenAPI, and dependency injection in the framework itself. WebAuthn plumbing (`py_webauthn`), rate limiting (slowapi), response caching (fastapi-cache + Redis), and SSE streaming still cost real lines, but the per-endpoint cost compresses substantially. Honest estimate: **~2,500–5,000 LOC of Python**.

The earlier framing of this case study quoted higher figures (7,000–13,000 for .NET, 5,000–9,000 for Python). Those overcounted the cross-cutting layer because they assumed hand-rolled implementations of features that classic .NET / FastAPI actually ship with — built-in rate limiting, attribute-based validation, framework-managed health checks, Swashbuckle, and so on. The revised numbers above credit those frameworks honestly. The savings are still significant — 3,500–7,300 LOC is a meaningful slice of a full-stack codebase — but the LOC headline is smaller than it first appeared, and the real edge has to be argued qualitatively, not by raw line count alone.

## How it scores on the four dimensions that matter

### Productivity

The headline number isn't lines of code — it's that **impedance mismatch is gone entirely**. Both kinds.

The classic *object–relational* impedance mismatch — objects on one side, rows on the other, an ORM negotiating between them — doesn't exist here because there's no object layer. PostgreSQL composite types and JSON are the data model, end to end. The frontend receives the same shapes the database returns.

The less-discussed *function* impedance mismatch — the chain of translation layers between an HTTP request and the SQL that ultimately runs (controller → service → repository → ORM → SQL) — doesn't exist either. The SQL function *is* the endpoint. The generated TypeScript wrapper calls it directly. There are no intermediate functions whose signatures can drift from the layer below them, because there are no intermediate functions.

What this means in practice is that adding a column in a typical ASP.NET Core + EF Core path is: write a migration, update the entity, update the DTO, update the mapping, update the endpoint, regenerate the TypeScript client, fix any drift the regeneration surfaces. In this project, it is: edit the SQL function, restart the dev server. The TypeScript client rewrites itself; the type checker fails the build on every line of frontend code that no longer matches.

Adding a new endpoint is: write one annotated SQL function. Restart. Done. There is no parallel set of files in the host language to keep in sync, because there is no host language.

The empirical signal that this works at scale is build number 2.9.1517. A development loop that is genuinely faster is the only thing that gets a small team to that build count.

One productivity dimension worth naming explicitly in the LLM-assisted era: this architecture is dramatically more **token-efficient**. Adding a feature in a conventional N-layer stack requires loading the DTO, controller, service, repository, ORM mapping, frontend type definition, and frontend API client into the model's context — eight to ten files with strict cross-file consistency requirements — and asking the model to produce the change requires it to write the new code in lockstep across all of them. In this architecture, the same change is one SQL function plus one frontend component. Two files, no inter-layer consistency burden (the generator handles it), and far less boilerplate for the model to reproduce. An "add an endpoint" task that runs roughly 5,000 tokens in a typical ASP.NET Core or FastAPI codebase runs closer to 1,000–1,500 here — a 3–5× reduction that compounds across a year of AI-assisted feature work, in both inference cost and developer wait time. The same simplification that [The Power of Simplicity](/blog/the-power-of-simplicity) post frames at the architectural level as raw energy savings shows up at the per-task level as token savings.

#### Time saved, quantified

The arguments above are structural. The same effect can be measured in hours and iteration-cycle time on the same repository — and the picture that emerges is stronger than the LOC table alone suggests.

**One-time scaffolding avoided.** In a hand-written stack, each endpoint costs roughly 20–35 minutes of pure typing: request interface (3–5 min), response interface (5–10 min), fetch wrapper with URL builder and serialiser (10–15 min), and an `.http` line for testing (3–5 min). Across the 74 endpoints exposed by this application, that is **25–45 hours** of mechanical work the team never spent. The raw artifact size corroborates the estimate — the 5,679-line autogenerated TypeScript client plus an autogenerated `.http` test file is roughly the volume an experienced developer produces in that many hours on boilerplate (~125 LOC/hour).

The phrase "one-time" understates the saving in one important direction. The line counts in the table are the *current* snapshot of an API surface that has been reshaped many times as requirements — and the team's understanding of them — evolved. In a hand-written stack, every rename, every restructured return type, every endpoint that was later split, merged, or dropped would have required rewriting the corresponding client and interface code at the time of the change. NpgsqlRest regenerates the entire client on the next `db-up`, in full, regardless of how many iterations happened. The integral of typing avoided over the project's history is therefore meaningfully larger than the snapshot — earlier versions of these clients, including the ones that no longer exist, would all have been hand-written and rewritten in a conventional stack.

**Ongoing maintenance avoided.** Every backend signature change in a conventional stack means edits to the SQL, the request interface, the response interface, the fetch wrapper, and any callers — five files minimum, plus the inevitable type-drift bug when one of them is missed. Each such change costs roughly 5–15 minutes of cross-file editing, and the misses cost 30+ minutes of runtime debugging when an interface quietly lies about the shape the API actually returns. The NpgsqlRest cycle is *edit SQL → restart → done*; the regenerated client either matches or fails the type checker on every consumer at once. Across the lifetime of this codebase — through several significant refactors and feature additions spanning the auth surface, the visualization pipeline, and the user-management subsystem — there have been hundreds of signature-level changes. Even at a conservative 10 minutes saved per change × 200 changes, that is **another ~30 hours** of mechanical edits avoided, with the type-drift bug tail entirely absent.

**Iteration-speed multiplier.** This is the qualitative win, and it is the largest of the three:

- **Signature changes are roughly 5–10× faster end-to-end.** No grep-for-callers pass, no parallel interface updates, no compile-and-fix loop. The TypeScript client rewrites itself on dev restart, and the type checker fails on every line of frontend code that no longer matches.
- **New-feature wire-up is roughly 2–3× faster.** The backend → frontend wire is free, so every cycle goes into UI / UX work rather than plumbing.
- **Refactoring courage is qualitatively different.** Renaming a column or restructuring a return type is free across the host-language boundary, so refactors that would feel heavy in a conventional stack — full subsystem rewrites, schema reshuffles — get done instead of deferred. The 5.6× performance rewrite cited under [Performance](#performance) is one example; it was a full implementation-language change inside the function, and the only reason it shipped without weeks of cross-stack updates is that there were no cross-stack updates to make.
- **An entire class of bugs simply does not exist.** "The interface said `string | null` but the API returns `''`" or "the enum changed in the database but the frontend constant didn't" — these are the bugs that pad every release cycle in a hand-written stack and chew up debugging hours. With the schema as the single source of truth, they cannot happen by construction.

**The bottom line.** Conservatively, **55–100 hours of typing saved across the lifetime of this project** — and that "conservatively" matters: the figure is anchored to the *current* 74 endpoints, not to the larger set of endpoints that existed and were rewritten along the way as the product's requirements evolved. On top of that, an iteration loop that is roughly **5× faster on signature changes** and **2–3× faster on end-to-end feature additions**. None of those numbers were measured with a stopwatch — they are honest estimates from per-task timing and the actual change history — but they line up with the LOC totals and with the build cadence (1,500+ production builds, small team) the project has actually sustained. Combined with the token-efficiency multiplier described above, this is the kind of compounding gain that determines whether a small team can ship a feature surface this wide at all.

### Lines of code saved

Net of the SQL the team would have written anyway (the business logic has to live somewhere), our honest estimate is **~3,500–7,300 lines of host-language code eliminated** — roughly 3,000–6,000 of per-endpoint plumbing (DTOs, controllers, repositories, services, DI registrations across 220–370 files) plus another 550–1,300 of cross-cutting code that is configuration here and a mix of built-in middleware, attributes, and small custom wiring elsewhere. On top of that, the 5,679-line generated TypeScript client is a purely free byproduct.

The dominant slice of the saving — and the most defensible one — is the **per-endpoint plumbing layer**, not the cross-cutting infrastructure. Classic ASP.NET Core and FastAPI both ship with strong cross-cutting stories (built-in rate limiting, attribute-driven validation, framework-managed health checks, Swashbuckle, response caching). The compression NpgsqlRest provides on those concerns is real but modest. Where it dominates is on the architectural layer that classic stacks *cannot* compress: every endpoint still needs a request DTO, a response DTO, a controller, a repository, and a service in a hand-written stack, and those add up to thousands of lines that the SQL-as-endpoint model simply doesn't have.

A caveat worth being honest about: SQL functions tend to be denser than C# or Python, so a one-to-one LOC swap understates the effective savings. The eliminated code is overwhelmingly the low-value boilerplate — DTOs, mappers, route attributes, repository methods that are one query each — not the parts of an application where careful design pays off.

**Where the real edge actually is — qualitatively.** The LOC argument above tells part of the story. The structural wins, which are harder to put a number on but compound across the project's lifetime, are:

1. **No DTO layer at all.** The largest concrete saving (~3,000–6,000 LOC). Attributes don't help here; you still need the DTOs in classic .NET.
2. **Per-endpoint annotations sit next to the SQL.** `@cache_profile`, `@rate_limiter_policy`, `@authorize` on the function itself — same mechanism as `[ResponseCache]`, far better locality than a controller four files away from the query.
3. **WebAuthn shipped as SQL functions.** ~300–600 LOC of C# that genuinely doesn't exist in this project, because Fido2.NET-Core wiring is not built-in to the framework.
4. **Single source of truth.** The schema *is* the contract. No DTO can lie about the database shape, no interface can drift from the response. This is a bug class that does not exist by construction — and the time-cost of those bugs is invisible in any LOC count.
5. **TypeScript client + types regenerated from the live schema.** A free byproduct; in classic .NET you either run NSwag/Kiota (works, but a separate toolchain to maintain) or hand-write the client on the frontend.
6. **Layered prod-vs-dev JSON is first-class.** Classic .NET has `appsettings.{Environment}.json` too, but in practice some of the environment-specific behaviour ends up in `if (env.IsDevelopment())` branches in `Program.cs`. NpgsqlRest's overlay model puts every override in one place.

### Performance

Strong, structurally. One database round-trip per request. No ORM materialization, no entity-graph allocation in the API process, no DTO mapping pass. Stored functions are precompiled in PostgreSQL. The transport layer is Kestrel + Npgsql, which is already at the top tier of TechEmpower-style benchmarks for the underlying primitives.

The performance-tuning work concentrates where it actually pays off: in the database. A recent optimization in this project rewrote one of the heaviest functions from PL/pgSQL with temp tables to plain SQL with CTEs and produced a measured **5.6× speedup** (1.96 ms → 0.35 ms over 500 calls × 20 mixed inputs). That improvement is visible directly in `pg_stat_statements`. In a conventional stack, the same query is hidden behind ORM-generated SQL and the per-request cost is split across object materialization, JSON serialization, and HTTP middleware — all of which obscure where the actual time goes.

That kind of rewrite — a full implementation swap, a different language paradigm inside the function, and two unrelated correctness fixes folded in along the way — is exactly the change that goes badly wrong without a safety net. It didn't here, because the safety net already existed: the 110 SQL test files and 4,756 lines of assertions covered later in this post. The optimization shipped in the same commit as new test coverage for the edge cases the rewrite exposed. The tests run against the real PostgreSQL engine, against the real function being optimized, and finish in seconds. There is no faster correctness gate than that, and without it a 5.6× refactor is the sort of thing teams quietly decide isn't worth the risk. Performance work and test coverage are not two separate concerns in this architecture; they're the same loop.

### Overall quality

End-to-end type safety is genuinely better than most hand-rolled stacks. PostgreSQL types map directly to TypeScript types via the generator. There is no DTO layer in the middle that can disagree with either the database or the frontend. Schema drift is impossible by construction: if a column is renamed, the generated client changes shape on the next dev restart, and every consumer fails to compile.

The schema is the single source of truth. There is no ORM mapping that can lie about it.

The test suite — 110 SQL test files totaling 4,756 lines — runs against the real PostgreSQL engine, not a mock or in-memory fake. Every assertion exercises the same code path that production uses. This is harder to do well than a conventional unit-test suite, but the tests that exist are categorically more truthful.

## Honest tradeoffs

A case study that doesn't acknowledge tradeoffs is a sales pitch. After working through the obvious objections honestly, two remain:

- **Younger ecosystem.** NpgsqlRest is newer and has a smaller community than ASP.NET Core or FastAPI. Fewer Stack Overflow answers, fewer third-party plugins, fewer "battle-tested by a thousand companies" reassurance signals. Mitigated by the fact that PostgreSQL itself — which does most of the heavy lifting in this architecture — is anything but new.
- **SQL fluency is a precondition, not a nice-to-have.** Anyone working on the backend has to be comfortable in PL/pgSQL: not just `SELECT`s, but window functions, CTEs, procedural control flow, and reading `EXPLAIN` output. AI tooling has closed most of the on-ramp — modern coding assistants write competent PL/pgSQL on demand — but the architecture genuinely rewards teams that invest in SQL skill rather than treating it as a thing the ORM hides.

That's the honest list. A few other objections look like tradeoffs at first but don't survive scrutiny:

- *"Refactoring SQL across a schema lacks IDE support."* In practice, the auto-generated TypeScript client gives every backend function a real, IDE-indexed symbol on the frontend (`some_function_name` → `someFunctionName`). "Find all references" on the generated function locates every cross-stack caller. Modern PostgreSQL IDEs (DataGrip, JetBrains DB tools) also index PL/pgSQL, and the database itself fails function creation if a referenced object is missing. The cross-stack refactoring story is, if anything, *better* than in conventional architectures.
- *"Logic-heavy SQL is harder to test."* The opposite turned out to be true on this project. `set constraints all deferred` plus a transaction-scoped rollback gives clean isolation with no fixture framework. Putting `drop function`, `create function`, and the test in a single `.sql` file lets you re-run the entire cycle on save — a feedback loop measurably faster than rebuilding a .NET or Python project. Different idiom from xUnit / pytest, but not harder.
- *"Lock-in to NpgsqlRest."* The exit path is to write the controller layer and cross-cutting concerns you skipped — i.e., to do the ~3,500–7,300 LOC of host-language work this case study just argued against. That isn't lock-in in any meaningful sense; it's a choice that's reversible at exactly the price the alternative architecture charges upfront. The SQL stays portable.
- *"Calling external APIs requires a host language."* It doesn't. NpgsqlRest's [HTTP Types](/blog/external-api-calls-postgresql-http-types) let you declare external REST calls in a PostgreSQL type comment using `.http` file syntax — function parameters substitute into URLs, headers, and request bodies, and the response is handed to your function as a parameter. The HTTP call is made from the NpgsqlRest tier, not from inside the database, so there's no `pgsql-http` extension to install and no database connection sitting blocked on a remote service. For full gateway scenarios, the [reverse proxy](/config/proxy) `@proxy` annotation supports both passthrough and transform modes (response routed through a PG function for caching, enrichment, or transformation). External integration is one of the architecture's stronger stories, not a weak point.

## What this case study is, and isn't

It isn't a benchmark. It isn't a controlled study. It's a single production application, observed honestly, with the numbers reported as they are.

What it does establish is that the architecture works — not as a demo, not as a "how-to," but as the substrate of a real product that has shipped 1,500+ builds. The combination most people assume can't be done without host code (WebAuthn, data-protection keys, real-time SSE streaming, an admin/observability surface, a generated frontend client, structured tests, and — when the team gets to them — rate limiting and response caching) is all here, in SQL and configuration, in production.

If you've been wondering whether a database-first architecture scales past CRUD demos, this is the existence proof.

<BlogNav
  :get-started="[
    { text: 'TypeScript Code Generation Walkthrough', href: '/blog/typescript-codegen-walkthrough' },
    { text: 'Implementing WebAuthn Passkeys with Pure SQL', href: '/blog/passkey-sql-auth' },
    { text: 'The Power of Simplicity', href: '/blog/the-power-of-simplicity' },
    { text: 'PostgreSQL REST API Benchmark 2026', href: '/blog/postgresql-rest-api-benchmark-2026' },
    { text: 'Quick Start Guide', href: '/guide/quick-start' }
  ]"
/>

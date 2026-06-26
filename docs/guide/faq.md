---
outline: [2, 3]
title: "FAQ & Troubleshooting"
titleTemplate: NpgsqlRest
description: "Frequently asked questions about NpgsqlRest: missing endpoints, 404s, parameter naming, authentication, login endpoints, uploads, SSE, CORS, deployment, testing, performance, logging, and troubleshooting."
head:
  - - meta
    - name: keywords
      content: npgsqlrest faq, npgsqlrest troubleshooting, what problems does npgsqlrest solve, end-to-end type safety, postgresql code generation, database-first, endpoint not found, postgresql rest api questions, npgsqlrest 404, sql injection, npgsqlrest testing, npgsqlrest cors, postgresql login endpoint, file upload postgresql, server-sent events postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest FAQ & Troubleshooting"
  - - meta
    - property: og:description
      content: "Frequently asked questions about NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# FAQ & Troubleshooting

## General

### What is NpgsqlRest?

NpgsqlRest is a self-contained executable that connects to PostgreSQL and automatically creates REST API endpoints from plain SQL script files, database functions, and procedures. No generated server code, no ORM — just SQL.

### What problems does NpgsqlRest solve?

Mainly one: the **middle tier**. In a conventional stack the same shape is declared several times over — table, ORM entity, DTO, controller, client model — and nothing checks them against each other. Every schema change becomes a grep-for-callers hunt, and the miss you didn't catch shows up at runtime, in front of users. NpgsqlRest removes that layer rather than automating it:

- **One type system to rule them all.** PostgreSQL already has a rich, enforced type system, so NpgsqlRest uses it as the *only* one. SQL files are described against the live schema at startup (a misspelled column fails the start, not a request), functions carry a `returns table(...)` contract the database itself enforces, and every type in the generated code below is derived from those PostgreSQL types. Rename a column and `tsc` breaks the frontend build *before* production. Type drift between database and client cannot happen by construction. See [End-to-End Static Type Checking](/blog/end-to-end-static-type-checking-postgresql-typescript).
- **A lot of generated code, all from the same SQL.** No controllers, services, repositories, DTOs, or mappers to write — in a [production case study](/blog/case-study-zero-backend-code#time-saved-quantified), that was ~3,500–7,300 lines of host-language code that never existed and signature changes roughly 5× faster. What NpgsqlRest currently generates, regenerated on every [watch](/config/watch) cycle:
  - Typed [TypeScript client](/config/codegen) — `fetch` modules and interfaces, optionally with separate type files, URL constants, and SSE helpers
  - [TanStack Query (React Query) hooks](/config/react-query) — `useQuery` / `useMutation` per endpoint
  - Typed [Dart client](/config/dart-codegen) for Flutter — request/response models and functions
  - [`.http` files](/config/http-files) — ready-to-run requests for REST Client and Visual Studio
  - [OpenAPI](/config/openapi) specification (`openapi.json`)
  - [MCP tools](/config/mcp) for AI agents, plus OpenAI and Anthropic function-calling `tools` documents and an `llms.txt`
- **The philosophy: the database *is* the application.** This is the deliberate opposite of Clean Architecture's "the database is a detail." Your schema and your SQL *are* the business rules; PostgreSQL is the tier — not a data store hidden behind layers that rebuild what it already does better. Everything else — HTTP method, auth, caching, rate limits, retries, even the client fetch call — is the actual detail, and details are either **declared** (SQL comment annotations such as `@authorize` and `@cached`) or **generated**. See [Philosophy of NpgsqlRest](/blog/sql-rest-api#philosophy-of-npgsqlrest).

### What PostgreSQL versions are supported?

PostgreSQL 13 and newer. Discovery uses standard `pg_catalog` views that are stable across PostgreSQL versions.

### What .NET version is required?

None, for most users — the standalone executable and the Docker image are fully self-contained (AOT-compiled). The NuGet library targets .NET 10.

### Is it safe from SQL injection?

Yes, by construction. Client-supplied values are **always** sent as PostgreSQL protocol parameters — never concatenated into SQL text. The SQL that runs is the SQL you wrote in the file, function, or procedure; a request can only choose parameter *values*, never SQL fragments. There is no query-building layer to inject into (unlike REST-to-SQL translators that construct queries from URLs).

### How does NpgsqlRest compare to PostgREST or Supabase?

See the detailed [comparison blog post](/blog/npgsqlrest-vs-postgrest-supabase-comparison) for a full feature-by-feature breakdown. The short version: PostgREST turns your *tables* into an API you query from the client; NpgsqlRest turns your *SQL* (files, functions, procedures) into an API you design.

### Can I use it inside an existing ASP.NET Core application?

Yes — the standalone executable is a wrapper around the `NpgsqlRest` NuGet middleware. In your own app: `app.UseNpgsqlRest(new NpgsqlRestOptions(connectionString) { ... })`. The plugins (SQL file source, TypeScript client, Dart client, OpenAPI, MCP) are separate NuGet packages.

### Can NpgsqlRest also serve my frontend (static files, SPA)?

Yes — enable the `StaticFiles` section (root defaults to `wwwroot`) and it serves your SPA or static site from the same host as the API. `AuthorizePaths` puts paths behind login (with `UnauthorizedRedirectPath` for the redirect), and `ParseContentOptions` can template user claims and allow-listed environment variables into HTML at serve time — per-environment SPA config without a build step. See [Static Files](/config/static-files).

---

## Installation & Setup

### How do I install NpgsqlRest?

See the [Installation Guide](/guide/installation) — standalone executable (Linux/macOS/Windows), an npm package (`npm i npgsqlrest`), a Docker image, or NuGet.

### How do I run it in Docker?

```sh
docker run --name npgsqlrest -p 8080:8080 \
  -e Urls="http://*:8080" \
  -v ./appsettings.json:/app/appsettings.json \
  vbilopav/npgsqlrest:latest
```

Two things about `localhost` in a container: the default `Urls` is `http://localhost:8080`, which binds only inside the container, so set `Urls` to `http://*:8080` (as above, or in the mounted `appsettings.json`) for the published port to be reachable. And `localhost` in the connection string is the container too — point it at `host.docker.internal` (or the compose service name) to reach your database.

### How do I connect to my database?

Set the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres"
  }
}
```

See [Connection Settings](/config/connection) for all options.

### What if NpgsqlRest won't start because the database is down?

By default `TestConnectionStrings: true` opens a test connection at startup. If it fails, the client retries on a 1, 3, 6, 12-second sequence for transient errors (connection drops, timeouts), then exits with an error if all retries fail. To skip the startup test, set `TestConnectionStrings: false`, or disable retries with `ConnectionRetryOptions.Enabled: false`. This is useful when you want the server to start even if PostgreSQL isn't ready yet.

### Can I use environment variables for configuration?

Yes. With `ParseEnvironmentVariables` in the `Config` section (enabled by default), use `{ENV_VAR_NAME}` placeholders in configuration values — optional by default, `{!ENV_VAR_NAME}` for required (startup error when unset, since 3.17.0), or `{!ENV_VAR_NAME:fallback}` for a fallback value when unset (since 3.21.0). A `./.env` file is loaded automatically since 3.21.0 (the `EnvFile` option; real environment variables always win over the file — set it to `null` to disable). Any setting can also be overridden on the command line: `npgsqlrest --npgsqlrest:urlpathprefix=/v1`.

### How do I change the port, bind address, or enable HTTPS?

Set the top-level `Urls` option — the default is `http://localhost:8080`; use `http://0.0.0.0:8080` to listen on all interfaces (semicolon-separate multiple URLs). HTTPS is enabled with the `Ssl` section (redirection and HSTS are on once enabled) and a certificate configured under `Kestrel` — PFX, PEM, or the Windows certificate store. See [Server settings](/config/server).

---

## Endpoints

### My function doesn't appear as an endpoint

Check these causes, most common first:

1. **No `HTTP` annotation** — since 3.17.0 the client defaults to `CommentsMode: "OnlyAnnotated"`: a routine becomes an endpoint **only if its comment contains an HTTP annotation** (or a plugin annotation like `@mcp`). Add one — `comment on function my_func() is 'HTTP GET';` — or set `CommentsMode: "ParseAll"` to expose everything discovered.
2. **Schema filtered out**: by default every schema the connection has `USAGE` on is scanned (system schemas excluded). If you set `IncludeSchemas`, `SchemaSimilarTo`, or their exclude counterparts in [NpgsqlRest Options](/config/npgsqlrest), make sure the schema passes the filter.
3. **Insufficient privileges**: the connection's database user needs `EXECUTE` on the function and `USAGE` on the schema.
4. **A `@disabled` annotation** on the routine.
5. **Check the logs**: run with the `NpgsqlRest` log level at `Debug` to see what was discovered and skipped.

### My SQL file doesn't appear as an endpoint

Same `CommentsMode` rule as functions — the file needs an `HTTP` annotation by default. Two additional file-specific causes:

1. **`SkipPattern`** — files matching `SqlFileSource.SkipPattern` (default `"*.test.sql"`) are excluded from endpoint discovery; they're test files for the [test runner](/guide/testing).
2. **A describe error with `ErrorMode: "Skip"`** — the file failed type-checking against the database and was skipped with a logged error. (`ErrorMode: "Exit"`, the default, would have stopped startup and shown it.)

### An endpoint exists but I get 404 — why?

A 404 for an existing path is almost always **parameter matching**: a request must supply values for **all parameters without defaults**, with **matching names** — otherwise no endpoint matches and the response is 404 (not 400). Check:

1. **Parameter names are converted** — `p_user_id` becomes `pUserId` with the default camelCase converter. The generated [TypeScript client](/config/codegen) or [HTTP file](/config/http-files) always shows the exact names.
2. **Missing required parameter** — give it a default (`@param name default null` in SQL files, `DEFAULT` in function signatures) to make it optional.
3. **The path prefix** — the full path includes `UrlPathPrefix` (default `/api`).
4. **The HTTP method** — `select` files/functions map to GET by default; mutations map to PUT/POST/DELETE.

### Why did my read-only function become a POST endpoint?

For functions, the HTTP method is inferred from PostgreSQL **volatility** — and `VOLATILE` is PostgreSQL's default, so a plain function maps to a mutation unless it is declared `STABLE` or `IMMUTABLE`, its name starts with `get_`, contains `_get_`, or ends with `_get`. Fix: declare read functions `STABLE` (good practice anyway), use a `get_` name, or state the method explicitly in the comment: `HTTP GET`. See [Comment Annotations](/guide/annotations).

### Are parameters sent in the query string or the request body?

By HTTP method: GET and DELETE endpoints read parameters from the **query string**; POST, PUT, and other methods read a **JSON body**. Override per endpoint with [`@request_param_type`](/annotations/request-param-type) (`query_string` or `body_json`), or globally with `DefaultRequestParamType`. Sending parameters the wrong way means no endpoint matches — a 404, not a 400.

### Why are parameter and column names camelCased? How do I turn that off?

The default `NameConverter` converts `snake_case` PostgreSQL names to `camelCase` JSON/URL names. Set `"CamelCaseNames": false` in the `NpgsqlRest` section to keep names exactly as they are in the database.

### My query returns one row — why do I get an array?

Endpoints return arrays by default. Annotate with [`@single`](/annotations/single) to return the first row as a single JSON object, or combine with `@nested` for composite shapes. A single-column result set returns a flat value array (`["a","b"]`) — that's the `UnnamedSingleColumnSet` default in [SQL File Source](/config/sql-file-source).

### How do I return plain text, HTML, or CSV instead of JSON?

Use [`@raw`](/annotations/raw) — the column values are written to the response verbatim, with [`@separator` and `@new_line`](/annotations/separator) for delimiter control, plus a `Content-Type` response header:

```sql
-- HTTP GET
-- @raw
-- @separator ,
-- @new_line \n
-- Content-Type: text/csv
select id, name, price from products;
```

There is also a [table format](/config/table-format) output mode for ready-made HTML tables and Excel exports.

### How do I return a specific HTTP status code from SQL?

`raise exception 'message';` surfaces as HTTP 400 by default (SQLSTATE `P0001`), insufficient privilege (`42501`) as 403, and command timeouts as 504. The whole mapping is configurable — `ErrorHandlingOptions` maps any PostgreSQL SQLSTATE to any status code through named policies, so `raise exception ... using errcode = '...'` plus a policy entry gives full status control from SQL (e.g. map `23505` unique violations to 409). Apply a policy per endpoint with [`@error_code_policy`](/annotations/error-code-policy); unmapped errors return 500. See [Error Handling](/config/error-handling).

### How do I set response headers like `Content-Disposition` or `Set-Cookie`?

Write plain `Header-Name: value` lines in the comment — the same way the CSV example above sets `Content-Type`. Values support `{parameter}` substitution, so a dynamic download filename is one line: `Content-Disposition: attachment; filename={name}.csv`. Repeated header names combine into one header. See [Response Headers](/annotations/response-headers) and [parameter substitution](/annotations/parameter-substitution).

### Can one SQL file run multiple statements?

Yes — a multi-statement file executes as a single batch (one database round-trip) and returns a JSON object with one key per result set: `{"result1": ..., "result2": ...}`. Name the keys with [`@result`](/annotations/result-name), drop a statement's output with [`@skip`](/annotations/skip) (it still executes), or return `204 No Content` with [`@void`](/annotations/void); `BEGIN`/`COMMIT`/`SET` statements are hidden automatically. All statements share the same parameters. See [SQL File Endpoints](/guide/sql-files).

### How do I customize the endpoint URL path?

Use the [`@path`](/annotations/path) annotation — `-- @path /custom/path` in a SQL file, or the same line in a function comment. Versioning works the same way: `@path /v2/orders`.

### How do I restrict access to an endpoint?

Use [`@authorize`](/annotations/authorize), optionally with roles: `-- @authorize admin, manager`. Mind the default posture, though: the standalone client ships with `RequiresAuthorization: true`, so **every endpoint already requires an authenticated user** and [`@allow_anonymous`](/annotations/allow-anonymous) opts out per endpoint. Set `NpgsqlRest.RequiresAuthorization` to `false` for public-by-default endpoints where `@authorize` opts in (that is the NuGet library's default).

### Can I expose tables and views directly, without writing any SQL?

That's deliberately not the default model — NpgsqlRest wants you to *design* the API surface. The closest thing is a one-line SQL file per operation (`select * from my_view;` is a complete endpoint file). If you want fully automatic table CRUD, the `NpgsqlRest.CrudSource` NuGet plugin exists for library users, but plain SQL files are the recommended path.

---

## Parameters

### Named or positional parameters in SQL files — which should I use?

Named (`:name`, since 3.19.0) for almost everything — the placeholder is the parameter name, so no `@param` naming annotations are needed, and the same name used repeatedly (even across statements) is one parameter:

```sql
-- HTTP GET
select id, title from reports
where created_at between :from_date and :to_date;
```

`GET /api/get-reports?fromDate=...&toDate=...` — done. Positional (`$1`, `$2`) remains fully supported; one style per file. See [SQL File Endpoints — Parameters](/guide/sql-files#parameters).

### How do I make a parameter optional?

Give it a default. Functions: the native `DEFAULT` clause. SQL files: the `@param` annotation — `-- @param status default 'active'` or `-- @param label default null`. A parameter without a default is required, and a request missing it gets a 404 (no matching endpoint).

### How do I get the authenticated user's ID into a query?

Enable claim-to-parameter mapping with [`@user_parameters`](/annotations/user-parameters) and use a parameter whose **name matches a claim mapping** (default: `_user_id` → the user-id claim). With named parameters this needs nothing else:

```sql
-- HTTP GET
-- @authorize
-- @user_parameters
select id, total, status
from orders
where user_id = :_user_id;
```

The value comes from the authenticated principal — the client cannot send or override it. (With positional parameters, add `-- @param $1 _user_id` to give `$1` the mapped name.) To read claims as session settings instead of parameters, [`@user_context`](/annotations/user-context) exposes them to `current_setting('request.user_id', true)`, `request.user_roles`, `request.ip_address`, and friends.

### How do I send an array parameter?

In a query string, repeat the key: `?ids=1&ids=2&ids=3` binds a three-element PostgreSQL array to an `int[]` parameter. In a JSON body, use a JSON array: `{"ids": [1, 2, 3]}`. Careful: repeating a key for a *non-array* parameter concatenates the values into one string instead.

### How do I pass NULL in a query string?

By default an empty value (`?p=`) is an **empty string**, not NULL (`QueryStringNullHandling: "Ignore"`). Change it per endpoint with [`@query_string_null_handling`](/annotations/query-string-null-handling) — `empty_string` makes `?p=` mean NULL, `null_literal` makes `?p=null` mean NULL — or set the global default. For NULLs in *text responses*, [`@response_null`](/annotations/response-null-handling) chooses between empty string (default), the literal `null`, or `204 No Content`.

### How do I read HTTP request headers in my SQL?

Add a `json` or `text` parameter named `_headers` with a `null` default — the default `RequestHeadersMode: "Parameter"` fills it with all request headers as JSON. The `Context` mode makes headers readable anywhere via `current_setting('request.headers', true)` instead. Per endpoint: [`@request_headers_mode`](/annotations/request-headers-mode).

### How do I receive a raw request body (webhooks)?

Use [`@body_parameter_name`](/annotations/body-parameter-name) — the entire raw body (text, JSON, or `bytea`) is routed into that one parameter, and any other parameters automatically move to the query string.

### Can I validate parameters before they reach the database?

Yes — `@validate <param> using <rule1>, <rule2>` runs immediately after parsing, before any database connection is opened. Built-in rules: `not_null`, `not_empty`, `required`, `email`; custom `Regex`/`MinLength`/`MaxLength` rules with their own status codes and messages are defined in `ValidationOptions`. See [Validation](/config/validation) and [`@validate`](/annotations/validate).

### Error: "could not determine data type of parameter"

PostgreSQL couldn't infer the parameter's type from context (classic case: `select set_config('key', :value, true)`). Give it a type hint: `-- @param :value text` (or `-- @param $1 value text` positionally), or add an inline cast in the SQL (`:value::text`).

---

## Authentication

### What authentication methods are supported?

Cookie-based auth, JWT Bearer tokens, Microsoft Bearer tokens, HTTP Basic Auth, Passkeys/WebAuthn (FIDO2), and external OAuth providers (Google, GitHub, LinkedIn, Microsoft, Facebook). All can be enabled simultaneously. See [Authentication config](/config/auth).

### How do I set up JWT authentication?

```json
{
  "Auth": {
    "JwtAuth": true,
    "JwtSecret": "your-secret-key-at-least-32-characters-long",
    "JwtExpire": "60 minutes"
  }
}
```

See the [Multiple Auth Schemes blog post](/blog/multiple-auth-schemes-rbac-external-providers) for a complete walkthrough including login endpoints and RBAC.

### How do I create a login endpoint?

Annotate a routine or SQL file with [`@login`](/annotations/login) (usually together with `@allow_anonymous`). It returns **one row**: a few special columns (`status`, `scheme`, `body`, `hash`) control the response, and **every other column becomes a claim** on the signed-in user — no row returned means 401. Verify the password yourself in SQL, or return a `hash` column and let the built-in PBKDF2 hasher verify it. Full walkthrough in the [Authentication guide](/guide/authentication).

### How do I log users out?

Annotate an endpoint with [`@logout`](/annotations/logout). A `void` routine signs the caller out of the default scheme; returned values are treated as scheme names to sign out of selectively.

### How do I hash passwords when creating users?

Use `-- @param hashed_password is hash of password` — the target parameter receives a PBKDF2-SHA256 hash of the source parameter before the routine runs, compatible with `@login`'s built-in verification. The CLI can hash too: `npgsqlrest --hash <password>`. See [parameter hashing](/annotations/parameter-hash).

### How do I add social login (Google, GitHub, Microsoft…)?

Enable `Auth.External` and add a provider block with `ClientId` and `ClientSecret` — Google, GitHub, LinkedIn, Microsoft, and Facebook are pre-configured; custom providers just set their URLs. After the OAuth flow, NpgsqlRest calls your configured `LoginCommand` function with the provider data, and its result follows the same columns-to-claims conventions as [`@login`](/annotations/login). See [External Auth](/config/external-auth).

### My SPA on a different domain loses the session cookie — why?

Browsers drop cookies on cross-site requests unless the cookie is explicitly marked for it: set `Auth.CookieSameSite: "None"` together with `Auth.CookieSecure: "Always"` (and typically `CookieDomain`), and enable CORS with `AllowCredentials: true` and explicit origins. See [Auth config](/config/auth) and [CORS](/config/cors).

---

## Real-time, Uploads & Integrations

### How do I push real-time events to the browser?

Server-Sent Events: annotate a routine with [`@sse`](/annotations/sse) and every `raise info` it makes is broadcast to subscribers connected to the endpoint's stream URL (`<path>/info` by default). Control who receives events with [`@sse_scope`](/annotations/sse-events-scope) — `all`, `authorize [roles]`, or `matching`. See the [SSE guide](/guide/sse) and the [real-time chat blog post](/blog/real-time-chat-postgresql-sse-npgsqlrest).

### How do I accept file uploads?

Enable `UploadOptions` and annotate the endpoint with [`@upload`](/annotations/upload). Four handlers: `large_object` (default — PostgreSQL Large Objects), `file_system`, and `csv`/`excel`, which parse the file and run a SQL command per row (bulk ingestion without client code). Upload metadata arrives in a `json` parameter, and everything is transactional — an exception rolls back the rows *and* discards the file. See [Uploads](/config/uploads) and the [secure image uploads post](/blog/secure-image-uploads-postgresql-typescript).

### Can my SQL call an external HTTP API?

Yes — **HTTP Custom Types**: create a composite type whose comment describes a request (`GET https://api.example.com/{id}`, headers, body), take it as a function parameter, and NpgsqlRest executes the call and fills the type's fields (`body`, `status_code`, `success`, …) before your function runs. Requires `HttpClientOptions.Enabled: true`; supports timeouts, retries, and GET response caching. See [HTTP Custom Types](/guide/http-types).

### Can NpgsqlRest forward requests to another service (reverse proxy)?

Yes — [`@proxy`](/annotations/proxy) forwards the request to an upstream URL and streams the response back without touching the database; declare `_proxy_*` parameters to transform the upstream response in SQL instead. [`@proxy_out`](/annotations/proxy-out) is the reverse: run your routine first, then send its result upstream (PDF rendering, ML inference, email). Requires `ProxyOptions.Enabled`. See the [Proxy guide](/guide/proxy).

### How do I expose functions as AI tools (MCP)?

Enable `McpOptions` and annotate routines with [`@mcp`](/annotations/mcp) — only annotated routines are exposed, on a single `/mcp` endpoint (streamable HTTP). `@mcp` without an HTTP annotation makes a tool-only routine with no REST route, and `@authorize` roles are enforced on tool calls. Since 3.20.0, [`McpOptions.ToolSchemas`](/config/mcp#function-calling-schemas-and-llms-txt-toolschemas) can also project the same tool catalog into OpenAI and Anthropic function-calling `tools` documents and an llms.txt — generated and served even when the `/mcp` endpoint is disabled. See [MCP](/config/mcp) and the [MCP server blog post](/blog/mcp-server-postgresql-ai-tools-npgsqlrest).

### Can it generate a client — TypeScript, Dart, `.http` files, OpenAPI?

All of them, regenerated on every [watch](/config/watch) cycle: `ClientCodeGen` emits typed TypeScript fetch modules with interfaces (and, since 3.20.0, optional [TanStack Query hooks](/config/react-query) via `ReactQuery`), `DartClientCodeGen` (3.20.0) emits [Dart modules for Flutter](/config/dart-codegen), `HttpFileOptions` writes ready-to-run `.http` files, and `OpenApiOptions` serves `openapi.json` (hide individual endpoints with [`@openapi hide`](/annotations/openapi)). See [Code Generation](/config/codegen), [Dart Code Generation](/config/dart-codegen), [HTTP Files](/config/http-files), and [OpenAPI](/config/openapi).

---

## Testing

### How do I test my endpoints?

With the built-in [SQL test runner](/guide/testing) (since 3.19.0): write tests as plain `.sql` files and run `npgsqlrest ./config.json --test`. A test inserts fixtures, invokes a real endpoint **in-process** (full pipeline: routing, auth, parameter binding, serialization), asserts on the captured response with ordinary SQL, and rolls back — endpoints see the test's uncommitted data because they run on the test's own connection and transaction.

```sql
begin;
insert into users (email) values ('x@example.com');

/*
GET /api/get-users
# @claim user_id=1
*/
select status = 200, 'authenticated caller gets 200' from _response;

rollback;
```

### Can tests run against a temporary database instead of my real one?

Yes — that's the recommended CI setup. `Setup` steps create (and `Teardown` drops) a uniquely named database (`app_test_{rnd5}`), migrations run as a step, and `TestRunner.ConnectionName` points the whole run at it. Template databases give per-test clones for perfect isolation. See the [scenario catalog in the Testing Guide](/guide/testing#scenario-dedicated-test-database-per-run).

### My test fixtures need half the database inserted first — is there a better way?

Yes, and it's pure PostgreSQL: declare your foreign keys **`deferrable`**, then start the test with `set constraints all deferred;`. Deferred constraints are checked at `COMMIT` — and a test that ends in `rollback` never commits, so you can insert **only the rows the test is about**, in any order, referencing rows that don't exist. No fixture factories, no dependency-ordered setup. See [the technique in the Testing Guide](/guide/testing#fixtures-without-inserting-the-whole-database-deferrable-constraints).

### Is there a watch mode?

Two, with one flag. `npgsqlrest ... --test --watch` re-runs **tests** on changes — a changed test re-runs alone in milliseconds; a changed *endpoint* file or *database routine* rebuilds the endpoints in-process and re-runs everything, reporting exactly which endpoints appeared or dropped; Ctrl+C still tears the test database down. `npgsqlrest ... --watch` (without `--test`) watches the **running server** — it restarts on SQL file, configuration, and database routine changes, regenerating code (TypeScript client, HTTP files) on every cycle, so `create or replace` a function in psql and the endpoint is live seconds later. See [Watch Mode configuration](/config/watch).

---

## Performance

### How fast is it?

Independent-methodology benchmarks measure thousands of requests per second on a single host — see the [July 2026 benchmark series](/blog/benchmarks-2026-07/) for detailed comparisons against PostgREST, Go, Rust, Spring Boot, FastAPI, and others under equalized conditions, including the methodology, per-framework analysis, and the full dataset. The executables are AOT-compiled native binaries; there is no JIT warmup and no reflection at runtime.

### How do I enable caching?

Annotate with [`@cached`](/annotations/cached) (+ `@cache_expires_in 5 minutes`). The backend (Memory, Redis, or HybridCache) is configured in [Cache Options](/config/cache-options); per-user and per-parameter cache keys are supported. For conditional or tiered rules ("skip caching for admins", "shorter TTL for open-ended queries"), bundle settings into named profiles and select them with [`@cache_profile`](/annotations/cache-profile). **Note:** a bare `@cached` keys the cache on every routine parameter; list parameters explicitly — `@cached _user_id, _page` — when some of them should not affect the key.

### How do I enable response compression?

```json
{ "ResponseCompression": { "Enabled": true } }
```

See [Response Compression](/config/response-compression).

### How do I set up rate limiting?

Define policies in [Rate Limiter config](/config/rate-limiter) and apply them per endpoint with [`@rate_limiter_policy`](/annotations/rate-limiter-policy).

### Should I use the AOT or the JIT Docker image?

The default AOT image (~60 MB compressed) starts instantly — best for development, CLI use, and scale-to-zero deployments. The JIT variant (`vbilopav/npgsqlrest:latest-jit`) is 50–100% faster under sustained high concurrency, at the cost of slower cold start and a ~110 MB compressed image — recommended for sustained high-throughput production workloads. See [Installation — JIT Image](/guide/installation#jit-image).

### How do I stream very large result sets?

Responses are flushed every 25 rows by default. [`@buffer_rows 0`](/annotations/buffer-rows) writes each row as it arrives (constant memory, immediate first byte); higher values trade memory for throughput.

---

## Deployment & Production

### My browser app gets CORS errors — how do I allow my frontend origin?

Enable the `Cors` section and list origins explicitly. `AllowCredentials` defaults to `false` — cookie-based auth needs it `true`, together with explicit `AllowedOrigins` (browsers reject `*` combined with credentials):

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": ["https://app.example.com"],
    "AllowCredentials": true
  }
}
```

See [CORS](/config/cors).

### Behind nginx / Cloudflare the client IP is wrong

Enable the `ForwardedHeaders` section so `X-Forwarded-For`/`-Proto` are honored — this affects logs, rate limiting, and the `request.ip_address` context value. Set `ForwardLimit` to your proxy-chain depth and restrict trust with `KnownProxies`/`KnownNetworks`; with both lists empty, the headers are accepted from any source. See [Forwarded Headers](/config/forwarded-headers).

### Can I run behind PgBouncer / RDS Proxy / Supabase Pooler in transaction mode?

Yes — set `NpgsqlRest.WrapInTransaction: true`. It wraps every request in `BEGIN`…`COMMIT`, which keeps `set_config` state (claims, headers, user context) local to the request instead of leaking across pooled backends. Required for any pooler in transaction mode. See [NpgsqlRest Options](/config/npgsqlrest).

### Is there a health endpoint for Kubernetes or load balancers?

Enable `HealthChecks`: `/health` (overall), `/health/ready` (includes a PostgreSQL connectivity check), and `/health/live` (no database check — so a database outage doesn't restart your pods). See [Health Checks](/config/health-checks).

### Can I route endpoints to a read replica or a second database?

Yes — two mechanisms, depending on whether the databases have the same routines. For **identical** databases (read replicas, shards): define multiple named entries in `ConnectionStrings`, set `NpgsqlRest.UseMultipleConnections: true`, and pick per endpoint with [`@connection <name>`](/annotations/connection) — metadata is still read once, and the target is assumed to have the same routine. For databases hosting **different** routines (OLTP + OLAP/DW): list them in `NpgsqlRest.RoutineOptions.ReadMetadataFromConnections` (3.21.0+) — routine metadata is read from each listed connection and endpoints execute where they were discovered, no duplication on the main database needed. Without `NpgsqlRest.ConnectionName`, the first entry is the main connection. Comma-separated hosts in one connection string become a multi-host data source with failover and load balancing. See the [Connection Management guide](/guide/connections) for the full scenario walkthrough and [Connection Settings](/config/connection) for the reference.

### Does it retry transient errors?

Two layers, both on by default. Connection failures (startup included) retry on a 1, 3, 6, 12-second sequence, so the server survives the database starting after it does. Command execution retries transient SQLSTATEs — serialization failures (`40001`), deadlocks (`40P01`), dropped connections — on a 0, 1, 2, 5, 10-second sequence; define named strategies and assign them per endpoint with [`@retry_strategy`](/annotations/retry-strategy). **Important:** mutations (INSERT/UPDATE/DELETE) can be retried and re-executed on a deadlock or serialization failure — they should be idempotent or accept duplicate attempts. See [Command Retry](/config/command-retry) and [Connection Settings](/config/connection).

---

## Debugging & Logging

### How do I see which endpoints are created and what options they have?

Set the `NpgsqlRest` log level to `Debug` — every endpoint logs as it is created, including which annotations were applied:

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Debug" } } }
```

Or list them without starting the server: `npgsqlrest --endpoints`.

### How do I log the SQL each endpoint executes at runtime?

Two settings: `"LogCommands": true` in the `NpgsqlRest` section opts in, and the `NpgsqlRest` channel must be at `Debug` or lower (commands log at debug level):

```json
{
  "NpgsqlRest": { "LogCommands": true },
  "Log": { "MinimalLevels": { "NpgsqlRest": "Debug" } }
}
```

Add `"LogCommandParameters": true` to include parameter values (mind the sensitive-data implications in production — [`@security_sensitive`](/annotations/security-sensitive) obfuscates a specific endpoint). See the [Logging Guide](/guide/logging) for the full picture.

### How do I see the metadata queries NpgsqlRest runs at startup?

Set the `NpgsqlRest` log level to `Verbose` — includes everything from `Debug` plus the raw `pg_catalog` discovery queries and the SQL-file describe phase. Useful when a function or file isn't being discovered and you need to see the underlying query and its filters.

### How do I completely silence a logger?

Since 3.19.0 any `Log:MinimalLevels` entry accepts `"Off"` (aliases `"None"`, `"Silent"`):

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Off", "NpgsqlRestClient": "Off" } } }
```

Each named logger is independent — handy for muting the application channels while watching the test runner's `NpgsqlRestTest` channel.

### Why do my RAISE messages appear in the server log?

`LogConnectionNoticeEvents` is on by default — `raise info/notice/warning` from executing routines is written to the application log (the same mechanism that powers [SSE](/guide/sse)). Set it to `false` in the `NpgsqlRest` section to silence them, or tune the format with `LogConnectionNoticeEventsMode`. See the [Logging Guide](/guide/logging).

### How do I validate the configuration without starting the server?

`npgsqlrest --validate` checks configuration keys *and* database connectivity, exiting 0 on success and 1 on failure — CI-friendly. Related: `--config` prints the fully resolved annotated configuration, `--annotations` lists every supported comment annotation as JSON, and `--endpoints` lists the endpoints that would be created. See [Installation — CLI](/guide/installation).

### Can I use the CLI to generate password hashes?

Yes — `npgsqlrest --hash <password>` generates a PBKDF2-SHA256 hash compatible with [`@login`](/annotations/login) and password parameters. For HTTP Basic auth, `npgsqlrest --basic_auth <user> <password>` outputs the header value to add to a request.

---

## Troubleshooting

### Every endpoint returns 401 Unauthorized

That is the default posture, not a bug: the standalone client ships with `RequiresAuthorization: true`, so endpoints require an authenticated user unless annotated otherwise. Add [`@allow_anonymous`](/annotations/allow-anonymous) to public endpoints, or set `NpgsqlRest.RequiresAuthorization` to `false` and protect endpoints individually with [`@authorize`](/annotations/authorize).

### Startup warning: "Unknown configuration key"

Almost always a typo in `appsettings.json` — keys are validated at startup. Run `npgsqlrest --config` to print the complete annotated configuration, or use the published JSON schema for editor autocompletion.

### Error: "permission denied for schema"

The database user lacks `USAGE` on the schema:

```sql
grant usage on schema my_schema to my_user;
grant execute on all functions in schema my_schema to my_user;
```

This is also a feature: run the server as a least-privilege role and endpoints can only do what that role can do.

### Timeout errors (504 Gateway Timeout)

Adjust the command timeout per endpoint with [`@command_timeout 2 minutes`](/annotations/command-timeout), or globally in configuration.

### My POST body seems ignored — the endpoint returns 404

Request bodies are read as **JSON regardless of the `Content-Type` header** — there is no content-type validation, and form-encoded/form-multipart bodies are never parsed (multipart files are only for [`@upload`](/annotations/upload) endpoints). A malformed JSON body logs a warning (`Could not parse JSON body ...`) and the request proceeds with **no parameters**, which then fails endpoint matching with a 404. Always send valid JSON, and the `Content-Type` header can be anything or omitted.

### 413 Payload Too Large

Kestrel caps request bodies at 30,000,000 bytes (~28.6 MB) by default — large uploads hit this before any NpgsqlRest setting. Raise `Kestrel.Limits.MaxRequestBodySize` in [Server settings](/config/server).

### Timestamps shifted after upgrading to 3.16+

Since 3.16.0, timestamps in JSON are treated as **UTC** by default (naive ISO strings assumed UTC, offset strings converted), so stored values no longer depend on the host's timezone. If you relied on the old host-local parsing, `NpgsqlRest.JsonTimestampsAreUtc: false` restores it — but treat that as a compatibility escape hatch, not a setting for new projects.

### Encrypted data is unreadable after restart

Data Protection keys default to in-memory on Linux — configure persistent storage:

```json
{ "DataProtection": { "Storage": "FileSystem", "FileSystemPath": "/var/lib/npgsqlrest/keys" } }
```

See [Data Protection config](/config/data-protection).

### Leftover `*_abcde` test databases

The test runner drops its `{rnd}`-named databases on every exit path it can intercept — including Ctrl+C, SIGTERM, and hard startup errors. Leftovers mean a run was killed with SIGKILL (nothing can intercept that) or ran with `Keep: true`. Drop them manually:

```sql
select format('drop database %I with (force);', datname)
from pg_database where datname like 'app_test_%' \gexec
```

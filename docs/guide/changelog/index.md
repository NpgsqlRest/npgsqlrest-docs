# Changelog

Select a version below to view the full changelog.

Note: The changelog for versions older than 3.0 can be found here: [Changelog Archive](https://github.com/NpgsqlRest/NpgsqlRest/blob/master/changelog-old.md)

---

## Version 3.18 (Latest)

| Version | Date |
|---------|------|
| [v3.18.2](/guide/changelog/v3.18.2) | 2026-06-26 |
| [v3.18.1](/guide/changelog/v3.18.1) | 2026-06-23 |
| [v3.18.0](/guide/changelog/v3.18.0) | 2026-06-23 |

- New: `ProxyOptions.MaxForwardedQueryParamLength` (default `2048`) — a server-filled value too long for the proxy query string is skipped with a warning instead of producing an unusable request line (HTTP 414/431); forward large values via a body-carrying method and `@body_parameter_name`
- New: `OmitAutomaticParameters` on the TypeScript client, HTTP file, and OpenAPI generators (default `false`) — omit optional server-filled parameters (HTTP Custom Type fields, resolved-parameter expressions, upload metadata, IP/claim params) from generated request shapes
- Fix: `@body_parameter_name` now matches an HTTP Custom Type field by its converted, actual, or expanded signature name, case-insensitively — applied consistently by request handling and all code generators (also fixes the HTTP file and OpenAPI generators leaving the field in the query string)
- Fix: TypeScript client generation for `@body_parameter_name` endpoints — no leaked `?` in the body property name, the body parameter is excluded from the query string, and no `fetch` body is emitted for `GET`
- Fix: all automatic (server-filled) proxy parameters — user claims, IP, HTTP Custom Type fields, and resolved-parameter expressions — now forward to proxy endpoints uniformly, with placement following the endpoint's `RequestParamType` (query string or merged into the JSON body) rather than the HTTP verb
- New: HTTP Custom Type response caching via the `@cache` directive — opt-in, GET-only outbound response caching with TTL, success-only storage, and stampede protection; configured globally under `HttpClientOptions` (`CacheEnabled`, `MaxCacheEntries`, `CachePruneIntervalSeconds`)
- Fix: an HTTP Custom Type parameter on a database-function endpoint fired one outbound call per composite field (a 6-field type → 6 identical calls); now one call per distinct type, shared from a single response
- Fix: `@timeout`, `@retry_delay`, and `@cache` directives placed after the headers (as the docs showed) were silently ignored — both before-request-line and after-headers placements are now equivalent

---

## Version 3.17

| Version | Date |
|---------|------|
| [v3.17.0](/guide/changelog/v3.17.0) | 2026-06-10 |

- New plugin `NpgsqlRest.Mcp` — expose opted-in PostgreSQL routines as MCP tools (`tools/list` / `tools/call` over Streamable HTTP) via the `@mcp` annotation; a bare `@mcp` with no HTTP tag is an MCP-only tool with no public route
- MCP OAuth 2.1 resource-server authorization: Protected Resource Metadata (RFC 9728), audience binding (RFC 8707), per-tool `@authorize` enforcement on `tools/call`
- Neutral plugin extension points on `RoutineEndpoint` (`HandleCommentLine`, `Items`, `UnhandledCommentLines`) and new `CommentsMode.OnlyAnnotated` (now the client default)
- New: `{name}` annotation substitution can resolve allowlisted environment variables (`NpgsqlRest:AvailableEnvVars`); matching is now case-insensitive, unknown placeholders log a build-time warning
- New: optional `{NAME}` and required `{!NAME}` environment-variable placeholders in config values — missing optional variables no longer crash typed reads
- Breaking: safer configuration defaults — `Cors:AllowCredentials` is now `false`, passkey `UserVerificationRequirement` / `ResidentKeyRequirement` default to `"required"`, `TestConnectionStrings` defaults to `true`
- Breaking (C# API only): `RoutineEndpoint.OpenApiHide` / `OpenApiTags` removed — the OpenAPI plugin parses the `@openapi` annotation itself; annotation users are unaffected
- 🔴 Security fix: SSE per-event `USING HINT` scopes were not enforced — hint-scoped events were delivered to every subscriber; upgrade strongly recommended for hint-based SSE scoping
- Fix: bare `@cached` (no parameter list) keyed only on the routine name, serving the first cached response to all inputs
- Fix: HybridCache silently bypassed the cache on null cached parameters (`Cache key contains invalid content`)
- Fix: malformed JSON request body now returns `400 Bad Request` (was `404`)
- Fix: JSON command parameters accept `json`, `jsonb`, or `text` target types

---

## Version 3.16

| Version | Date |
|---------|------|
| [v3.16.3](/guide/changelog/v3.16.3) | 2026-06-03 |
| [v3.16.2](/guide/changelog/v3.16.2) | 2026-06-02 |
| [v3.16.1](/guide/changelog/v3.16.1) | 2026-06-01 |
| [v3.16.0](/guide/changelog/v3.16.0) | 2026-05-20 |

- New: `AvailableEnvVars` under `StaticFiles:ParseContentOptions` templates environment-variable values into served static content (same `{NAME}` tags as claims) — build a SPA bundle once, inject per-environment values from pod env vars at boot

- New: rate-limiter rejection `StatusCode`/`StatusMessage` are now overridable per policy (the global values stay as defaults); ships a ready-to-use disabled `login_throttle` policy

- Fix: cache stampede protection now actually fires for cached routine responses (`IRoutineCache.GetOrCreateAsync`); a burst of identical cold-cache requests collapses to a single database execution

- Fix: JSON-to-parameter parsers for `timestamp`, `timestamptz`, `time`, and `timetz` are now host-TZ-independent (silent host-offset shift removed)
- Fix: `TryParseDate` falls back to a `DateTime` parse when `DateOnly` rejects offset/`Z`-bearing inputs
- Breaking: JSON timestamps are now interpreted as UTC by default (naive ISO strings assumed UTC, `Z` / offset-bearing strings converted to UTC)
- New `NpgsqlRest:JsonTimestampsAreUtc` config key — opt-out escape hatch to restore the pre-3.16.0 host-local interpretation

---

## Version 3.15

| Version | Date |
|---------|------|
| [v3.15.2](/guide/changelog/v3.15.2) | 2026-05-11 |
| [v3.15.1](/guide/changelog/v3.15.1) | 2026-05-11 |
| [v3.15.0](/guide/changelog/v3.15.0) | 2026-05-11 |

- Auth: named cookie schemes now actually authenticate requests (cookie-aware policy-scheme dispatch)
- New `Auth:CookieSameSite` and `Auth:CookieSecure` config keys for cross-origin SPA / mobile clients (root + per-scheme)
- OpenAPI filtering: `IncludeSchemas`, `ExcludeSchemas`, `NameSimilarTo`, `NameNotSimilarTo`, `RequiresAuthorizationOnly`
- New `@openapi` annotation — `@openapi hide` and `@openapi tag <name>` for per-routine OpenAPI control
- Fix: `Auth:Schemes` keys validated by `Type`, not by name — custom schemes named like the docs examples no longer fail startup (3.15.1)
- Fix: `--config` and `--validate` CLI commands honor `ValidateConfigKeys` mode (3.15.1)
- Fix: `RateLimiterOptions:Policies` and `CacheOptions:Profiles` validate by shape — custom policy / profile names no longer fail startup under `ValidateConfigKeys: "Error"` (3.15.2)
- Improvement: `ValidationOptions:Rules` rule bodies validated for typos (3.15.2)

---

## Version 3.14

| Version | Date |
|---------|------|
| [v3.14.0](/guide/changelog/v3.14.0) | 2026-05-09 |

- Standalone client no longer wires the `NpgsqlRest.CrudSource` plugin (library use unchanged)
- New SSE annotations `@sse_publish` and `@sse_subscribe` — split publisher and subscriber roles
- Warning when a `RAISE` looks like a missed `@sse_publish`
- Reliable SSE connection handshake
- Startup error when claim-mapped parameters use a non-text type
- Warning when a request value is overridden by claim auto-bind
- Lower-allocation JSON conversion for arrays and composites
- Hardening: `ArrayPool` rentals released in `try/finally`, column-decryption failures logged at Trace

---

## Version 3.13

| Version | Date |
|---------|------|
| [v3.13.0](/guide/changelog/v3.13.0) | 2026-04-24 |

- Auth Schemes — named additional authentication schemes (Cookies / BearerToken / Jwt)
- Login functions can select a scheme via the `scheme` column

---

## Version 3.12

| Version | Date |
|---------|------|
| [v3.12.0](/guide/changelog/v3.12.0) | 2026-03-23 |

- New endpoint source plugin: `NpgsqlRest.SqlFileSource` — generate REST API endpoints directly from `.sql` files
- Multi-command SQL files with batched execution and named result sets
- New `@param` / `@parameter` annotation for renaming and retyping parameters across all endpoint types
- Glob pattern `**` recursive matching support
- Interface refactoring: `IEndpointSource` / `IRoutineSource` split
- TsClient: multi-command SQL file endpoint support
- Composite type cache public API

---

## Version 3.11

| Version | Date |
|---------|------|
| [v3.11.1](/guide/changelog/v3.11.1) | 2026-03-13 |
| [v3.11.0](/guide/changelog/v3.11.0) | 2026-03-10 |

- `proxy_out` annotation (post-execution proxy)
- TsClient: `proxy` and `proxy_out` passthrough endpoint support
- `authorize` annotation now matches user ID and user name claims

---

## Version 3.10

| Version | Date |
|---------|------|
| [v3.10.0](/guide/changelog/v3.10.0) | 2026-02-25 |

- Resolved parameter expressions for server-side secret handling
- HTTP Client Type retry logic (`@retry_delay`)
- Data Protection encrypt/decrypt annotations

---

## Version 3.9

| Version | Date |
|---------|------|
| [v3.9.0](/guide/changelog/v3.9.0) | 2026-02-23 |

- Commented configuration output (`--config`)
- Configuration search and filter (`--config [filter]`)
- CLI improvements and test suite

---

## Version 3.8

| Version | Date |
|---------|------|
| [v3.8.0](/guide/changelog/v3.8.0) | 2025-02-11 |

- Configuration key validation
- Optional path parameters
- Machine-readable CLI commands for tool integration
- Universal `fallback_handler` for all upload handlers

---

## Version 3.7

| Version | Date |
|---------|------|
| [v3.7.0](/guide/changelog/v3.7.0) | 2025-02-07 |

- Pluggable table format renderers (HTML, Excel)
- TsClient per-endpoint URL export control
- Excel upload handler `fallback_handler`

---

## Version 3.6

| Version | Date |
|---------|------|
| [v3.6.3](/guide/changelog/v3.6.3) | 2025-02-03 |
| [v3.6.2](/guide/changelog/v3.6.2) | 2025-02-02 |
| [v3.6.1](/guide/changelog/v3.6.1) | 2025-02-02 |
| [v3.6.0](/guide/changelog/v3.6.0) | 2025-02-01 |

- Security headers middleware
- Forwarded headers middleware
- Health check endpoints
- PostgreSQL statistics endpoints

---

## Version 3.5

| Version | Date |
|---------|------|
| [v3.5.0](/guide/changelog/v3.5.0) | 2025-01-28 |

- PasskeyAuth (WebAuthn/FIDO2)
- Response compression fix for static files
- Separate core and client logging

---

## Version 3.4

| Version | Date |
|---------|------|
| [v3.4.8](/guide/changelog/v3.4.8) | 2025-01-26 |
| [v3.4.7](/guide/changelog/v3.4.7) | 2025-01-21 |
| [v3.4.6](/guide/changelog/v3.4.6) | 2025-01-21 |
| [v3.4.5](/guide/changelog/v3.4.5) | 2025-01-19 |
| [v3.4.4](/guide/changelog/v3.4.4) | 2025-01-17 |
| [v3.4.3](/guide/changelog/v3.4.3) | 2025-01-16 |
| [v3.4.2](/guide/changelog/v3.4.2) | 2025-01-15 |
| [v3.4.1](/guide/changelog/v3.4.1) | 2025-01-15 |
| [v3.4.0](/guide/changelog/v3.4.0) | 2025-01-16 |

- Composite type support (arrays, nested JSON)
- Deep nested composite type resolution
- Multidimensional array support
- Performance optimizations (type category lookup, StringBuilder pooling, CancellationToken propagation)

---

## Version 3.3

| Version | Date |
|---------|------|
| [v3.3.1](/guide/changelog/v3.3.1) | 2025-01-14 |
| [v3.3.0](/guide/changelog/v3.3.0) | 2025-01-08 |

- Parameter validation
- Linux ARM64 build and Docker image
- Proxy response caching
- Optional `@` prefix for comment annotations

---

## Version 3.2

| Version | Date |
|---------|------|
| [v3.2.7](/guide/changelog/v3.2.7) | 2025-01-05 |
| [v3.2.6](/guide/changelog/v3.2.6) | 2025-01-04 |
| [v3.2.4](/guide/changelog/v3.2.4) | 2025-01-03 |
| [v3.2.3](/guide/changelog/v3.2.3) | 2025-12-30 |
| [v3.2.2](/guide/changelog/v3.2.2) | 2025-12-24 |
| [v3.2.1](/guide/changelog/v3.2.1) | 2025-12-23 |
| [v3.2.0](/guide/changelog/v3.2.0) | 2025-12-22 |

- Reverse proxy feature
- JWT authentication support
- HybridCache support
- Docker image with Bun runtime

---

## Version 3.1

| Version | Date |
|---------|------|
| [v3.1.3](/guide/changelog/v3.1.3) | 2025-12-21 |
| [v3.1.2](/guide/changelog/v3.1.2) | 2025-12-20 |
| [v3.1.1](/guide/changelog/v3.1.1) | 2025-12-15 |
| [v3.1.0](/guide/changelog/v3.1.0) | 2025-12-13 |

- HTTP Types (external API calls from PostgreSQL functions)
- Path parameters support
- SIMD-accelerated string processing
- Routine caching improvements
- Multi-host connection support

---

## Version 3.0

| Version | Date |
|---------|------|
| [v3.0.1](/guide/changelog/v3.0.1) | 2025-11-28 |
| [v3.0.0](/guide/changelog/v3.0.0) | 2025-11-27 |

- .NET 10 target framework
- Rate limiter
- OpenAPI 3.0 support
- Error handling improvements (RFC 7807 Problem Details)
- TsClient improvements
- SSE (Server-Sent Events) naming refactor

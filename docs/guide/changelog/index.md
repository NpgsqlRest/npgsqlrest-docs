# Changelog

Select a version below to view the full changelog.

Note: The changelog for versions older than 3.0 can be found here: [Changelog Archive](https://github.com/NpgsqlRest/NpgsqlRest/blob/master/changelog-old.md)

---

## Version 3.12 (Latest)

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

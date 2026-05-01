---
outline: [2, 3]
title: "Cache Options"
titleTemplate: NpgsqlRest
description: "Configure response caching for NpgsqlRest. Memory cache, Redis cache, hybrid caching, cache invalidation, and cache key configuration."
head:
  - - meta
    - name: keywords
      content: npgsqlrest cache, postgresql api cache, redis cache api, memory cache rest api, cache invalidation, api response caching
  - - meta
    - property: og:title
      content: "NpgsqlRest Cache Options"
  - - meta
    - property: og:description
      content: "Configure response caching with memory, Redis, or hybrid storage for PostgreSQL API endpoints."
  - - meta
    - property: og:type
      content: article
---

# Cache Options

Caching configuration for PostgreSQL routines.

## Overview

```json
{
  "CacheOptions": {
    "Enabled": false,
    "Type": "Memory",
    "MemoryCachePruneIntervalSeconds": 60,
    "RedisConfiguration": "localhost:6379,abortConnect=false,ssl=false,connectTimeout=10000,syncTimeout=5000,connectRetry=3",
    "MaxCacheableRows": 1000,
    "UseHashedCacheKeys": false,
    "HashKeyThreshold": 256,
    "InvalidateCacheSuffix": null,
    "HybridCacheUseRedisBackend": false,
    "HybridCacheMaximumKeyLength": 1024,
    "HybridCacheMaximumPayloadBytes": 1048576,
    "HybridCacheDefaultExpiration": null,
    "HybridCacheLocalCacheExpiration": null,
    "Profiles": {}
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable caching for routines. |
| `Type` | string | `"Memory"` | Cache type: `"Memory"`, `"Redis"`, or `"Hybrid"`. |
| `MemoryCachePruneIntervalSeconds` | int | `60` | How often to prune expired items from memory cache (in seconds). |
| `RedisConfiguration` | string | *(see below)* | Redis connection string. Used when `Type` is `"Redis"`, or when `Type` is `"Hybrid"` with `HybridCacheUseRedisBackend: true`. |
| `MaxCacheableRows` | int? | `1000` | Maximum number of rows that can be cached for set-returning functions. If a result set exceeds this limit, it will not be cached (but will still be returned). Set to `0` to disable caching for sets entirely. Set to `null` for unlimited (use with caution). |
| `UseHashedCacheKeys` | bool | `false` | When `true`, cache keys longer than `HashKeyThreshold` characters are hashed to a fixed-length SHA256 string. This reduces memory usage for long cache keys and improves Redis performance with large keys. |
| `HashKeyThreshold` | int | `256` | Cache keys longer than this threshold (in characters) will be hashed when `UseHashedCacheKeys` is `true`. Keys shorter than this threshold are stored as-is for better debuggability. |
| `InvalidateCacheSuffix` | string? | `null` | When set, creates an additional invalidation endpoint for each cached endpoint. The invalidation endpoint has the same path with this suffix appended. |
| `HybridCacheUseRedisBackend` | bool | `false` | When `Type` is `"Hybrid"`, enables Redis as the L2 (secondary/distributed) cache backend. When `false`, HybridCache uses in-memory only but still provides stampede protection. |
| `HybridCacheMaximumKeyLength` | int | `1024` | Maximum length of cache keys in characters (Hybrid cache only). Keys longer than this will be rejected. |
| `HybridCacheMaximumPayloadBytes` | int | `1048576` | Maximum size of cached payloads in bytes (Hybrid cache only). Default is 1 MB. |
| `HybridCacheDefaultExpiration` | string? | `null` | Default expiration for cached entries. Accepts PostgreSQL interval format (e.g., `"5 minutes"`, `"1 hour"`). If not set, individual endpoint `cache_expires` annotations are used, or entries don't expire. |
| `HybridCacheLocalCacheExpiration` | string? | `null` | Expiration for L1 (in-memory) cache in Hybrid mode. Set shorter than `HybridCacheDefaultExpiration` to refresh local cache more frequently from Redis. Accepts PostgreSQL interval format. |
| `Profiles` | object? | `null` | Named caching profiles. Each profile selects its own backend, default expiration, key parameters, and `When` rules. Endpoints opt in via the [`@cache_profile`](../annotations/cache-profile) annotation. See [Cache Profiles](#cache-profiles) below. |

## Cache Types

### Memory Cache

In-memory caching on the application server:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory",
    "MemoryCachePruneIntervalSeconds": 60
  }
}
```

The `MemoryCachePruneIntervalSeconds` setting controls how frequently expired cache entries are removed.

### Redis Cache

Distributed caching using Redis:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "RedisConfiguration": "localhost:6379,abortConnect=false,ssl=false,connectTimeout=10000,syncTimeout=5000,connectRetry=3"
  }
}
```

See [StackExchange.Redis Configuration](https://stackexchange.github.io/StackExchange.Redis/Configuration.html) for connection string options.

### Hybrid Cache

HybridCache uses Microsoft's `Microsoft.Extensions.Caching.Hybrid` library to provide:

- **Stampede protection**: Prevents multiple concurrent requests from hitting the database when cache expires
- **Optional Redis L2 backend**: Can use Redis as a distributed secondary cache for sharing across instances
- **In-memory L1 cache**: Fast local cache for frequently accessed data

Basic HybridCache (in-memory with stampede protection):

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Hybrid",
    "HybridCacheUseRedisBackend": false,
    "HybridCacheDefaultExpiration": "5 minutes"
  }
}
```

HybridCache with Redis backend:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Hybrid",
    "HybridCacheUseRedisBackend": true,
    "RedisConfiguration": "localhost:6379,abortConnect=false",
    "HybridCacheMaximumKeyLength": 1024,
    "HybridCacheMaximumPayloadBytes": 1048576,
    "HybridCacheDefaultExpiration": "5 minutes",
    "HybridCacheLocalCacheExpiration": "1 minute"
  }
}
```

When `HybridCacheUseRedisBackend` is `false` (default), HybridCache works as an in-memory cache with stampede protection. When `true`, it uses Redis as the L2 distributed cache for sharing across multiple application instances.

**When to use HybridCache:**
- When you need stampede protection (prevents thundering herd on cache expiry)
- When running multiple application instances that need to share cache
- When you want the best of both worlds: fast local cache + distributed storage

## Cache Key Hashing

For improved performance with Redis cache, especially when routines have many or large parameters, you can enable cache key hashing:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "UseHashedCacheKeys": true,
    "HashKeyThreshold": 256
  }
}
```

When enabled, cache keys exceeding the threshold are automatically hashed to a fixed 64-character SHA256 string, reducing:

- Memory usage for storing long cache keys
- Network transfer overhead with Redis
- Redis server memory consumption

This is particularly recommended when:
- Using Redis cache with routines that have many or large parameters
- Caching routines with long SQL expressions
- High cache hit rates where memory efficiency matters

## Caching Set-Returning Functions

Caching now works for set-returning functions and record types, not just single scalar values. When a cached function returns multiple rows, the entire result set is cached and returned on subsequent calls.

Use `MaxCacheableRows` to limit memory usage:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "MaxCacheableRows": 1000
  }
}
```

If a result set exceeds this limit, it will still be returned but will not be cached.

## Cache Invalidation Endpoints

NpgsqlRest can automatically create invalidation endpoints for each cached endpoint. When `InvalidateCacheSuffix` is configured, calling the invalidation endpoint with the same parameters removes the corresponding cache entry.

```json
{
  "CacheOptions": {
    "Enabled": true,
    "InvalidateCacheSuffix": "invalidate"
  }
}
```

Example usage:

```
GET /api/get-user/?id=123           -> Returns cached user data
GET /api/get-user/invalidate?id=123 -> Removes cache entry, returns {"invalidated":true}
GET /api/get-user/?id=123           -> Fresh data (cache was cleared)
```

Key features:
- Same authentication and authorization as the original endpoint
- Same parameter handling - no need to know the internal cache key format
- Works correctly with hashed cache keys
- Returns `{"invalidated":true}` if cache entry was removed, `{"invalidated":false}` if not found

## Cache Profiles

Cache profiles let you maintain multiple distinct caching policies in one application — different backends, expirations, key shapes, or per-parameter bypass conditions — and let endpoints opt into them via the [`@cache_profile`](../annotations/cache-profile) annotation.

This is useful when one app needs:
- Different cache backends for different data classes (e.g., Memory for hot per-user data, Redis for shared session data).
- Different TTLs depending on input shape (e.g., historical queries cached for 1 hour, "until now" queries cached for 5 minutes).
- Selective cache bypass (e.g., real-time queries with `live=true` always fetch fresh).

### Overview

```jsonc
"CacheOptions": {
  "Enabled": true,
  "Type": "Memory",                 // root cache (used by endpoints WITHOUT @cache_profile)
  // ... existing top-level fields ...
  "Profiles": {
    "fast_memory": {
      "Enabled": true,
      "Type": "Memory",
      "Expiration": "30 seconds",
      "Parameters": ["user_id"]
    },
    "shared_redis": {
      "Enabled": true,
      "Type": "Redis",
      "Expiration": "1 hour"
    },
    "timeseries": {
      "Enabled": true,
      "Type": "Memory",
      "Expiration": "1 hour",
      "Parameters": ["from", "to"],
      "When": [
        { "Parameter": "to", "Value": null, "Then": "5 minutes" }
      ]
    }
  }
}
```

Endpoints without `@cache_profile` continue to use the root cache. Endpoints with `@cache_profile <name>` use the named profile.

### Profile fields

| Field | Type | Description |
|---|---|---|
| `Enabled` | bool | Default `false`. Set `true` to register the profile. Disabled profiles are skipped at startup with an Information log. |
| `Type` | string | `"Memory"`, `"Redis"`, or `"Hybrid"`. Required when `Enabled=true`. |
| `Expiration` | string? | Default expiration (PostgreSQL interval format, e.g. `"5 minutes"`, `"1 hour"`). Used when the endpoint has no `@cache_expires` annotation. |
| `Parameters` | string[]? | Default cache-key parameter list. **Three semantics**: `null`/missing → use **all** routine parameters; `[]` → URL-only cache (one entry per endpoint); `["x", "y"]` → use only these. The endpoint's `@cached p1, p2` annotation overrides this. |
| `When` | object[]? | List of conditional rules evaluated at request time (see below). |

### Backend pooling

All profiles of the same `Type` share a single backend instance: one Memory cache, one Redis connection, one HybridCache singleton. Backends are instantiated **lazily** — only types actually used (root + at least one enabled profile) get spun up. If no profile uses Redis and the root `Type` isn't `Redis`, no Redis connection is ever attempted, even if `RedisConfiguration` is set.

Cache entries written under a profile are **prefixed with the profile name** so two profiles sharing the same Memory backend cannot collide on the same routine + parameters. Endpoints without a profile have no prefix; existing pre-3.13 cache entries remain wire-compatible.

### When rules

`When` is a list of rules evaluated against the request's resolved parameter values. Each rule has three fields:

| Field | Type | Description |
|---|---|---|
| `Parameter` | string | Routine parameter name to inspect (matches against `ActualName` or `ConvertedName`). Required. |
| `Value` | scalar / array / null | Match condition. Scalar = exact match. Array = OR over entries. JSON `null` matches .NET `null`/`DBNull.Value` (does **not** match empty string). Other values are stringify-and-equal case-insensitive. |
| `Then` | string | Required action: the literal string `"skip"` to bypass the cache for this request, OR a PostgreSQL interval (e.g. `"30 seconds"`, `"5 minutes"`, `"1 hour"`) to override the entry's TTL when writing. |

Rules are evaluated **in declaration order; first match wins**. If no rule matches, the entry is cached using the profile's `Expiration`.

#### Pattern: skip-on-condition

Bypass the cache entirely for some inputs:

```jsonc
"When": [
  { "Parameter": "to", "Value": null, "Then": "skip" }
]
```

When `to` is null/missing, no read or write happens — routine executes fresh. Common for "until-now" or "live" data.

#### Pattern: dynamic TTL

Different TTLs depending on input shape:

```jsonc
"When": [
  { "Parameter": "live", "Value": true,  "Then": "skip" },
  { "Parameter": "to",   "Value": null,  "Then": "5 minutes" }
]
```

- `live=true` → bypass entirely (real-time mode).
- `live=false` and `to=null` → 5-minute TTL (open-ended query).
- Otherwise → fall through to the profile's `Expiration` (e.g. 1 hour for historical queries with both `from` and `to`).

#### Pattern: array-of-values

Match any of several values:

```jsonc
"When": [
  { "Parameter": "status", "Value": [null, ""], "Then": "skip" }
]
```

Matches when `status` is null OR empty string.

### Validation

Misconfiguration is caught at startup so deploy issues surface early rather than silently disabling caching at runtime:

| Problem | Result |
|---|---|
| `@cache_profile` references an unknown name | Startup fails with single `InvalidOperationException` listing every unresolved name and the endpoints that referenced each |
| Profile registered but no endpoint references it | Information log: "registered but not used by any endpoint. Did you forget a `@cache_profile` annotation?" |
| Profile has missing/invalid `Type` | Warning, profile skipped |
| Profile has invalid `Expiration` (bad PG interval) | Warning, profile skipped |
| Profile name is empty/whitespace | Warning, profile skipped |
| `When` rule's `Parameter` isn't a routine parameter | Warning, rule dropped (other rules still apply) |
| `When` rule's `Parameter` isn't in the resolved cache-key list | Warning, rule dropped (otherwise different rule-evaluations would share a cache entry) |
| `When` rule has missing/invalid `Then` | Warning, rule dropped |

### Connection pooler note

If you're using a connection pooler in transaction mode (PgBouncer, AWS RDS Proxy in transaction mode, Supabase Pooler), see [`WrapInTransaction`](./npgsqlrest#wrapintransaction) — it's required for context-injection features but does not affect profiles directly.

### Complete example

```jsonc
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory",
    "MaxCacheableRows": 1000,
    "InvalidateCacheSuffix": "invalidate",
    "Profiles": {
      "user_scoped_fast": {
        "Enabled": true,
        "Type": "Memory",
        "Expiration": "1 minute",
        "Parameters": ["user_id"]
      },
      "shared_long_term": {
        "Enabled": true,
        "Type": "Redis",
        "Expiration": "1 hour"
      },
      "timeseries_compute": {
        "Enabled": true,
        "Type": "Memory",
        "Expiration": "1 hour",
        "Parameters": ["from", "to", "live"],
        "When": [
          { "Parameter": "live", "Value": true,  "Then": "skip" },
          { "Parameter": "to",   "Value": null,  "Then": "5 minutes" }
        ]
      }
    }
  }
}
```

```sql
-- Uses root Memory cache (no profile)
comment on function get_app_settings() is 'HTTP GET
@cached
@cache_expires 1 hour';

-- Per-user 1-minute cache via fast Memory profile
comment on function get_my_dashboard(user_id int) is 'HTTP GET
@cache_profile user_scoped_fast';

-- Distributed Redis with 1-hour default
comment on function get_global_metrics() is 'HTTP GET
@cache_profile shared_long_term';

-- Mixed: long-cache historical queries, short-cache open-ended,
-- bypass entirely when `live` is true
comment on function compute_timeseries(from text, to text default null, live boolean default false) is 'HTTP GET
@cache_profile timeseries_compute';
```

## Routine Annotations

Enable caching for specific routines using comment annotations:

### cached

Mark a routine as cacheable:

```sql
comment on function get_products() is '
HTTP GET /products
@cached
';
```

Specify which parameters to use for the cache key:

```sql
comment on function get_product(p_id int) is '
HTTP GET /products
@cached p_id
';
```

If no parameters are specified, all parameters are used for the cache key.

### cache_expires / cache_expires_in

Set cache expiration using [interval format](../annotations/interval-format):

```sql
comment on function get_products() is '
HTTP GET /products
@cached
@cache_expires 5m
';
```

```sql
comment on function get_config() is '
HTTP GET /config
@cached
@cache_expires_in 1h
';
```

If no expiration is specified, cache entries never expire.

### cache_profile

Select a [named cache profile](#cache-profiles) for the endpoint:

```sql
comment on function get_dashboard() is '
HTTP GET
@cache_profile fast_memory
';
```

`@cache_profile` implies caching — `@cached` is unnecessary alongside it but is still allowed and overrides the profile's `Parameters` list. See the dedicated [@cache_profile annotation reference](../annotations/cache-profile) for full semantics.

## Example Configuration

Production configuration with Redis:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "RedisConfiguration": "redis-server:6379,password={REDIS_PASSWORD},ssl=true,abortConnect=false"
  }
}
```

Development configuration with memory cache:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory",
    "MemoryCachePruneIntervalSeconds": 30
  }
}
```

## Related

- [Interval Format](../annotations/interval-format) - Time/duration format reference
- [cached annotation](../annotations/cached) - Enable caching on endpoints
- [cache_expires_in annotation](../annotations/cache-expires-in) - Set cache expiration
- [cache_profile annotation](../annotations/cache-profile) - Select a named cache profile per endpoint
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Configure NpgsqlRest settings
- [Connection Settings](./connection) - Configure database connections

## See Also

- [CACHED](/annotations/cached) - Enable caching on endpoints
- [CACHE_EXPIRES_IN](/annotations/cache-expires-in) - Set cache expiration duration

---
layout: doc
outline: [2, 3]
title: "NpgsqlRest 3.13.0: Cache Profiles, Auth Schemes, Per-User Rate Limits, and pgBouncer Compatibility"
date: "2026-05-01"
titleTemplate: NpgsqlRest
description: "NpgsqlRest 3.13.0 release notes with real-world examples: conditional caching with When rules, short-lived sensitive sessions, per-user rate limiting, and multi-tenant search_path with pgBouncer."
head:
  - - meta
    - name: keywords
      content: npgsqlrest 3.13, cache profiles, auth schemes, rate limiter partition, pgbouncer multi-tenant, before routine commands, wrap in transaction, postgresql connection pooler
  - - meta
    - property: og:title
      content: "NpgsqlRest 3.13.0: Cache Profiles, Auth Schemes, Per-User Rate Limits, and pgBouncer Compatibility"
  - - meta
    - property: og:description
      content: "NpgsqlRest 3.13.0 — conditional caching, short-lived sessions, per-user rate limiting, and pgBouncer transaction-mode compatibility."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "NpgsqlRest 3.13.0: Production Patterns"
  - - meta
    - name: twitter:description
      content: "Cache profiles, auth schemes, partitioned rate limiting, and pgBouncer multi-tenant support in NpgsqlRest 3.13.0."
---

# NpgsqlRest 3.13.0: Cache Profiles, Auth Schemes, Per-User Rate Limits, and pgBouncer Compatibility

<p class="blog-meta">
  <span>April 2026</span> ·
  <span class="tag">v3.13.0</span>
  <span class="tag">Caching</span>
  <span class="tag">Auth</span>
  <span class="tag">Rate Limiting</span>
  <span class="tag">Multi-Tenancy</span>
</p>

**[NpgsqlRest 3.13.0](/guide/changelog/v3.13.0)** gives first-class declarative support to four production scenarios that previously required custom middleware, external services, or hacky workarounds:

1. **Caching that adapts to query inputs** — historical data cached for hours, "open-ended" data cached briefly, real-time queries bypassing the cache entirely.
2. **Short-lived sensitive sessions** alongside a normal long-lived session, e.g., for recovery-code or admin flows.
3. **Per-user rate limits** instead of global buckets shared by all users.
4. **pgBouncer / RDS Proxy / Supabase Pooler compatibility** with multi-tenant `search_path` driven by JWT claims.

All four patterns ship as configuration, not code. Walkthroughs below; full reference and migration notes in the [v3.13.0 changelog](/guide/changelog/v3.13.0).

## 1. Conditional Caching: Historical vs Current vs Live

A common analytics endpoint has parameters like `from`, `to`, and `live`. The right caching policy depends on which combination the client sends:

- **Both `from` and `to` are set** → query covers a closed historical range; results are immutable. Cache for hours.
- **`to` is null** → "open-ended" range covering up to now; results change as new rows arrive. Short TTL — say, 5 minutes, matching the upstream refresh cadence.
- **`live = true`** → real-time mode, must always fetch fresh.

Before 3.13, this either meant three different endpoints or imperative cache logic in SQL. Now it's a single profile with `When` rules. Here's the full `CacheOptions` block backed by Redis (so cache state survives restarts and is shared across multiple NpgsqlRest instances behind a load balancer):

```jsonc
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "RedisConfiguration": "redis-server:6379,password={REDIS_PASSWORD},ssl=true,abortConnect=false,connectTimeout=10000,syncTimeout=5000,connectRetry=3",
    "MaxCacheableRows": 1000,
    "UseHashedCacheKeys": true,
    "HashKeyThreshold": 256,
    "InvalidateCacheSuffix": "invalidate",
    "Profiles": {
      "timeseries_compute": {
        "Enabled": true,
        "Type": "Redis",
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

Notes on the top-level fields:

- **`Type: "Redis"`** at the root makes Redis the default backend for endpoints that don't specify a profile.
- **`RedisConfiguration`** — full StackExchange.Redis connection string. The `{REDIS_PASSWORD}` placeholder is resolved from environment variables; `ssl=true` is recommended for production.
- **`MaxCacheableRows: 1000`** caps which set-returning results get cached — anything larger is still returned, just not cached, so a runaway query doesn't blow up Redis.
- **`UseHashedCacheKeys: true`** with **`HashKeyThreshold: 256`** hashes long keys to a fixed SHA-256 string. Important for Redis when routines have many or large parameters — keeps memory and network overhead bounded.
- **`InvalidateCacheSuffix: "invalidate"`** automatically generates a companion endpoint at `/api/compute-timeseries/invalidate` that clears the cache entry for the same parameters, with the same auth requirements.

Profiles share the root backend pool — both root and `timeseries_compute` use a single Redis connection, not two. The profile-name prefix on cache keys keeps entries isolated even when multiple profiles share a backend.

```sql
comment on function compute_timeseries(
  from text,
  to text default null,
  live boolean default false
) is 'HTTP GET
@cache_profile timeseries_compute';
```

How rules evaluate (first match wins):

| Request | Matches | Result |
|---------|---------|--------|
| `?from=2025-01-01&to=2025-12-31` | none | profile default → cached **1 hour** |
| `?from=2025-01-01` (`to` omitted) | `to=null` | cached **5 minutes** |
| `?from=2025-01-01&live=true` | `live=true` | **bypass cache entirely** |

The `Then` field accepts the literal `"skip"` (bypass cache) or any PostgreSQL interval string (override TTL). Because `Parameters` is `["from", "to", "live"]`, both rule-matched paths and the default-TTL path get separate cache entries — `live=true` requests never poison the historical cache.

See [Cache Options → Cache Profiles](/config/cache-options#cache-profiles) for the full rule semantics, validation rules, and backend pooling notes.

## 2. Short-Lived Sensitive Session Alongside the Normal Session

A user is signed in with a normal 14-day cookie. Now they want to view recovery codes or change their password. You don't want the recovery-code page accessible for 14 days from any device that ever signed in — you want a fresh, short-lived authentication that expires when the browser closes.

Before 3.13, this meant either re-prompting for the password and just trusting it, or building a separate "step-up" auth service. Now you register an additional cookie scheme:

```jsonc
{
  "Auth": {
    "CookieAuth": true,
    "CookieValid": "14 days",
    "Schemes": {
      "short_session": {
        "Type": "Cookies",
        "Enabled": true,
        "CookieValid": "1 hour",
        "CookieMultiSessions": false
      }
    }
  }
}
```

Any field not overridden inherits from the root `Auth` section, so the override block stays small.

The recovery-code step has its own login function that returns `'short_session'` in the `scheme` column:

```sql
create function recovery_step_up(_user_id int, _recovery_code text)
returns table (scheme text, name_identifier text, name text)
language sql security definer as $$
  select 'short_session' as scheme, user_id::text, username
  from users
  where user_id = _user_id
    and verify_recovery_code(recovery_code_hash, _recovery_code);
$$;
```

The endpoint that displays the recovery codes requires this specific scheme:

```sql
comment on function show_recovery_codes() is 'HTTP GET
@authorize short_session';
```

`CookieMultiSessions: false` makes the cookie session-only (no `Max-Age`), so closing the browser invalidates it. The 1-hour `CookieValid` server-side cap means even a left-open tab stops working after an hour. The user's normal 14-day session is unaffected.

Same pattern works for admin areas, payment flows, or any per-scope restriction. JWT and BearerToken types support the same overrides — see the [per-type override fields table](/config/auth#per-type-override-fields).

## 3. Per-User Rate Limits

Pre-3.13, a rate limiter policy was a single global bucket. `PermitLimit: 100, WindowSeconds: 60` meant 100 requests per minute **across all users combined**, which is rarely what you want — one heavy user could exhaust the quota for everyone else.

The new `Partition` block resolves a partition key per request and gives each key its own bucket:

```jsonc
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": {
      "per_user": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "Partition": {
          "Sources": [
            { "Type": "Claim", "Name": "name_identifier" },
            { "Type": "IpAddress" },
            { "Type": "Static", "Value": "anonymous" }
          ]
        }
      }
    }
  }
}
```

```sql
comment on function user_dashboard() is 'HTTP GET
@authorize
@rate_limiter per_user';
```

`Sources` are walked top-to-bottom; the first one that returns a non-empty value wins:

| Request | Resolved key | Bucket |
|---------|--------------|--------|
| Authenticated user `42` | `name_identifier=42` | per-user bucket |
| Anonymous request from `203.0.113.5` | `IpAddress=203.0.113.5` | per-IP bucket |
| Anonymous, no IP visible | `Static=anonymous` | shared "anonymous" bucket |

`BypassAuthenticated: true` is also available — useful for "throttle anonymous only" patterns where signed-in users skip the limiter entirely.

Behavior is unchanged for policies without a `Partition` block. See [Per-User Rate Limiting](/config/rate-limiter#per-user-rate-limiting-partition) for source types and validation rules.

::: warning Breaking change
`RateLimiterOptions:Policies` is now an object keyed by policy name, no longer an array of objects with `"Name"` properties. Migration is mechanical — see the [changelog](/guide/changelog/v3.13.0#breaking-ratelimiteroptions-policies-is-now-a-dict-not-an-array).
:::

## 4. Multi-Tenant search_path with pgBouncer (or RDS Proxy, or Supabase Pooler)

A multi-tenant deployment where each tenant's data lives in its own schema, and the JWT carries a `tenant_id` claim. Each request needs `search_path` set so the routine sees the right tenant's tables.

Without a connection pooler, `set_config('search_path', tenant, false)` works fine — the GUC sticks for the session and Npgsql's pool issues `DISCARD ALL` when the connection returns. With a transaction-mode pooler (pgBouncer transaction-pool, AWS RDS Proxy in transaction mode, Supabase Pooler), the same backend is reused for unrelated requests **without** session reset, so a `search_path` set in one request can leak into the next.

3.13 introduces two cooperating options:

```jsonc
{
  "NpgsqlRest": {
    "WrapInTransaction": true,
    "BeforeRoutineCommands": [
      {
        "Sql": "select set_config('search_path', $1, true)",
        "Parameters": [{ "Source": "Claim", "Name": "tenant_id" }]
      }
    ]
  }
}
```

`WrapInTransaction: true` wraps every request in `BEGIN ... COMMIT` and switches all `set_config` calls to `is_local=true` (transaction-scoped). On `COMMIT`, the GUC is discarded — the next request on the same backend gets a clean slate.

`BeforeRoutineCommands` runs declared SQL **after** any context is set but **before** the main routine call, in the same `NpgsqlBatch` (no extra round-trip). Parameters are bound from `HttpContext` at request time — `Source: "Claim"` reads `User.FindFirst("tenant_id")`, and the value is passed as a SQL parameter (no string interpolation, no injection risk).

Per-request execution order:

1. `BEGIN`
2. `set_config('search_path', $1, true)` with `$1` bound to the claim value
3. The routine call
4. `COMMIT`

Steps 1–3 share a single network round-trip. The routine sees the right `search_path`; nothing leaks between requests.

`BeforeRoutineCommands` also accepts raw strings (no parameters) and supports `Source: "RequestHeader"` and `Source: "IpAddress"` for non-claim cases. See [Connection Pooler Compatibility](/config/npgsqlrest#connection-pooler-compatibility) for the full schema.

## Other Notable Changes

- **400 Bad Request responses now log at `Warning` level** — previously silent in production. Database exceptions mapped to 400 (`P0001`, `P0004`) and validation rule failures both surface in logs by default.
- **Auth time fields use Postgres interval notation** — `CookieValid: "14 days"`, `JwtExpire: "60 minutes"`, etc. The legacy integer fields (`CookieValidDays`, `JwtExpireMinutes`, …) are removed; startup fails with a migration message if they're still in your config. Finer-grained durations (seconds, minutes) are now possible. See the [migration table](/guide/changelog/v3.13.0#breaking-legacy-auth-time-integer-fields-removed).
- **Docker images now build on Ubuntu 26.04 LTS** — extending the security-update window from 9 months (25.04 interim) to 5 years.

For the complete release notes including NuGet upgrades and minor fixes, see the [v3.13.0 changelog](/guide/changelog/v3.13.0).

<BlogNav
  :get-started="[
    { text: 'Changelog v3.13.0', href: '/guide/changelog/v3.13.0' },
    { text: 'Cache Profiles Configuration', href: '/config/cache-options#cache-profiles' },
    { text: 'Authentication Schemes', href: '/config/auth#additional-authentication-schemes' },
    { text: 'Rate Limiter Partition', href: '/config/rate-limiter#per-user-rate-limiting-partition' },
    { text: 'Connection Pooler Compatibility', href: '/config/npgsqlrest#connection-pooler-compatibility' }
  ]"
/>

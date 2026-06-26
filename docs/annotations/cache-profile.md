---
outline: [2, 3]
title: "CACHE_PROFILE Annotation"
titleTemplate: NpgsqlRest
description: "Select a named cache profile defined in CacheOptions. Profiles let you mix multiple cache backends, dynamic TTLs, and conditional skip rules in one application."
head:
  - - meta
    - name: keywords
      content: npgsqlrest cache_profile, cache profiles, multiple cache backends, dynamic ttl, conditional caching, postgresql api cache profiles
  - - meta
    - property: og:title
      content: "NpgsqlRest CACHE_PROFILE Annotation"
  - - meta
    - property: og:description
      content: "Select a named cache profile to apply per-endpoint cache backend, expiration, and conditional skip rules."
  - - meta
    - property: og:type
      content: article
---

# CACHE_PROFILE

Select a named cache profile for an endpoint.

A cache profile bundles together a cache backend (Memory / Redis / Hybrid), a default expiration, the cache-key parameter list, and per-parameter conditional rules ("when X is null, bypass cache" or "when status='draft', cache 30 seconds"). Profiles are defined once in [Cache Options configuration](../config/cache-options#cache-profiles) and selected per endpoint via this annotation.

`@cache_profile` **implies caching** — you don't also need `@cached`. Both `@cached` and `@cache_expires` annotations remain valid; when present they override the profile's defaults.

## Syntax

```
@cache_profile <name>
```

The annotation accepts exactly one profile name. The name must match a profile defined in `CacheOptions.Profiles` and registered with `"Enabled": true`. Unknown names cause **startup to fail** with a single error listing every unresolved name and the offending endpoints.

## Examples

### Basic usage

```sql
create function get_dashboard()
returns json
language sql
begin atomic;
select dashboard_data();
end;

comment on function get_dashboard() is
'HTTP GET
@cache_profile fast_memory';
```

**Equivalent as a SQL file endpoint** (`sql/get-dashboard.sql`):

```sql
-- HTTP GET
-- @cache_profile fast_memory
select dashboard_data();
```

The `fast_memory` profile (defined in `CacheOptions.Profiles`) supplies the backend, expiration, and any conditional rules.

### Combined with cached / cache_expires

```sql
comment on function get_user_report(user_id int, year int) is
'HTTP GET
@cache_profile shared_redis
@cached user_id, year
@cache_expires 1 hour';
```

The annotations override the profile's defaults:
- `@cached user_id, year` → cache key uses these params (overrides profile's `Parameters` list).
- `@cache_expires 1 hour` → entry TTL is 1 hour (overrides profile's `Expiration`).

The profile still supplies the cache **backend** (Redis in this case) and any `When` rules.

### Shorter TTL when a parameter is null

A profile that shortens the cache TTL when no end date is supplied — the request asks for "until now" data, which changes constantly:

```jsonc
{
  "CacheOptions": {
    "Enabled": true,
    "Profiles": {
      "timeseries": {
        "Enabled": true,
        "Type": "Memory",
        "Expiration": "1 hour",
        "Parameters": ["_from", "_to"],
        "When": [
          { "Parameter": "_to", "Value": null, "Then": "5 minutes" }
        ]
      }
    }
  }
}
```

```sql
comment on function compute_timeseries(_from text, _to text default null) is
'HTTP GET
@cache_profile timeseries';
```

Behavior per request:
- Both `_from` and `_to` present → 1-hour cache (historical query, safe to cache long).
- `_to` is null → 5-minute cache (open-ended query; data may update at the matching cadence).

### Tiered TTL by user role

```jsonc
{
  "CacheOptions": {
    "Profiles": {
      "tier_aware": {
        "Enabled": true,
        "Type": "Hybrid",
        "Parameters": ["tier"],
        "When": [
          { "Parameter": "tier", "Value": "free",  "Then": "5 minutes" },
          { "Parameter": "tier", "Value": "pro",   "Then": "1 hour" },
          { "Parameter": "tier", "Value": "admin", "Then": "skip" }
        ]
      }
    }
  }
}
```

```sql
comment on function get_account_data(tier text) is
'HTTP GET
@cache_profile tier_aware';
```

- Free tier → cached 5 minutes.
- Pro tier → cached 1 hour.
- Admin tier → never cached (always fresh).

## Behavior

- `@cache_profile` implies `@cached` — explicit `@cached` is unnecessary.
- The profile's backend (its `Type`) is used instead of the root `CacheOptions` backend.
- The profile's `Expiration` is used unless overridden by `@cache_expires`.
- The profile's `Parameters` list is used as the default cache-key set unless overridden by `@cached <list>`.
- The profile's `When` rules are evaluated at request time; first match wins. Rules can `"skip"` (bypass cache) or override TTL with a PostgreSQL interval.
- Cache entries written under a profile are **prefixed with the profile name**, so two profiles sharing the same backend (e.g., two Memory profiles) cannot collide.
- The cache invalidation endpoint (when `InvalidateCacheSuffix` is configured) routes through the same profile backend.

## Validation

Misconfiguration is caught at startup:

| Problem | Result |
|---|---|
| Unknown profile name referenced by `@cache_profile` | Startup fails with single error listing every unresolved name + offending endpoints |
| Profile registered but no endpoint references it | Information-level log message |
| `When` rule references a parameter that's not in the cache-key list | Rule dropped at startup with Warning (other rules still apply) |
| Multiple `@cache_profile` arguments (e.g. `@cache_profile a b`) | Annotation ignored with Warning; one name only |

## Related

- [Cache Profiles configuration](../config/cache-options#cache-profiles) — full reference for profile fields and `When` rules
- [CACHED](./cached) — bare cached annotation (no profile)
- [CACHE_EXPIRES_IN](./cache-expires-in) — per-endpoint TTL override
- [Interval Format](./interval-format) — time/duration format reference

## See Also

- [Cache Options](/config/cache-options) — top-level cache backend and profile configuration

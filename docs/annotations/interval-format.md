---
outline: [2, 3]
title: "Interval Format Reference"
titleTemplate: NpgsqlRest
description: "Complete reference for time and duration formats used in NpgsqlRest annotations. Supported units, syntax variations, and examples."
head:
  - - meta
    - name: keywords
      content: npgsqlrest interval, time format, duration format, timeout format, cache expiration format, postgresql interval
  - - meta
    - property: og:title
      content: "NpgsqlRest Interval Format Reference"
  - - meta
    - property: og:description
      content: "Complete reference for time and duration formats used in NpgsqlRest annotations."
  - - meta
    - property: og:type
      content: article
---

# Interval Format Reference

Several NpgsqlRest annotations accept time or duration values. This page documents the supported interval format used throughout the system.

## Syntax

```
<number>[unit]
<number> [unit]
```

- **number**: Integer or decimal value (e.g., `30`, `1.5`, `0.25`)
- **unit**: Optional time unit suffix (defaults to seconds if omitted)
- **space**: Optional space between number and unit

## Supported Units

| Unit | Short | Long Forms |
|------|-------|------------|
| Microseconds | `us` | `usec`, `microsecond`, `microseconds` |
| Milliseconds | `ms` | `msec`, `millisecond`, `milliseconds` |
| Seconds | `s` | `sec`, `second`, `seconds` |
| Minutes | `m` | `min`, `minute`, `minutes` |
| Hours | `h` | `hour`, `hours` |
| Days | `d` | `day`, `days` |
| Weeks | `w` | `week`, `weeks` |

All unit names are **case-insensitive**: `5s`, `5S`, `5sec`, `5SEC`, `5Seconds` are all equivalent.

## Examples

### Short Form (Recommended)

```
30s          -- 30 seconds
5m           -- 5 minutes
1h           -- 1 hour
1d           -- 1 day
2w           -- 2 weeks
500ms        -- 500 milliseconds
1000us       -- 1000 microseconds
```

### Long Form

```
30seconds    -- 30 seconds
5minutes     -- 5 minutes
1hour        -- 1 hour
1day         -- 1 day
2weeks       -- 2 weeks
```

### With Space

```
30 s         -- 30 seconds
5 minutes    -- 5 minutes
1 hour       -- 1 hour
1 d          -- 1 day
```

### Decimal Values

```
1.5h         -- 1 hour 30 minutes
0.5d         -- 12 hours
2.5m         -- 2 minutes 30 seconds
500.5ms      -- 500.5 milliseconds
```

### No Unit (Defaults to Seconds)

```
30           -- 30 seconds
120          -- 120 seconds (2 minutes)
3600         -- 3600 seconds (1 hour)
1.5          -- 1.5 seconds
```

## Usage in Annotations

### @timeout / @command_timeout

Sets query execution timeout:

```sql
comment on function quick_lookup() is
'HTTP GET
@timeout 5s';

comment on function slow_report() is
'HTTP GET
@timeout 2min';

comment on function very_long_process() is
'HTTP GET
@timeout 1h';
```

::: warning Single Token for @timeout
The `@timeout` annotation reads only the **first token** after the keyword. Use formats without spaces or use the short forms to avoid parsing issues.
:::

### @cache_expires_in

Sets cache expiration time:

```sql
comment on function get_live_data() is
'HTTP GET
@cached
@cache_expires_in 10s';

comment on function get_dashboard() is
'HTTP GET
@cached
@cache_expires_in 5m';

comment on function get_static_config() is
'HTTP GET
@cached
@cache_expires_in 1d';
```

## Configuration Values

The same interval format is used in JSON configuration files:

```json
{
  "NpgsqlRest": {
    "CommandTimeout": "30s"
  },
  "CacheOptions": {
    "DefaultExpiration": "5m",
    "LocalCacheExpiration": "1m"
  },
  "Auth": {
    "JwtClockSkew": "5m"
  }
}
```

## Invalid Formats

The following formats are **not** supported:

```
5.5.5h       -- Multiple decimal points
h5           -- Unit before number
5 m m        -- Multiple units
5months      -- Unsupported unit
1year        -- Unsupported unit (use days or weeks)
```

## Related

- [COMMAND_TIMEOUT](./command-timeout) - Set query timeout
- [CACHE_EXPIRES_IN](./cache-expires-in) - Set cache expiration
- [Comment Annotations Guide](../guide/annotations) - How annotations work

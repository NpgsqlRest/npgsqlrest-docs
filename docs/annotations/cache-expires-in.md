---
outline: [2, 3]
title: "CACHE_EXPIRES_IN Annotation"
titleTemplate: NpgsqlRest
description: "Set cache expiration time for PostgreSQL REST API endpoints. Configure TTL for cached responses."
head:
  - - meta
    - name: keywords
      content: npgsqlrest cache expires, cache ttl, cache expiration, api cache duration, response cache timeout
  - - meta
    - property: og:title
      content: "NpgsqlRest CACHE_EXPIRES_IN Annotation"
  - - meta
    - property: og:description
      content: "Set cache expiration time for cached PostgreSQL REST API endpoints."
  - - meta
    - property: og:type
      content: article
---

# CACHE_EXPIRES_IN

::: info Also known as
`cache_expires` (with or without `@` prefix)
:::

Set cache expiration time for cached endpoints.

## Syntax

```
@cache_expires_in <interval>
```

Uses [interval format](./interval-format). Common examples:

| Format | Meaning |
|--------|---------|
| `10s` | 10 seconds |
| `5m` | 5 minutes |
| `1h` | 1 hour |
| `1d` | 1 day |
| `1w` | 1 week |

## Examples

### Short Cache (10 seconds)

```sql
comment on function get_live_data() is
'HTTP GET
@cached
@cache_expires_in 10s';
```

### Medium Cache (5 minutes)

```sql
comment on function get_dashboard_stats() is
'HTTP GET
@cached
@cache_expires_in 5m';
```

### Long Cache (1 hour)

```sql
comment on function get_static_config() is
'HTTP GET
@cached
@cache_expires_in 1h';
```

### Daily Cache

```sql
comment on function get_daily_report() is
'HTTP GET
@cached
@cache_expires_in 1d';
```

## Related

- [Interval Format](./interval-format) - Complete interval format reference
- [Cache Options configuration](../config/cache-options) - Configure cache backend
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [CACHED](./cached) - Enable caching

## See Also

- [Cache Options](/config/cache-options) - Configure cache backend and settings

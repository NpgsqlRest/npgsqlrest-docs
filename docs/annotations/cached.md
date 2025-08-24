---
outline: [2, 3]
title: "CACHED Annotation"
titleTemplate: NpgsqlRest
description: "Enable server-side response caching for PostgreSQL function results. Configure cache keys and expiration for improved performance."
head:
  - - meta
    - name: keywords
      content: npgsqlrest cached, response caching, api cache, postgresql cache, server side cache
  - - meta
    - property: og:title
      content: "NpgsqlRest CACHED Annotation"
  - - meta
    - property: og:description
      content: "Enable server-side response caching for PostgreSQL function results."
  - - meta
    - property: og:type
      content: article
---

# CACHED

Enable server-side response caching for routine results.

## Syntax

```
@cached
@cached <param1>, <param2>, <param3>, ...
```

Space-separated lists are also valid: `@cached _year _department`

Parameters specified become part of the cache key.

## Examples

### Simple Caching

```sql
create function get_app_settings()
returns json
language sql
begin atomic;
select settings from app_config where id = 1;
end;

comment on function get_app_settings() is
'HTTP GET
@cached';
```

### Cache Key by Parameter

```sql
create function get_user_profile(_user_id int)
returns json
language sql
begin atomic;
select row_to_json(u) from users u where id = _user_id;
end;

comment on function get_user_profile(int) is
'HTTP GET
@cached _user_id';
```

Different `_user_id` values create separate cache entries.

### Multiple Cache Key Parameters

```sql
create function get_report(_year int, _department text)
returns json
language sql
begin atomic;
...;
end;

comment on function get_report(int, text) is
'HTTP GET
@cached _year, _department';
```

### With Cache Expiration

Cache expiration uses [interval format](./interval-format):

```sql
comment on function get_config() is
'HTTP GET
@cached
@cache_expires_in 1h';
```

### Caching Set-Returning Functions

Caching works for set-returning functions and record types. When a cached function returns multiple rows, the entire result set is cached:

```sql
create function get_all_users()
returns table(id int, name text)
language sql
begin atomic;
select id, name from users;
end;

comment on function get_all_users() is
'HTTP GET
@cached
@cache_expires_in 5m';
```

Use `MaxCacheableRows` in [Cache Options](../config/cache-options) to limit the maximum number of rows that can be cached. Result sets exceeding this limit are returned but not cached.

## Behavior

- Caches the response for subsequent identical requests
- Works with scalar results, set-returning functions, and record types
- Cache key is based on specified parameters
- Use with `cache_expires_in` to set expiration time

## Cache Configuration

The `cached` annotation requires cache to be enabled in [Cache Options](../config/cache-options) configuration.

Two cache types are available:

| Type | Description | Use Case |
|------|-------------|----------|
| `Memory` | In-memory cache on the application server | Single instance deployments, development |
| `Redis` | Distributed cache using Redis | Multi-instance deployments, production |

Example configuration:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory"
  }
}
```

For Redis:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "RedisConfiguration": "localhost:6379"
  }
}
```

See [Cache Options](../config/cache-options) for complete configuration reference.

## Related

- [Interval Format](./interval-format) - Time/duration format reference
- [Cache Options configuration](../config/cache-options) - Configure cache backend (Memory or Redis)
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [CACHE_EXPIRES_IN](./cache-expires-in) - Set expiration time

## See Also

- [Cache Options](/config/cache-options) - Configure cache backend and settings

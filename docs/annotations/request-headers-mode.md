---
outline: [2, 3]
title: "REQUEST_HEADERS_MODE Annotation"
titleTemplate: NpgsqlRest
description: "Control how HTTP request headers are passed to PostgreSQL functions. Access headers via context or parameters."
head:
  - - meta
    - name: keywords
      content: npgsqlrest request headers, http headers postgresql, access request headers, headers to function, header mode
  - - meta
    - property: og:title
      content: "NpgsqlRest REQUEST_HEADERS_MODE Annotation"
  - - meta
    - property: og:description
      content: "Control how HTTP request headers are passed to PostgreSQL functions."
  - - meta
    - property: og:type
      content: article
---

# REQUEST_HEADERS_MODE (`request_headers`)

::: info Also known as
`request_headers` (with or without `@` prefix)
:::

Control how HTTP request headers are passed to the PostgreSQL function.

## Syntax

```
@request_headers_mode <mode>
@request_headers <mode>
```

## Values

| Value | Description |
|-------|-------------|
| `ignore` | Don't pass request headers to the function |
| `context` | Set headers as PostgreSQL context variable via `set_config()` |
| `parameter` | Pass headers to a function parameter as JSON |

## Examples

### Ignore Headers

```sql
comment on function simple_func() is
'HTTP GET
@request_headers_mode ignore';
```

### Pass as Context Variable

```sql
comment on function context_aware_func() is
'HTTP GET
@request_headers_mode context';
```

Headers accessible via: `current_setting('request.headers', true)`

### Pass as Parameter

```sql
create function with_headers(_data text, _headers json default null)
returns json
language sql
begin atomic;
...;
end;

comment on function with_headers(text, json) is
'HTTP POST
@request_headers_mode parameter';
```

**Equivalent as a SQL file endpoint** (`sql/with-headers.sql`):

```sql
/*
HTTP POST
@request_headers_mode parameter
@param $1 data
@param $2 _headers json default null
*/
select json_build_object('data', $1, 'headers', $2);
```

## Behavior

- Default mode is configured in `NpgsqlRest.RequestHeadersMode`
- `context` mode uses the key from `RequestHeadersContextKey` setting. The value is set the same way as the [user context](./user-context#how-the-context-reaches-postgresql): for functions, tables, views and single-statement SQL files it is sent together with the routine and is local to the request (since 4.0.0)
- `parameter` mode uses the parameter name from the `RequestHeadersParameterName` setting (default `_headers`); the parameter must be `json` or `text` and must have a default value
- In `parameter` mode the headers only fill the parameter when the request does not supply it: a client can send its own `headers` value instead. Don't base trust decisions on it (e.g. identity headers added by an authenticating gateway) — use `context` mode, which the client cannot override, or user claims.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default request headers mode
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [REQUEST_HEADERS_PARAMETER_NAME](./request-headers-parameter-name) - Set parameter name

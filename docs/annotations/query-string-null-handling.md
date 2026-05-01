---
outline: [2, 3]
title: "QUERY_STRING_NULL_HANDLING Annotation"
titleTemplate: NpgsqlRest
description: "Control NULL value interpretation in query string parameters. Configure empty string vs NULL handling for PostgreSQL APIs."
head:
  - - meta
    - name: keywords
      content: npgsqlrest null handling, query string null, empty string null, parameter null handling, api null values
  - - meta
    - property: og:title
      content: "NpgsqlRest QUERY_STRING_NULL_HANDLING Annotation"
  - - meta
    - property: og:description
      content: "Control how NULL values are interpreted in query string parameters."
  - - meta
    - property: og:type
      content: article
---

# QUERY_STRING_NULL_HANDLING

::: info Also known as
`query_null_handling`, `query_string_null`, `query_null` (with or without `@` prefix)
:::

Controls how clients can pass `NULL` values to PostgreSQL function parameters via query string.

Since query strings can only contain text values, there's no native way to represent SQL `NULL`. This annotation defines what query string value should be interpreted as `NULL`.

## Syntax

```
@query_null <mode>
@query_string_null_handling <mode>
```

## Values

| Value | Alias | Result |
|-------|-------|--------|
| `empty` | `empty_string` | Empty query string value (`?param=`) is interpreted as `NULL` |
| `null` | `null_literal` | Literal string `"null"` (`?param=null`) is interpreted as `NULL` |
| `ignore` | | No special NULL handling - values are passed as-is (default) |

## Behavior Explained

### Ignore Mode (Default)

By default (`ignore`), no special NULL handling is applied. Query string values are passed as-is to the function:

```
GET /api/func/?t=         →   _t = '' (empty string)
GET /api/func/?t=null     →   _t = 'null' (literal string "null")
GET /api/func/?t=hello    →   _t = 'hello'
```

If the parameter is not provided at all, the function receives `NULL`:

```
GET /api/func/            →   _t = NULL (parameter not provided)
```

### EmptyString Mode

When set to `empty_string` (or `empty`), an empty query string value is interpreted as SQL `NULL`:

```
GET /api/func/?t=         →   _t = NULL
GET /api/func/?t=null     →   _t = 'null' (literal string)
GET /api/func/?t=hello    →   _t = 'hello'
```

This allows clients to explicitly pass `NULL` by providing an empty value.

### NullLiteral Mode

When set to `null_literal` (or `null`), the literal string `"null"` (case-insensitive) is interpreted as SQL `NULL`:

```
GET /api/func/?t=null     →   _t = NULL
GET /api/func/?t=NULL     →   _t = NULL
GET /api/func/?t=         →   _t = '' (empty string)
GET /api/func/?t=hello    →   _t = 'hello'
```

This allows clients to explicitly pass `NULL` by providing the string "null".

## Examples

### Using Empty String for NULL

```sql
create function get_nullable_param(_t text)
returns text
language sql
begin atomic;
select _t;
end;

comment on function get_nullable_param(text) is '
@query_string_null_handling empty_string
';
```

**Equivalent as a SQL file endpoint** (`sql/get-nullable-param.sql`):

```sql
/*
HTTP GET
@query_string_null_handling empty_string
@param $1 t
*/
select $1;
```

| Request | Parameter Value |
|---------|-----------------|
| `GET /api/get-nullable-param/?t=` | `_t = NULL` |
| `GET /api/get-nullable-param/?t=hello` | `_t = 'hello'` |

### Using "null" String for NULL

```sql
create function get_data(_filter text)
returns text
language sql
begin atomic;
select _filter;
end;

comment on function get_data(text) is '
@query_string_null_handling null_literal
';
```

| Request | Parameter Value |
|---------|-----------------|
| `GET /api/get-data/?filter=null` | `_filter = NULL` |
| `GET /api/get-data/?filter=` | `_filter = ''` (empty string) |
| `GET /api/get-data/?filter=active` | `_filter = 'active'` |

### Default Behavior (No Special Handling)

```sql
create function search(_query text)
returns text
language sql
begin atomic;
select _query;
end;

comment on function search(text) is '
@query_string_null_handling ignore
';
```

| Request | Parameter Value |
|---------|-----------------|
| `GET /api/search/?query=` | `_query = ''` (empty string) |
| `GET /api/search/?query=null` | `_query = 'null'` (literal string) |
| `GET /api/search/` | `_query = NULL` (parameter omitted) |

## Path Parameters

::: tip New in 3.8.0
Path parameter interaction with `null_literal` mode was added in version 3.8.0.
:::

The `null_literal` mode also works with path parameters. When combined with [optional path parameters](./path#optional-path-parameters), you can pass NULL via the literal string `"null"` in the URL path:

```sql
create function get_item(p_id int default null)
returns text
language sql
begin atomic;
select p_id::text;
end;

comment on function get_item(int) is '
HTTP GET /items/{p_id}
query_string_null_handling null_literal
';
```

- `GET /items/5` → `p_id = 5`
- `GET /items/null` → `p_id = NULL`

## Configuration Default

You can set the default behavior for all endpoints in `appsettings.json`:

```json
{
  "NpgsqlRest": {
    "QueryStringNullHandling": "EmptyString"
  }
}
```

Available values: `Ignore` (default), `EmptyString`, `NullLiteral`.

This sets the default for all endpoints, which can then be overridden per-endpoint using comment annotations.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default null handling
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [REQUEST_PARAM_TYPE](./request-param-type) - Control parameter source
- [RESPONSE_NULL_HANDLING](./response-null-handling) - NULL in responses

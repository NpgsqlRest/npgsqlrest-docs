---
outline: [2, 3]
title: "PATH Annotation"
titleTemplate: NpgsqlRest
description: "Set custom URL paths for PostgreSQL REST API endpoints. Override default naming conventions with custom routes."
head:
  - - meta
    - name: keywords
      content: npgsqlrest path, custom url path, api routing, endpoint path, custom route postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest PATH Annotation"
  - - meta
    - property: og:description
      content: "Set custom URL paths for PostgreSQL REST API endpoints with custom routes."
  - - meta
    - property: og:type
      content: article
---

# PATH

Set a custom endpoint path. Alternative to specifying the path in the HTTP annotation.

## Keywords

`@path`, `path`

## Syntax

```
@path <url-path>
```

## Examples

### Custom Path

```sql
create function get_user_data()
returns json
language sql
begin atomic;
...;
end;

comment on function get_user_data() is
'HTTP GET
@path /users/data';
```

**Equivalent as a SQL file endpoint** (`sql/get-user-data.sql`):

```sql
-- HTTP GET
-- @path /users/data
select row_to_json(u) from users u where id = current_user_id();
```

Creates: `GET /users/data`

### Path with HTTP Method

```sql
comment on function my_function() is
'HTTP GET
@path /custom/endpoint';
```

Creates: `GET /custom/endpoint`

### Versioned API

```sql
comment on function get_users_v2() is
'HTTP GET
@path /api/v2/users';
```

## Path Parameters

Paths can include parameter placeholders using the `{param}` syntax. Parameter values are extracted directly from the URL path.

### Basic Path Parameter

```sql
create function get_user(user_id int)
returns json
language sql
begin atomic;
...;
end;

comment on function get_user(int) is
'HTTP GET
@path /users/{user_id}';
```

Call: `GET /users/42` → `user_id = 42`

### Nested Path Parameters

```sql
create function get_user_order(user_id int, order_id int)
returns json
language sql
begin atomic;
...;
end;

comment on function get_user_order(int, int) is
'HTTP GET
@path /users/{user_id}/orders/{order_id}';
```

Call: `GET /users/42/orders/123` → `user_id = 42`, `order_id = 123`

### Parameter Name Matching

Parameter names in `{param}` can use either:
- PostgreSQL snake_case name: `{user_id}`
- Converted camelCase name: `{userId}`

Matching is case-insensitive.

### Optional Path Parameters

::: tip New in 3.8.0
Optional path parameters were added in version 3.8.0.
:::

Path parameters support the ASP.NET Core optional parameter syntax `{param?}`. When a path parameter is marked as optional and the corresponding PostgreSQL function parameter has a default value, omitting the URL segment will use the PostgreSQL default:

```sql
create function get_item(p_id int default 42)
returns text
language sql
begin atomic;
select p_id::text;
end;

comment on function get_item(int) is '
HTTP GET /items/{p_id?}
';
```

- `GET /items/5` → uses the provided value `5`
- `GET /items/` → uses the PostgreSQL default `42`

This also works with [`query_string_null_handling null_literal`](./query-string-null-handling) to pass NULL via the literal string `"null"` in the path for any parameter type:

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

- `GET /items/null` → passes SQL NULL to the function

## Behavior

- Overrides the auto-generated path
- Path should start with `/` for absolute paths
- Can be used alongside HTTP annotation
- Path parameters can be combined with query string or body parameters
- Optional path parameters (`{param?}`) use the PostgreSQL default when the URL segment is omitted

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure URL prefixes, naming conventions
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [HTTP](./http) - Define endpoint (can also set path)

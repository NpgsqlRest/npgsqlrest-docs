---
outline: [2, 3]
title: "HTTP Annotation"
titleTemplate: NpgsqlRest
description: "Expose PostgreSQL functions, procedures, and SQL files as HTTP endpoints. Configure HTTP methods (GET, POST, PUT, DELETE) and custom URL paths."
head:
  - - meta
    - name: keywords
      content: npgsqlrest http annotation, postgresql http endpoint, rest api function, http method postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest HTTP Annotation"
  - - meta
    - property: og:description
      content: "Expose PostgreSQL functions, procedures, and SQL files as HTTP endpoints with configurable methods and paths."
  - - meta
    - property: og:type
      content: article
---

# HTTP

Expose a PostgreSQL function, procedure, or SQL file as an HTTP endpoint.

## Keywords

`http`

## Syntax

```
HTTP
HTTP <method>
HTTP <path>
HTTP <method> <path>
```

**method**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`

**path**: Custom URL path (must start with `/` or be a relative path)

## CommentsMode Requirement

The `HTTP` annotation behavior depends on the [CommentsMode](../config/npgsqlrest#comments-mode) configuration setting:

| Mode | HTTP Annotation Behavior |
|------|--------------------------|
| `OnlyWithHttpTag` | **Required** - Endpoints are only created for routines with `HTTP` in their comment (default). |
| `ParseAll` | Optional - All routines become endpoints; `HTTP` can customize method/path. |
| `Ignore` | Ignored - All routines become endpoints; comments are not parsed. |

With the default `OnlyWithHttpTag` mode, a function without the `HTTP` annotation will not be exposed as an endpoint.

## Default Behavior

When method is not specified:
- `GET` for non-volatile functions, or names starting with `get_`, containing `_get_`, or ending with `_get`
- `POST` for all other functions

When path is not specified, it's generated from the function name using the configured URL prefix and naming conventions.

## Examples

### Basic Endpoint

```sql
create function get_status()
returns text
language sql
begin atomic;
select 'OK';
end;

comment on function get_status() is 'HTTP';
```

**Equivalent as a SQL file endpoint** (`sql/get-status.sql`):

```sql
-- HTTP
select 'OK';
```

Creates: `GET /api/get-status`

### Explicit HTTP Method

```sql
create function create_user(_name text)
returns int
language sql
begin atomic;
insert into users(name) values(_name) returning id;
end;

comment on function create_user(text) is 'HTTP POST';
```

Creates: `POST /api/create-user`

### Custom Path

```sql
create function get_all_users()
returns setof users
language sql
begin atomic;
select * from users;
end;

comment on function get_all_users() is 'HTTP GET /users';
```

Creates: `GET /users`

### Method and Custom Path

```sql
create function search_products(_query text)
returns setof products
language sql
begin atomic;
select * from products where name ilike '%' || _query || '%';
end;

comment on function search_products(text) is 'HTTP GET /products/search';
```

Creates: `GET /products/search`

### Multi-line with Documentation

```sql
comment on function get_user_profile(int) is
'Returns the complete user profile including preferences.
Used by the frontend dashboard.

HTTP GET /users/profile';
```

The documentation text is ignored; only the `HTTP` line is parsed.

### Unrecognized Method Becomes Path

```sql
comment on function my_endpoint() is 'HTTP custom-endpoint';
```

Since `custom-endpoint` is not a valid HTTP method, it's treated as a path:

Creates: `POST /custom-endpoint`

## Path Parameters

You can define RESTful path parameters using the `{param}` syntax in URL paths. Parameter values are extracted directly from the URL path instead of query strings or request body.

### Single Path Parameter

```sql
create function get_product(p_id int)
returns text
language sql
begin atomic;
select ...;
end;

comment on function get_product(int) is 'HTTP GET /products/{p_id}';
```

Call: `GET /products/123` → `p_id = 123`

### Multiple Path Parameters

```sql
create function get_review(p_id int, review_id int)
returns text
language sql
begin atomic;
select ...;
end;

comment on function get_review(int, int) is 'HTTP GET /products/{p_id}/reviews/{review_id}';
```

Call: `GET /products/5/reviews/10` → `p_id = 5`, `review_id = 10`

### Path Parameters with Query String

```sql
create function get_product_details(p_id int, include_reviews boolean default false)
returns text
language sql
begin atomic;
select ...;
end;

comment on function get_product_details(int, boolean) is 'HTTP GET /products/{p_id}/details';
```

Call: `GET /products/42/details?includeReviews=true` → `p_id = 42`, `include_reviews = true`

### Path Parameters with JSON Body

```sql
create function update_product(p_id int, new_name text)
returns text
language sql
begin atomic;
select ...;
end;

comment on function update_product(int, text) is 'HTTP POST /products/{p_id}';
```

Call: `POST /products/7` with body `{"newName": "New Name"}` → `p_id = 7`, `new_name = "New Name"`

### Path Parameter Key Features

- Parameter names in `{param}` can use either the PostgreSQL name (`{p_id}`) or the converted camelCase name (`{pId}`), matching is case-insensitive
- Works with all HTTP methods (GET, POST, PUT, DELETE)
- Can be combined with query string parameters (GET/DELETE) or JSON body parameters (POST/PUT)
- Supports all parameter types (int, text, uuid, bigint, etc.)
- Zero performance impact on endpoints without path parameters

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure URL prefixes, naming conventions
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [PATH](./path) - Alternative way to set custom path
- [AUTHORIZE](./authorize) - Require authentication
- [REQUEST_PARAM_TYPE](./request-param-type) - Control parameter source

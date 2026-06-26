---
outline: [2, 3]
title: "Comment Annotations Guide"
titleTemplate: NpgsqlRest
description: "Configure REST API endpoints using PostgreSQL comments. Learn HTTP methods, authorization, caching, rate limiting, and other annotations to control your API behavior."
head:
  - - meta
    - name: keywords
      content: npgsqlrest annotations, postgresql comment api, declarative rest api, postgresql http comments, sql api configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Comment Annotations Guide"
  - - meta
    - property: og:description
      content: "Configure REST API endpoints using PostgreSQL comments. HTTP methods, authorization, caching, and more."
  - - meta
    - property: og:type
      content: article
---

# Comment Annotations Guide

NpgsqlRest uses comment annotations to configure API endpoints declaratively. Annotations work in two places:

- **PostgreSQL functions/procedures** — via the built-in [COMMENT](https://www.postgresql.org/docs/current/sql-comment.html) system (`COMMENT ON FUNCTION ...`)
- **SQL files** — via standard SQL comments (`--` line comments and `/* */` block comments) directly in `.sql` files. See the [SQL File Endpoints Guide](./sql-files).

All annotations work identically in both contexts. This guide explains how they work and how to use them effectively.

## How Annotations Work

Comment annotations are special keywords placed in comments that control how endpoints are generated and configured. The annotation parser reads comments line by line, looking for recognized keywords at the start of each line.

### Basic Rules

1. **Annotations must start at the beginning of a line** - the keyword must be the first text on the line
2. **Keywords are case-insensitive** - `HTTP`, `http`, and `Http` are all valid
3. **Unrecognized text is ignored** - you can mix documentation with annotations
4. **Multiple annotations per comment** - use separate lines for each annotation

### Optional `@` Prefix

NpgsqlRest-specific annotations support an optional `@` prefix. This follows the `.http` file convention that many developers are familiar with from tools like REST Client extensions in VS Code. Using the `@` prefix is recommended for better visual distinction, but both syntaxes work identically:

```sql
-- With @ prefix (recommended, follows .http file convention)
comment on function my_func() is '
HTTP GET
@authorize
@cached
@raw';

-- Without @ prefix (still works the same)
comment on function my_func() is '
HTTP GET
authorize
cached
raw';

-- Mixed (both work together)
comment on function my_func() is '
HTTP GET
@authorize
cached
@timeout 30s';
```

The `@` prefix also works with annotation parameters using the `key = value` syntax:

```sql
-- Both syntaxes are equivalent
comment on function my_func() is '
HTTP GET
raw = true
timeout = 30s
my_custom_param = custom_value
';

-- With @ prefix
comment on function my_func() is '
HTTP GET
@raw = true
@timeout = 30s
@my_custom_param = custom_value
';
```

Custom parameters with `@` prefix are stored without the prefix (e.g., `@my_param = value` is stored as `my_param`).

::: tip
The `@` prefix is purely optional. All existing code without `@` continues to work unchanged. Choose whichever style you prefer, or mix them freely.
:::

::: info HTTP Headers Don't Use @
HTTP RFC standard annotations (headers with `Name: value` syntax like `Content-Type: application/json`) do **not** use the `@` prefix - they follow the standard HTTP header format.
:::

### Simple Example

```sql
comment on function get_users() is
'Returns all active users from the database.
HTTP GET
@authorize';
```

This comment contains:
- Documentation text (ignored by parser)
- `HTTP GET` annotation - exposes as GET endpoint
- `@authorize` annotation - requires authentication

## The HTTP Annotation

The `HTTP` annotation is the primary way to expose a function or table as an endpoint. Without it (under the client's default `CommentsMode: OnlyAnnotated` — or its identical-behavior alias `OnlyWithHttpTag`, the library default), the object won't be exposed — unless a loaded plugin annotation requests an endpoint (e.g. [`@mcp`](../annotations/mcp), which can create an MCP-only routine with no HTTP route).

### Syntax Variations

```sql
-- Basic: expose with default method and path
comment on function my_func() is 'HTTP';

-- With HTTP method
comment on function my_func() is 'HTTP GET';
comment on function my_func() is 'HTTP POST';

-- With custom path
comment on function my_func() is 'HTTP /custom-path';

-- With method and path
comment on function my_func() is 'HTTP GET /users/list';
```

### Default Behavior

When method is not specified:
- `GET` is used for non-volatile functions, or functions with names starting with `get_`, containing `_get_`, or ending with `_get`
- `POST` is used otherwise

When path is not specified, it's generated from the function name using the URL prefix and naming conventions from configuration.

## Authorization Annotations

Control access to endpoints with authorization annotations.

### Require Authentication

```sql
-- Require any authenticated user
comment on function protected_func() is
'HTTP
@authorize';

-- Require specific roles
comment on function admin_func() is
'HTTP
@authorize admin';

-- Multiple roles (user must have at least one)
comment on function staff_func() is
'HTTP
@authorize admin, manager, supervisor';
```

### Role List Syntax

When specifying multiple roles, you can use either **comma-separated** or **space-separated** values - both work identically:

```sql
-- Comma-separated (traditional)
comment on function staff_func() is 'HTTP
@authorize admin, manager, supervisor';

-- Space-separated (also valid)
comment on function staff_func() is 'HTTP
@authorize admin manager supervisor';

-- Mixed (works too)
comment on function staff_func() is 'HTTP
@authorize admin, manager supervisor';
```

This flexibility applies to any annotation that accepts a list of values.

### Allow Anonymous Access

```sql
comment on function public_func() is
'HTTP
@allow_anonymous';
```

This overrides the global `RequiresAuthorization` setting for this specific endpoint.

## Response Headers

Set custom response headers by using the `Header-Name: value` format:

```sql
comment on function get_html_page() is
'HTTP GET
Content-Type: text/html
Cache-Control: public, max-age=3600';

comment on function get_data() is
'HTTP GET
X-Custom-Header: custom-value
X-Another-Header: another-value';
```

Multiple headers with the same name are supported:

```sql
comment on function with_cookies() is
'HTTP
Set-Cookie: session=abc123
Set-Cookie: theme=dark';
```

## Request Parameter Configuration

Control how parameters are transmitted to the endpoint.

### Query String vs Body

```sql
-- Force query string parameters
comment on function search(_query text) is
'HTTP GET
@request_param_type query_string';

-- Force JSON body parameters
comment on function create_user(_name text, _email text) is
'HTTP POST
@request_param_type body_json';
```

## Caching

Enable server-side response caching (scalar, record, and set results):

```sql
-- Simple caching
comment on function get_settings() is
'HTTP GET
@cached';

-- Cache with specific parameters as cache key
comment on function get_user_profile(_user_id int) is
'HTTP GET
@cached _user_id';

-- Set cache expiration
comment on function get_config() is
'HTTP GET
@cached
@cache_expires_in 1h';
```

Cache expiration uses PostgreSQL interval format: `10s`, `5m`, `1h`, `1d`, etc.

## Raw Output Mode

Return raw text instead of JSON:

```sql
-- Basic raw mode
comment on function export_text() is
'HTTP GET
@raw';

-- CSV export with custom formatting
comment on function export_csv() is
'HTTP GET
@raw
@separator ,
@new_line \n
@columns';
```

The `@columns` annotation includes column names as the first row.

## Combining Annotations

Annotations can be combined freely. Order doesn't matter:

```sql
comment on function get_report(_department text) is
'Generates a department report.
This is a cached endpoint requiring manager access.

HTTP GET /reports/department
@authorize manager, admin
@cached _department
@cache_expires_in 30m
Content-Type: application/json
Cache-Control: private, max-age=1800';
```

Note how NpgsqlRest-specific annotations use the `@` prefix while HTTP headers (`Content-Type`, `Cache-Control`) use the standard RFC format.

## Debugging Annotations

To see which annotations are applied when NpgsqlRest starts, set the logging level to Debug:

**In appsettings.json:**
```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Debug"
    }
  }
}
```

**Via command line:**
```bash
npgsqlrest --Log:MinimalLevels:NpgsqlRest=Debug
```

This will log each annotation as it's parsed and applied to endpoints.

## Comments Mode

The `CommentsMode` configuration setting controls how annotations affect endpoint creation:

| Mode | Behavior |
|------|----------|
| `OnlyAnnotated` | Only create endpoints for objects with an `HTTP` annotation or a plugin annotation that requests an endpoint, such as `@mcp` (default; `OnlyWithHttpTag` is an identical-behavior alias) |
| `ParseAll` | Create all endpoints, parse annotations to modify them |
| `Ignore` | Create all endpoints, ignore all annotations |

## Time/Duration Formats

Several annotations accept time or duration values (e.g., `@timeout`, `@cache_expires_in`). See the complete [Interval Format Reference](../annotations/interval-format) for all supported units and syntax.

### Quick Reference

| Unit | Short | Long Forms |
|------|-------|------------|
| Milliseconds | `ms` | `msec`, `millisecond`, `milliseconds` |
| Seconds | `s` | `sec`, `second`, `seconds` |
| Minutes | `m` | `min`, `minute`, `minutes` |
| Hours | `h` | `hour`, `hours` |
| Days | `d` | `day`, `days` |
| Weeks | `w` | `week`, `weeks` |

### Examples

```sql
-- Using short forms (recommended)
@timeout 30s
@timeout 5min
@cache_expires_in 1h

-- Decimals are supported
@timeout 1.5h      -- 1 hour 30 minutes
@timeout 500ms     -- half a second

-- Numbers without unit default to seconds
@timeout 30        -- 30 seconds
```

::: warning Single Token Requirement for @timeout
The `@timeout` annotation reads only the **first token** after the keyword. Use formats without spaces to avoid parsing issues.

```sql
-- Use single-token formats
@timeout 5min
@timeout 5m
@timeout 300s
```
:::

## Common Patterns

### Public Read, Protected Write

```sql
comment on function get_products() is
'HTTP GET
@allow_anonymous';

comment on function create_product(_name text, _price numeric) is
'HTTP POST
@authorize admin';
```

### API Versioning with Custom Paths

```sql
comment on function get_users_v1() is 'HTTP GET /v1/users';
comment on function get_users_v2() is 'HTTP GET /v2/users';
```

### Secure Sensitive Operations

```sql
comment on function change_password(_old text, _new text) is
'HTTP POST
@authorize
@sensitive';
```

The `@sensitive` annotation prevents parameter values from appearing in logs.

### Nested JSON for Composite Types

```sql
comment on function get_user_with_address() is
'HTTP GET
@nested';
```

The `@nested` annotation serializes composite type columns as nested JSON objects instead of expanding their fields into separate columns. See the [NESTED annotation reference](../annotations/nested) for details.

### Rate Limiting

```sql
comment on function expensive_operation() is
'HTTP POST
@rate_limiter bucket';
```

The policy name must match a policy configured in the [Rate Limiter configuration](../config/rate-limiter).

## Next Steps

- [Annotations Reference](../annotations/) - Complete reference of all annotations
- [NpgsqlRest Options](../config/npgsqlrest) - Configure default endpoint behavior
- [Authentication](../config/auth) - Configure authentication providers
- [Logging](../config/logging) - Configure logging levels

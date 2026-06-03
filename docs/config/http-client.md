---
outline: [2, 3]
title: "HTTP Client Options"
titleTemplate: NpgsqlRest
description: "Configure HTTP Types for calling external APIs from PostgreSQL functions. Make HTTP requests to external services directly from SQL with response handling."
head:
  - - meta
    - name: keywords
      content: npgsqlrest http client, postgresql http request, external api postgresql, sql http call, http types postgresql, call api from sql
  - - meta
    - property: og:title
      content: "NpgsqlRest HTTP Client Options"
  - - meta
    - property: og:description
      content: "Configure HTTP Types for calling external APIs directly from PostgreSQL functions."
  - - meta
    - property: og:type
      content: article
---

# HTTP Client Options

Configuration for HTTP Types - composite types that enable PostgreSQL functions to make HTTP requests to external APIs.

## Overview

```json
{
  "NpgsqlRest": {
    "HttpClientOptions": {
      "Enabled": false,
      "ResponseStatusCodeField": "status_code",
      "ResponseBodyField": "body",
      "ResponseHeadersField": "headers",
      "ResponseContentTypeField": "content_type",
      "ResponseSuccessField": "success",
      "ResponseErrorMessageField": "error_message",
      "CacheEnabled": true,
      "MaxCacheEntries": 10000,
      "CachePruneIntervalSeconds": 60
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable HTTP client functionality for annotated composite types. |
| `ResponseStatusCodeField` | string | `"status_code"` | Field name for HTTP response status code. |
| `ResponseBodyField` | string | `"body"` | Field name for HTTP response body content. |
| `ResponseHeadersField` | string | `"headers"` | Field name for HTTP response headers (as JSON). |
| `ResponseContentTypeField` | string | `"content_type"` | Field name for Content-Type header value. |
| `ResponseSuccessField` | string | `"success"` | Field name for success flag (true for 2xx status codes). |
| `ResponseErrorMessageField` | string | `"error_message"` | Field name for error message if request failed. |
| `CacheEnabled` | bool | `true` | Global kill switch for HTTP type response caching. When `false`, the [`@cache`](../annotations/http-type#response-caching) directive on individual types is ignored and every request fires a fresh outbound call. Caching is still opt-in per type. |
| `MaxCacheEntries` | int | `10000` | Maximum number of distinct cached HTTP responses held in memory. Once full, new responses are not cached (existing entries are still served and expire normally). |
| `CachePruneIntervalSeconds` | int | `60` | Interval in seconds at which expired cached HTTP responses are pruned from memory. |

## How HTTP Types Work

HTTP Types allow PostgreSQL functions to make HTTP requests to external APIs. When a function parameter uses a composite type with an HTTP definition comment, NpgsqlRest automatically:

1. Parses the HTTP definition from the type comment
2. Substitutes placeholders with function parameter values
3. Executes the HTTP request
4. Populates the type fields with response data
5. Executes the PostgreSQL function with the populated parameter

## Creating an HTTP Type

### Step 1: Create a Composite Type

Create a composite type with fields matching the response field names:

```sql
create type weather_api as (
    body text,
    status_code int,
    headers json,
    content_type text,
    success boolean,
    error_message text
);
```

### Step 2: Add HTTP Definition Comment

Add an HTTP definition as a comment on the type (RFC 7230 format):

```sql
comment on type weather_api is 'GET https://api.weather.com/v1/current?city={_city}
Authorization: Bearer {_api_key}
@timeout 30s';
```

### Step 3: Use in a Function

Create a function with the HTTP type as a parameter:

```sql
create function get_weather(
  _city text,
  _api_key text,
  _req weather_api
)
returns json
language plpgsql
as $$
begin
    if (_req).success then
        return (_req).body::json;
    else
        return json_build_object('error', (_req).error_message);
    end if;
end;
$$;
```

**Equivalent as a SQL file endpoint** (`sql/get-weather.sql`):

The HTTP Type itself must be defined in DDL (it's a composite type). The endpoint that consumes it can be a SQL file:

```sql
/*
HTTP GET
@param $1 city
@param $2 api_key
@param $3 req weather_api
*/
select case
    when ($3::weather_api).success then ($3::weather_api).body::json
    else json_build_object('error', ($3::weather_api).error_message)
end;
```

## HTTP Definition Format

The comment on the composite type follows a simplified HTTP message format similar to `.http` files:

```
METHOD URL [HTTP/version]
Header-Name: Header-Value
...

[request body]
```

### Supported Methods

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`

### Example Definitions

**Simple GET request:**

```sql
comment on type api_response is 'GET https://api.example.com/data';
```

**GET with headers:**

```sql
comment on type api_response is 'GET https://api.example.com/data
Authorization: Bearer {_token}
Accept: application/json';
```

**POST with body:**

```sql
comment on type api_response is 'POST https://api.example.com/users
Content-Type: application/json

{"name": "{_name}", "email": "{_email}"}';
```

## Timeout Directives

Timeout can be specified before or after the request line using [interval format](../annotations/interval-format):

```sql
-- Before request line
comment on type api_response is 'timeout 30
GET https://api.example.com/data';

-- After headers
comment on type api_response is 'GET https://api.example.com/data
Authorization: Bearer {_token}
@timeout 30s';
```

Common timeout formats:

| Format | Example | Description |
|--------|---------|-------------|
| Seconds (integer) | `timeout 30` | 30 seconds |
| Seconds with suffix | `timeout 30s` | 30 seconds |
| TimeSpan format | `timeout 00:00:30` | 30 seconds |
| With @ prefix | `@timeout 2min` | 2 minutes |

## Response Fields

The composite type fields are automatically populated based on their names:

| Field Name | Type | Description |
|------------|------|-------------|
| `body` | `text` | Response body content |
| `status_code` | `int` or `text` | HTTP status code (e.g., 200, 404) |
| `headers` | `json` | Response headers as JSON object |
| `content_type` | `text` | Content-Type header value |
| `success` | `boolean` | True for 2xx status codes |
| `error_message` | `text` | Error message if request failed |

You can customize field names via `HttpClientOptions` configuration if your type uses different names.

## Placeholder Substitution

URLs, headers, and request body can contain placeholders in the format `{parameter_name}`. These placeholders are automatically replaced with the values of other function parameters that share the same name.

```sql
-- Type with placeholders
comment on type weather_api is 'GET https://api.weather.com/v1/current?city={_city}
Authorization: Bearer {_api_key}
@timeout 30s';

-- Function with matching parameter names
create function get_weather(
  _city text,        -- Value substitutes {_city} placeholder
  _api_key text,     -- Value substitutes {_api_key} placeholder
  _req weather_api   -- HTTP type parameter (receives response)
)
returns json
...
```

When calling `GET /api/get-weather?_city=London&_api_key=secret123`, NpgsqlRest will:

1. Substitute `{_city}` with `London` and `{_api_key}` with `secret123`
2. Make the HTTP request to `https://api.weather.com/v1/current?city=London` with header `Authorization: Bearer secret123`
3. Populate the `_req` parameter fields with the response data
4. Execute the PostgreSQL function

## Complete Example

### Configuration

```json
{
  "NpgsqlRest": {
    "HttpClientOptions": {
      "Enabled": true
    }
  }
}
```

### SQL Setup

```sql
-- Create response type
create type github_api as (
    body text,
    status_code int,
    headers json,
    content_type text,
    success boolean,
    error_message text
);

-- Define HTTP request
comment on type github_api is 'GET https://api.github.com/users/{_username}
Accept: application/vnd.github.v3+json
User-Agent: NpgsqlRest
@timeout 10s';

-- Create function
create function get_github_user(
    _username text,
    _response github_api
)
returns json
language plpgsql
as $$
begin
    if (_response).success then
        return (_response).body::json;
    else
        return json_build_object(
            'error', true,
            'status', (_response).status_code,
            'message', (_response).error_message
        );
    end if;
end;
$$;

comment on function get_github_user(text, github_api) is 'HTTP GET /github/user';
```

### Usage

```
GET /github/user/octocat
```

Returns the GitHub user data or an error response.

## Resolved Parameter Expressions

A placeholder in an outgoing request (e.g. `Authorization: Bearer {_token}`) often needs a value the client must **not** supply — a DB-stored API token, a claim-derived secret. A **resolved parameter expression** (`param = <sql>` on the function) computes that value server-side per request and binds it to the parameter, which then substitutes into the URL/headers/body. It never originates from, or is overridable by, the client.

```sql
comment on type my_api_response is 'GET https://api.example.com/data
Authorization: Bearer {_token}';

comment on function get_secure_data(_user_id int, _req my_api_response, _token text) is '
_token = select api_token from user_tokens where user_id = {_user_id}
';
```

A call to `GET /api/get-secure-data/?user_id=42` resolves `_token` from the database (parameterized as `$1 = 42`), substitutes it into the `Authorization` header, and makes the request — the token never leaves the server.

A `{name}` placeholder can also be filled from a request parameter or an [allowlisted environment variable](../annotations/parameter-substitution#environment-variables) (good for a static API key); a resolved expression is for values computed server-side per request.

::: tip Full reference
See **[Resolved Parameters](../annotations/resolved-parameters)** for behavior (server-side only, NULL handling, multiple expressions, ordering, `user_params`), the DB-stored / refresh-token pattern, and how it compares to the other placeholder sources.
:::

## Retry Logic

When using HTTP Client Types, outgoing HTTP requests to external APIs can fail transiently — rate limiting (429), temporary server errors (503), network timeouts. The `@retry_delay` directive adds configurable automatic retries with delays.

### Syntax

```sql
-- Retry on any failure (non-2xx status, timeout, or network error):
comment on type my_api_type is '@retry_delay 1s, 2s, 5s
GET https://api.example.com/data';

-- Retry only on specific HTTP status codes:
comment on type my_api_type is '@retry_delay 1s, 2s, 5s on 429, 503
GET https://api.example.com/data';

-- Combined with timeout:
comment on type my_api_type is 'timeout 10s
@retry_delay 1s, 2s, 5s on 429, 503
GET https://api.example.com/data';
```

The delay list defines both the **number of retries** and the **delay before each retry**. `1s, 2s, 5s` means 3 retries with 1-second, 2-second, and 5-second delays respectively. Delay values use the same format as `timeout` — `100ms`, `1s`, `5m`, `30`, `00:00:01`, etc.

### Behavior

- **Without `on` filter**: Retries on any non-success HTTP response, timeout, or network error.
- **With `on` filter**: Retries only when the HTTP response status code matches one of the listed codes (e.g., `429, 503`). Timeouts and network errors always trigger retry regardless of the filter.
- **Retry exhaustion**: If all retries fail, the last error is passed to the PostgreSQL function — the same as if retries were not configured.
- **Unexpected exceptions**: Non-HTTP errors (e.g., invalid URL) are never retried.
- **Parallel execution**: Each HTTP type in a function retries independently within its own parallel task.

### Example

```sql
create type rate_limited_api as (body json, status_code int, error_message text);
comment on type rate_limited_api is '@retry_delay 1s, 2s, 5s on 429, 503
GET https://api.example.com/data
Authorization: Bearer {_token}';

create function get_rate_limited_data(
    _token text,
    _req rate_limited_api
)
returns table (body json, status_code int, error_message text)
language plpgsql as $$
begin
    return query select (_req).body, (_req).status_code, (_req).error_message;
end;
$$;
```

If the external API returns 429 (rate limited), the request is automatically retried after 1s, then 2s, then 5s. If it returns 400 (bad request), no retry occurs and the error is returned immediately.

## Response Caching

The `@cache` directive caches the outbound HTTP response and reuses it for matching requests within a time window, instead of calling the upstream on every request:

```sql
create type books_api as (body text, status_code int, success boolean);
comment on type books_api is '@cache 5m
GET https://books.toscrape.com/';
```

A cached type fires **one outbound call** for a given request shape; subsequent matching requests are served from an in-memory cache until the TTL elapses. For a type with no per-request placeholders, that means a single shared upstream call per TTL window across the whole application.

- **Opt-in, GET only.** Caching happens only when `@cache` is present; a `@cache` on a non-GET method is ignored with a startup warning.
- **TTL.** `@cache <interval>` uses the same [interval format](../annotations/interval-format) as `@timeout` (`30s`, `5m`, `1h`, `00:05:00`, or a bare number of seconds). A bare `@cache` caches with no expiration (until the process restarts) and warns.
- **Successful responses only.** Only `2xx` responses are cached, so a transient upstream failure is never pinned for the whole TTL.
- **Stampede protection.** A burst of concurrent requests for the same key coalesces into a single outbound call.
- **Cache key** = method + resolved URL + resolved content-type + resolved headers + resolved body, so distinct resolved requests are cached separately.

Caching is controlled by the `CacheEnabled`, `MaxCacheEntries`, and `CachePruneIntervalSeconds` settings above. See the [`@cache` directive reference](../annotations/http-type#response-caching) for full details.

## Self-Referencing Calls (Relative Paths)

HTTP client type definitions support **relative paths** that call back to the same NpgsqlRest server instance instead of external URLs:

```sql
create type api_users as (body text);
comment on type api_users is 'GET /api/users';

create type api_orders as (body text);
comment on type api_orders is 'GET /api/orders';
```

### Parallel Query Composition

Combined with HTTP client types executing all requests in parallel (`Task.WhenAll`), this enables a single endpoint to fan out to multiple internal endpoints simultaneously:

```sql
create function get_dashboard(
    _users api_users,
    _orders api_orders
) returns json language plpgsql as $$
begin
    return json_build_object('users', (_users).body::json, 'orders', (_orders).body::json);
end;
$$;
-- One request → two parallel internal calls → combined response
```

### Zero HTTP Overhead

Self-referencing calls bypass the HTTP stack entirely — the endpoint handler is invoked directly in-process via `InternalRequestHandler`. No TCP connection, no HTTP parsing, no serialization overhead. Performance is microseconds instead of milliseconds per internal call.

Use cases:
- Parallel data aggregation across multiple queries
- Orchestrating multiple mutations in a single request
- Composing responses from several independent data sources

### Internal-Only Endpoints

Combine with the [`@internal` annotation](../annotations/internal) to create endpoints accessible only via self-referencing calls but not exposed as public HTTP routes:

```sql
comment on function helper_data() is 'HTTP GET
@internal';
-- Direct HTTP call → 404. Internal call via HTTP client type → works.
```

## Related

- [HTTP Type annotation](../annotations/http-type) - HTTP Type comment format reference
- [INTERNAL annotation](../annotations/internal) - Mark endpoints as internal-only
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings
- [Connection Settings](./connection) - Configure database connections

## See Also

- [HTTP_TYPE](/annotations/http-type) - HTTP Type comment format reference

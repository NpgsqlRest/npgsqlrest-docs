---
outline: [2, 3]
title: "HTTP Types Annotation"
titleTemplate: NpgsqlRest
description: "Define HTTP requests on PostgreSQL composite types. Enable SQL functions to call external APIs with automatic request/response handling."
head:
  - - meta
    - name: keywords
      content: npgsqlrest http types, postgresql http request, call external api sql, http composite type, sql to http
  - - meta
    - property: og:title
      content: "NpgsqlRest HTTP Types Annotation"
  - - meta
    - property: og:description
      content: "Define HTTP requests on composite types for calling external APIs from PostgreSQL."
  - - meta
    - property: og:type
      content: article
---

# HTTP CUSTOM TYPES

Define HTTP request on a composite type to enable PostgreSQL functions to make HTTP requests to external APIs.

## Overview

HTTP Types are PostgreSQL composite types with a special comment that defines an HTTP request. When a function uses an HTTP Type as a parameter, NpgsqlRest automatically makes the HTTP request and populates the type fields with the response before executing the function.

## Syntax

The HTTP definition is added as a comment on the composite type:

```
[@timeout directive]
[@retry_delay directive]
[@cache directive]
METHOD URL [HTTP/version]
Header-Name: Header-Value
...
[@timeout directive]
[@retry_delay directive]
[@cache directive]

[request body]
```

Directives (`@timeout`, `@retry_delay`, `@cache`) may appear either **before** the request line or **after** the headers — both placements are equivalent.

## Supported Methods

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`

## Examples

### Basic GET Request

```sql
-- Create response type
create type simple_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

-- Define HTTP request
comment on type simple_api is 'GET https://api.example.com/data';

-- Use in function
create function fetch_data(_response simple_api)
returns text
language sql
begin atomic;
select (_response).body;
end;
```

**Equivalent as a SQL file endpoint** (`sql/fetch-data.sql`):

The HTTP Type itself must be defined in DDL (it's a composite type), but the consuming endpoint can be a SQL file. Assuming `simple_api` is already defined as above:

```sql
/*
HTTP GET
@param $1 response simple_api
*/
select ($1::simple_api).body;
```

### GET with Headers and Placeholders

```sql
create type weather_api as (
    body text,
    status_code int,
    headers json,
    content_type text,
    success boolean,
    error_message text
);

comment on type weather_api is 'GET https://api.weather.com/v1/current?city={_city}
Authorization: Bearer {_api_key}
Accept: application/json
@timeout 30s';

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

### POST with Request Body

```sql
create type create_user_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type create_user_api is 'POST https://api.example.com/users
Content-Type: application/json
Authorization: Bearer {_token}
@timeout 10s

{"name": "{_name}", "email": "{_email}"}';

create function create_user(
    _name text,
    _email text,
    _token text,
    _response create_user_api
)
returns json
language plpgsql
as $$
begin
    if (_response).success then
        return (_response).body::json;
    else
        raise exception 'Failed to create user: %', (_response).error_message;
    end if;
end;
$$;
```

### Multiple API Calls

A function can have multiple HTTP Type parameters for chained API calls:

```sql
create type auth_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

create type data_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type auth_api is 'POST https://auth.example.com/token
Content-Type: application/x-www-form-urlencoded

client_id={_client_id}&client_secret={_client_secret}';

comment on type data_api is 'GET https://api.example.com/data
Authorization: Bearer {_token}';

create function fetch_with_auth(
    _client_id text,
    _client_secret text,
    _auth auth_api,
    _token text,
    _data data_api
)
returns json
language plpgsql
as $$
begin
    -- Note: _token would need to be extracted from _auth.body in practice
    if not (_auth).success then
        return json_build_object('error', 'Authentication failed');
    end if;

    if (_data).success then
        return (_data).body::json;
    else
        return json_build_object('error', (_data).error_message);
    end if;
end;
$$;
```

## Response Fields

The composite type fields are populated based on their names:

| Field Name | Type | Description |
|------------|------|-------------|
| `body` | `text` | Response body content |
| `status_code` | `int` or `text` | HTTP status code (e.g., 200, 404) |
| `headers` | `json` | Response headers as JSON object |
| `content_type` | `text` | Content-Type header value |
| `success` | `boolean` | True for 2xx status codes |
| `error_message` | `text` | Error message if request failed |

Field names are configurable via [HTTP Client Options](../config/http-client).

## Timeout Directives

Timeout uses [interval format](./interval-format):

| Format | Example |
|--------|---------|
| Seconds (integer) | `@timeout 30` |
| Seconds with suffix | `@timeout 30s` |
| TimeSpan format | `@timeout 00:00:30` |
| Minutes | `@timeout 2min` |
| Without @ prefix | `timeout 30s` |

Timeout can appear before the request line or after headers:

```sql
-- Before request line
comment on type api_type is 'timeout 30
GET https://api.example.com/data';

-- After headers
comment on type api_type is 'GET https://api.example.com/data
Authorization: Bearer {_token}
@timeout 30s';
```

## Placeholder Substitution

Placeholders in the format `{name}` are replaced via the shared [Parameter Value Substitution](./parameter-substitution) mechanism (case-insensitive name matching, NULL → empty, unknown → left literal). For HTTP types the type's own field names are also valid placeholders. A `{name}` can be supplied by any of three sources:

- a **request/function parameter** (shown below);
- an **allowlisted [environment variable](./parameter-substitution#environment-variables)** — ideal for a static API key, without routing it through a parameter (e.g. `Authorization: Bearer {WEATHER_API_KEY}`);
- a **[resolved parameter expression](./resolved-parameters)** — a value computed server-side from SQL (e.g. a token read from a table), never supplied by the client.

```sql
comment on type api_type is 'GET https://api.example.com/users/{_user_id}/posts?limit={_limit}
Authorization: Bearer {_token}';

create function get_user_posts(
    _user_id int,       -- Substitutes {_user_id}
    _limit int,         -- Substitutes {_limit}
    _token text,        -- Substitutes {_token}
    _response api_type  -- Receives HTTP response
)
...
```

Placeholders work in:
- URL path and query string
- Header values
- Request body

## Retry Logic

The `@retry_delay` directive adds automatic retries with configurable delays for transient failures:

```sql
-- Retry on any failure:
comment on type my_api_type is '@retry_delay 1s, 2s, 5s
GET https://api.example.com/data';

-- Retry only on specific HTTP status codes:
comment on type my_api_type is '@retry_delay 1s, 2s, 5s on 429, 503
GET https://api.example.com/data';

-- Combined with timeout:
comment on type my_api_type is '@timeout 10s
@retry_delay 1s, 2s, 5s on 429, 503
GET https://api.example.com/data';
```

The delay list defines both the **number of retries** and the **delay before each retry**. `1s, 2s, 5s` means 3 retries with 1s, 2s, and 5s delays respectively. Delay values use the same format as `timeout` — `100ms`, `1s`, `5m`, `30`, `00:00:01`, etc.

- **Without `on` filter**: Retries on any non-success HTTP response, timeout, or network error.
- **With `on` filter**: Retries only when the status code matches a listed code. Timeouts and network errors always trigger retry.
- **Retry exhaustion**: If all retries fail, the last error is passed to the function.

## Response Caching

The `@cache` directive caches the outbound HTTP response and reuses it for matching requests within a time window, instead of calling the upstream on every request:

```sql
comment on type books_api is '@cache 5m
GET https://books.toscrape.com/';
```

A cached type fires **one outbound call** for a given request shape; subsequent matching requests are served from an in-memory cache until the TTL elapses. For a type with no per-request placeholders (a constant URL, headers, and body), that means a single shared upstream call per TTL window across the whole application — rather than one call per inbound request.

```sql
-- TTL accepts the same interval formats as @timeout:
comment on type t is '@cache 30s
GET https://api.example.com/data';

comment on type t is '@cache 5m
GET https://api.example.com/data';

comment on type t is '@cache 00:05:00
GET https://api.example.com/data';

-- Combined with other directives (order and placement are flexible):
comment on type t is '@timeout 10s
@retry_delay 1s, 2s on 429, 503
@cache 5m
GET https://api.example.com/data';
```

**Behavior and rules:**

- **Opt-in, per type.** Caching happens only when `@cache` is present. Without it, every request fires a fresh call (the previous behavior).
- **GET only.** A `@cache` directive on any non-GET method is ignored with a startup warning — caching a mutating request is almost always a mistake.
- **TTL.** `@cache <interval>` uses the [interval format](./interval-format) (`30s`, `5m`, `1h`, `00:05:00`, or a bare number of seconds). A bare `@cache` (no interval) caches with no expiration — until the process restarts — and logs a warning.
- **Successful responses only.** Only `2xx` responses are cached, so a transient upstream failure is never pinned for the whole TTL; the next request re-fetches.
- **Stampede protection.** A burst of concurrent requests for the same cache key coalesces into a **single** outbound call; the rest await the in-flight result.
- **Cache key.** The key is the HTTP method + resolved URL + resolved content-type + resolved headers + resolved body. [Placeholders](#placeholder-substitution) are resolved first, so per-request values vary the key naturally — each distinct resolved request is cached separately.

Caching is configured globally under [`HttpClientOptions`](../config/http-client) (`CacheEnabled` kill switch, `MaxCacheEntries`, `CachePruneIntervalSeconds`).

## Resolved Parameter Expressions

A common need with HTTP Types is a value computed **server-side** — an API token read from a table, a secret derived from the user's claims — injected into a `{name}` placeholder without the client ever supplying it. A **resolved parameter expression** does this: a `param = <sql>` annotation on the **function** runs that SQL per request and binds the result to the parameter, which then substitutes into the URL/headers/body.

```sql
comment on type my_api_response is 'GET https://api.example.com/data
Authorization: Bearer {_token}';

comment on function get_secure_data(_user_id int, _req my_api_response, _token text) is '
_token = select api_token from user_tokens where user_id = {_user_id}
';
```

The server resolves `_token` from the database, substitutes it into the `Authorization` header, and makes the call — the token never leaves the server or appears in client input.

See **[Resolved Parameters](./resolved-parameters)** for the full reference (behavior, security, multiple expressions, table/refresh-token patterns).

## Behavior

- HTTP Types require `HttpClientOptions.Enabled = true` in configuration
- The HTTP request is made before the PostgreSQL function executes
- All function parameters (except the HTTP Type itself) are available for placeholder substitution
- Multiple HTTP Type parameters in one function result in multiple HTTP requests
- Errors are captured in `error_message` field rather than raising exceptions

## Related

- [HTTP Custom Types Guide](../guide/http-types) — the full walkthrough
- [Interval Format](./interval-format) - Time/duration format reference
- [HTTP Client Options](../config/http-client) - Configure HTTP client settings
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [HTTP](./http) - Expose function as HTTP endpoint
- [COMMAND_TIMEOUT](./command-timeout) - Set PostgreSQL command timeout

## See Also

- [HTTP Client Config](/config/http-client) - Configure HTTP client settings

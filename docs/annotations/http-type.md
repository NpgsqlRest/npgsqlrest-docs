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
METHOD URL [HTTP/version]
Header-Name: Header-Value
...
[@timeout directive]
[@retry_delay directive]

[request body]
```

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

Placeholders in the format `{parameter_name}` are replaced with function parameter values:

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

## Resolved Parameter Expressions

When using HTTP Types, sensitive values like API tokens can be resolved server-side via SQL expressions defined in **function** comment annotations. The resolved values are used in placeholder substitution but never appear in or originate from the client request.

If a comment annotation on the function uses `key = value` syntax where the key matches a function parameter name, the value is treated as a SQL expression:

```sql
create type my_api_response as (body json, status_code int);
comment on type my_api_response is 'GET https://api.example.com/data
Authorization: Bearer {_token}';

create function get_secure_data(
    _user_id int,
    _req my_api_response,
    _token text default null
)
returns table (body json, status_code int)
language plpgsql as $$
begin
    return query select (_req).body, (_req).status_code;
end;
$$;
comment on function get_secure_data(int, my_api_response, text) is '
_token = select api_token from user_tokens where user_id = {_user_id}
';
```

The client calls `GET /api/get-secure-data/?user_id=42`. The server resolves `_token` from the database, substitutes it into the `Authorization` header, and makes the HTTP call. The token never leaves the server.

- **Server-side only**: Cannot be overridden by client input.
- **Parameterized execution**: Placeholders are converted to `$N` parameters to prevent SQL injection.
- **Works with user_params**: Can reference parameters auto-filled from JWT claims.

See [HTTP Client Options](../config/http-client#resolved-parameter-expressions) for full details.

## Behavior

- HTTP Types require `HttpClientOptions.Enabled = true` in configuration
- The HTTP request is made before the PostgreSQL function executes
- All function parameters (except the HTTP Type itself) are available for placeholder substitution
- Multiple HTTP Type parameters in one function result in multiple HTTP requests
- Errors are captured in `error_message` field rather than raising exceptions

## Related

- [Interval Format](./interval-format) - Time/duration format reference
- [HTTP Client Options](../config/http-client) - Configure HTTP client settings
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [HTTP](./http) - Expose function as HTTP endpoint
- [COMMAND_TIMEOUT](./command-timeout) - Set PostgreSQL command timeout

## See Also

- [HTTP Client Config](/config/http-client) - Configure HTTP client settings

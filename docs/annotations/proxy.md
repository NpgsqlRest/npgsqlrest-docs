---
outline: [2, 3]
title: "PROXY Annotation"
titleTemplate: NpgsqlRest
description: "Create reverse proxy endpoints that forward requests to upstream services. Transform responses with PostgreSQL functions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest proxy, reverse proxy postgresql, upstream service, api gateway, proxy annotation
  - - meta
    - property: og:title
      content: "NpgsqlRest PROXY Annotation"
  - - meta
    - property: og:description
      content: "Create reverse proxy endpoints that forward requests to upstream services."
  - - meta
    - property: og:type
      content: article
---

# PROXY

::: info Also known as
`reverse_proxy` (with or without `@` prefix)
:::

Mark endpoint as a reverse proxy that forwards requests to an upstream service.

## Syntax

```
@proxy
@proxy [ host_url ]
@proxy [ http_method ]
@proxy [ http_method ] [ host_url ]
```

## Description

The `proxy` annotation marks an endpoint as a reverse proxy. When a request arrives, NpgsqlRest forwards it to an upstream service and either returns the response directly (passthrough mode) or passes it to your PostgreSQL function for processing (transform mode).

## How the target URL is built

This is the most important thing to understand about `@proxy`. The function still becomes a normal NpgsqlRest endpoint with its usual URL (auto-generated from the function name, or whatever you set with `HTTP <method> <path>`). When a request hits that endpoint, NpgsqlRest builds the upstream URL by **appending the incoming request path and query string to the host**:

```
target URL = host + incoming request path + incoming query string
```

The `host` is the value from the annotation (`@proxy https://...`) if present, otherwise the global `ProxyOptions.Host`. The path is **not** the function name directly — it is the actual path the client used to reach the endpoint (which, by default, is derived from the function name).

::: tip Walkthrough: what does the basic example call?

```sql
create function get_external_data()
returns void
language sql
begin atomic;
select;
end;

comment on function get_external_data() is 'HTTP GET
@proxy';
```

With the default configuration below:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "https://api.example.com"
    }
  }
}
```

1. The function is exposed at its default endpoint: **`GET /api/get-external-data/`**.
2. A client calls `GET /api/get-external-data/?id=42` on your NpgsqlRest server.
3. NpgsqlRest forwards it to the host with the **same path and query** appended:

   **`GET https://api.example.com/api/get-external-data/?id=42`**

4. The upstream response is streamed straight back to the client (passthrough — no database connection is opened).

So `@proxy` alone is a *mirror*: it forwards each request to the same path on a different host. To forward to a **different** path, either change the endpoint path (`HTTP GET /v1/data`, which then forwards to `https://api.example.com/v1/data`) or use an absolute/relative URL in the annotation (see [URL Resolution](#url-resolution) below).
:::

::: warning Host is required
If neither the annotation nor `ProxyOptions.Host` provides a host, the endpoint responds with **`500`** and `"Proxy host is not configured."` The bare `@proxy` form only works when `ProxyOptions.Host` is set.
:::

::: tip Automatic parameters are forwarded too
On top of the verbatim path and query, any **server-filled** parameters — user claims, IP address, [HTTP Custom Type](./http-type) fields, and [resolved-parameter expressions](./resolved-parameters) — are forwarded to the upstream in the endpoint's native shape (query string or JSON body, per [`RequestParamType`](./request-param-type)). See [Automatic Parameter Forwarding](../config/proxy#automatic-parameter-forwarding).
:::

## Basic Usage

### Passthrough Mode

For simple proxy forwarding without database processing:

```sql
create function get_external_data()
returns void
language sql
begin atomic;
select;
end;

comment on function get_external_data() is 'HTTP GET
@proxy';
```

**Equivalent as a SQL file endpoint** (`sql/get-external-data.sql`):

```sql
-- HTTP GET
-- @proxy
select;
```

When the function has no proxy response parameters, the upstream response is returned directly to the client without opening a database connection. The function body itself (`select;`) is never executed — it exists only to declare the endpoint and its annotations.

### Transform Mode

To process the upstream response in PostgreSQL, add one or more **proxy response parameters** to the function. Their presence is what switches the endpoint from passthrough into transform mode:

```sql
create function get_and_transform(
    _proxy_status_code int default null,
    _proxy_body text default null,
    _proxy_headers json default null,
    _proxy_content_type text default null,
    _proxy_success boolean default null,
    _proxy_error_message text default null
)
returns json
language plpgsql as $$
begin
    if not _proxy_success then
        return json_build_object('error', _proxy_error_message);
    end if;
    return json_build_object(
        'status', _proxy_status_code,
        'data', _proxy_body::json
    );
end;
$$;

comment on function get_and_transform(int, text, json, text, boolean, text) is 'HTTP GET
@proxy';
```

In transform mode the order of operations is: forward the request to the upstream → collect the response → **execute the PostgreSQL function with the response values bound to its proxy parameters** → return the function's result to the client. The function output (not the raw upstream response) is what the client receives.

## Proxy Annotations

### Basic Proxy with Default Host

Uses the host from `ProxyOptions.Host` configuration:

```sql
-- function form
comment on function my_func() is 'HTTP GET
@proxy';
```

```sql
-- sql/my-func.sql (SQL file form)
-- HTTP GET
-- @proxy
select;
```

### Proxy with Custom Host

Override the default host:

```sql
-- function form
comment on function my_func() is 'HTTP GET
@proxy https://api.example.com';
```

```sql
-- sql/my-func.sql (SQL file form)
-- HTTP GET
-- @proxy https://api.example.com
select;
```

### Proxy with Custom HTTP Method

Override the upstream HTTP method (uses default host from configuration):

```sql
-- function form
comment on function my_func() is 'HTTP GET
@proxy POST';
```

```sql
-- sql/my-func.sql (SQL file form)
-- HTTP GET
-- @proxy POST
select;
```

### Combined Method and Host

Specify both HTTP method and host:

```sql
-- function form
comment on function my_func() is 'HTTP GET
@proxy POST https://api.example.com';
```

```sql
-- sql/my-func.sql (SQL file form)
-- HTTP GET
-- @proxy POST https://api.example.com
select;
```

### Self-Referencing Proxy (Relative Path)

Use a relative path starting with `/` to proxy to another endpoint on the same server:

```sql
-- function form
comment on function my_func() is 'HTTP GET
@proxy POST /api/data-source';
```

```sql
-- sql/my-func.sql (SQL file form)
-- HTTP GET
-- @proxy POST /api/data-source
select;
```

Self-referencing calls bypass the HTTP stack entirely — the target endpoint handler is invoked directly in-process with zero network overhead.

## URL Resolution

The proxy target host is resolved with the following priority:

1. **Annotation URL** — if the annotation includes a URL (absolute or relative), it is used. The global `ProxyOptions.Host` is **ignored**.
2. **Global `ProxyOptions.Host`** — used only when the annotation has no URL (e.g., `@proxy` or `@proxy POST`).

In every case **except a relative self-call**, the incoming request path and query string are then appended to the resolved host (`host + request path + query`). For relative self-calls (host starting with `/`), the annotation path *is* the full target and the incoming path is not appended.

| Annotation | `ProxyOptions.Host` | Resolved Target | Self-Call? |
|---|---|---|---|
| `@proxy` | `https://api.example.com` | `https://api.example.com` + request path | No |
| `@proxy POST` | `https://api.example.com` | `https://api.example.com` + request path | No |
| `@proxy https://other.com` | `https://api.example.com` | `https://other.com` + request path | No |
| `@proxy POST /api/data` | `https://api.example.com` | `/api/data` (internal) | **Yes** |
| `@proxy /api/data` | `https://api.example.com` | `/api/data` (internal) | **Yes** |
| `@proxy /api/data` | `null` | `/api/data` (internal) | **Yes** |

::: warning Important
A relative path in the annotation (starting with `/`) **always** creates a self-referencing internal call, regardless of the `ProxyOptions.Host` setting. The global host is never prepended to relative paths.
:::

## Response Parameters

When the PostgreSQL function has parameters whose names match the configured proxy parameter names, the upstream response data is bound to them after the request returns:

| Parameter Name | Type | Description |
|----------------|------|-------------|
| `_proxy_status_code` | `int` or `text` | HTTP status code from upstream (e.g., 200, 404). Bound as text if the parameter is declared `text`/`varchar`, otherwise as an integer. |
| `_proxy_body` | `text` | Response body content. `null` if empty. |
| `_proxy_headers` | `json` | Response headers as a JSON object. |
| `_proxy_content_type` | `text` | Content-Type header value. |
| `_proxy_success` | `boolean` | `true` for 2xx status codes. |
| `_proxy_error_message` | `text` | Error message if the request failed (timeout, connection error, etc.); `null` otherwise. |

### How parameters are mapped

- **Matched by name, not position.** Each parameter is identified by its name (case-insensitive), so order and placement in the signature are irrelevant. You can mix proxy parameters freely with regular parameters.
- **Declare only the ones you need.** None of the six are required — include just the parameters your function uses. The presence of *any* one of them is what puts the endpoint in transform mode.
- **Not read from the request.** Proxy response parameters are never supplied by the caller — NpgsqlRest sets a placeholder before the upstream call and overwrites it with the real value afterwards, then passes it to the function. Declaring them with `default null` (as in the examples) is the recommended convention: it documents intent and keeps the function directly callable from SQL.
- **Regular parameters work as usual.** Any non-proxy parameter (e.g. `city`, `report_id`) is bound from the request (query string, body, route) exactly like a normal endpoint, and is available to the function. For `@proxy`, those request values are also forwarded to the upstream as part of the forwarded path/query/body.
- **The names are configurable.** Override them under `ProxyOptions` (`ResponseStatusCodeParameter`, `ResponseBodyParameter`, `ResponseHeadersParameter`, `ResponseContentTypeParameter`, `ResponseSuccessParameter`, `ResponseErrorMessageParameter`) if the defaults clash with your own parameter names.

### Custom parameter names

For example, to drop the `_proxy_` prefix, configure the names you want:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "https://api.example.com",
      "ResponseStatusCodeParameter": "status",
      "ResponseBodyParameter": "body",
      "ResponseSuccessParameter": "ok"
    }
  }
}
```

The function then uses those names instead of the defaults:

```sql
create function get_and_transform(
    status int default null,
    body text default null,
    ok boolean default null
)
returns json
language plpgsql as $$
begin
    if not ok then
        return json_build_object('error', 'upstream failed');
    end if;
    return json_build_object('status', status, 'data', body::json);
end;
$$;

comment on function get_and_transform(int, text, boolean) is 'HTTP GET
@proxy';
```

## Examples

### API Gateway Pattern

Forward requests to different microservices:

```sql
-- Users service
create function users_api()
returns void
language sql
begin atomic;
select;
end;

comment on function users_api() is 'HTTP GET /api/users
@proxy https://users-service.internal:8080';

-- Orders service
create function orders_api()
returns void
language sql
begin atomic;
select;
end;

comment on function orders_api() is 'HTTP GET /api/orders
@proxy https://orders-service.internal:8080';
```

### Data Enrichment

Fetch external data and enrich it with local data:

```sql
create function get_enriched_weather(
    city text,
    _proxy_status_code int default null,
    _proxy_body text default null,
    _proxy_success boolean default null
)
returns json
language plpgsql as $$
declare
    local_data json;
begin
    -- Get local city preferences
    select json_build_object('favorite', is_favorite, 'notes', notes)
    into local_data
    from user_city_preferences
    where city_name = city;

    if not _proxy_success then
        return json_build_object('error', 'Weather API unavailable');
    end if;

    return json_build_object(
        'weather', _proxy_body::json,
        'local', coalesce(local_data, '{}'::json)
    );
end;
$$;

comment on function get_enriched_weather(text, int, text, boolean) is 'HTTP GET /v1/current
@proxy https://api.weather.com';
```

A client request to `GET /v1/current?city=London` is forwarded to **`https://api.weather.com/v1/current?city=London`** — the endpoint path and the incoming query string are appended to the host. The `city` value also populates the `city` parameter so it is available to the function for the local lookup.

::: warning No URL templating
The annotation host is used **literally** — there is no `{city}`-style substitution. Dynamic values reach the upstream only through the forwarded request path and query string (and, optionally, [user_parameters](#proxy-with-user-parameters)). Do not put placeholders like `?city={city}` in the host; they are forwarded verbatim.
:::

### Authenticated Proxy with User Context

Use NpgsqlRest as an authenticating gateway: it verifies the caller, then forwards the request to a protected upstream service along with the caller's identity as HTTP headers. This is a passthrough proxy — the function does no work, so it needs no body and no proxy parameters:

```sql
create function secure_api_call()
returns void
language sql
begin atomic;
select;
end;

comment on function secure_api_call() is 'HTTP GET
@authorize
@user_context
@proxy https://secure-api.internal/data';
```

On a **proxy** endpoint, `@user_context` adds the caller's identity to the **upstream request as HTTP headers**: the claims JSON, the client IP, and one header per entry in `ContextKeyClaimsMapping` (e.g. `request.user_id`, `request.user_name`, `request.user_roles`). The upstream can trust these headers because the request was authenticated by the gateway, so it never re-authenticates.

In this passthrough example the function never runs, so header forwarding is the only effect. In [transform mode](#transform-mode) the function *does* run, and there `@user_context` additionally sets the usual PostgreSQL session context for it — so the function can read the caller's identity while the upstream still receives the headers.

### Proxy with User Parameters

Forward user claims to the upstream as query string parameters:

```sql
create function proxy_with_user(
    _user_id text default null,    -- filled from the caller's user-id claim by @user_params,
                                   -- then forwarded to the upstream as ?userId=...
    _proxy_body text default null
)
returns json language plpgsql as $$
begin
    -- _user_id is sent to the upstream automatically; the function reads only the response here.
    return _proxy_body::json;
end;
$$;

comment on function proxy_with_user(text, text) is 'HTTP GET
@authorize
@user_params
@proxy https://api.internal/user-data';
```

With `@user_params`, `_user_id` is populated from the authenticated user's claim (not from the request) and appended to the upstream URL using the camelCase form of the parameter name. A call to `GET /api/proxy-with-user/` is forwarded to:

**`GET https://api.internal/user-data/api/proxy-with-user/?userId=<claim value>`**

The function may also read `_user_id` directly if it needs the value — but it doesn't have to for the value to reach the upstream.

## Configuration

Enable proxy functionality in your configuration:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "https://api.example.com",
      "DefaultTimeout": "30 seconds"
    }
  }
}
```

See [Proxy Options](../config/proxy) for complete configuration reference.

## Related

- [Proxy Endpoints Guide](../guide/proxy) — the full walkthrough
- [PROXY_OUT](./proxy-out) - Execute function first, then forward result to upstream (post-execution proxy)
- [Proxy Options](../config/proxy) - Proxy configuration reference
- [user_context](./user-context) - Enable user context forwarding
- [user_parameters](./user-parameters) - Enable user parameters forwarding
- [authorize](./authorize) - Require authentication
- [HTTP](./http) - Expose function as HTTP endpoint

## See Also

- [Proxy Config](/config/proxy) - Configure proxy options and settings

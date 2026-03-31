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

When the function has no proxy response parameters, the upstream response is returned directly to the client without opening a database connection.

### Transform Mode

To process the upstream response in PostgreSQL:

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

## Proxy Annotations

### Basic Proxy with Default Host

Uses the host from `ProxyOptions.Host` configuration:

```sql
comment on function my_func() is '@proxy';
```

### Proxy with Custom Host

Override the default host:

```sql
comment on function my_func() is '@proxy https://api.example.com';
```

### Proxy with Custom HTTP Method

Override the upstream HTTP method (uses default host from configuration):

```sql
comment on function my_func() is '@proxy POST';
```

### Combined Method and Host

Specify both HTTP method and host:

```sql
comment on function my_func() is '@proxy POST https://api.example.com';
```

### Self-Referencing Proxy (Relative Path)

Use a relative path starting with `/` to proxy to another endpoint on the same server:

```sql
comment on function my_func() is '@proxy POST /api/data-source';
```

Self-referencing calls bypass the HTTP stack entirely — the target endpoint handler is invoked directly in-process with zero network overhead.

## URL Resolution

The proxy target URL is resolved with the following priority:

1. **Annotation URL** — if the annotation includes a URL (absolute or relative), it is used. The global `ProxyOptions.Host` is **ignored**.
2. **Global `ProxyOptions.Host`** — used only when the annotation has no URL (e.g., `@proxy` or `@proxy POST`).

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

When the PostgreSQL function has parameters matching these names (configurable in `ProxyOptions`), the proxy response data is passed to the function:

| Parameter Name | Type | Description |
|----------------|------|-------------|
| `_proxy_status_code` | `int` | HTTP status code from upstream (e.g., 200, 404). |
| `_proxy_body` | `text` | Response body content. |
| `_proxy_headers` | `json` | Response headers as JSON object. |
| `_proxy_content_type` | `text` | Content-Type header value. |
| `_proxy_success` | `boolean` | True for 2xx status codes. |
| `_proxy_error_message` | `text` | Error message if request failed. |

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

comment on function get_enriched_weather(text, int, text, boolean) is 'HTTP GET
@proxy https://api.weather.com/v1/current?city={city}';
```

### Authenticated Proxy with User Context

Forward authenticated requests with user information:

```sql
create function secure_api_call(
    _proxy_status_code int default null,
    _proxy_body text default null
)
returns json language plpgsql as $$
begin
    return json_build_object('status', _proxy_status_code, 'data', _proxy_body);
end;
$$;

comment on function secure_api_call(int, text) is 'HTTP GET
@authorize
@user_context
@proxy https://secure-api.internal/data';
```

User context values are forwarded as HTTP headers to the upstream service.

### Proxy with User Parameters

Forward user claims as query parameters:

```sql
create function proxy_with_user(
    _user_id text default null,
    _proxy_body text default null
)
returns json language plpgsql as $$
begin
    return _proxy_body::json;
end;
$$;

comment on function proxy_with_user(text, text) is 'HTTP GET
@authorize
@user_params
@proxy https://api.internal/user-data';
```

The `_user_id` parameter value is forwarded to the upstream as `?userId=...`.

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

- [PROXY_OUT](./proxy-out) - Execute function first, then forward result to upstream (post-execution proxy)
- [Proxy Options](../config/proxy) - Proxy configuration reference
- [user_context](./user-context) - Enable user context forwarding
- [user_parameters](./user-parameters) - Enable user parameters forwarding
- [authorize](./authorize) - Require authentication
- [HTTP](./http) - Expose function as HTTP endpoint

## See Also

- [Proxy Config](/config/proxy) - Configure proxy options and settings

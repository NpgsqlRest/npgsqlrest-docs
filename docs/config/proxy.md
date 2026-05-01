---
outline: [2, 3]
title: "Proxy Options"
titleTemplate: NpgsqlRest
description: "Configure reverse proxy for NpgsqlRest. Forward requests to upstream services, cache responses in PostgreSQL, transform API responses with SQL functions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest proxy, postgresql reverse proxy, api gateway postgresql, upstream service proxy, transform mode proxy, passthrough proxy
  - - meta
    - property: og:title
      content: "NpgsqlRest Proxy Options"
  - - meta
    - property: og:description
      content: "Configure reverse proxy to forward requests, cache responses, and transform API data with PostgreSQL."
  - - meta
    - property: og:type
      content: article
---

# Proxy Options

Reverse proxy configuration for NpgsqlRest endpoints. When an endpoint is marked as a proxy, incoming HTTP requests are forwarded to an upstream service, and the response can either be returned directly to the client (passthrough mode) or processed by the PostgreSQL function (transform mode).

## Overview

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": false,
      "Host": null,
      "DefaultTimeout": "00:00:30",
      "ForwardHeaders": true,
      "ExcludeHeaders": ["Host", "Content-Length", "Transfer-Encoding"],
      "ForwardResponseHeaders": true,
      "ExcludeResponseHeaders": ["Transfer-Encoding", "Content-Length"],
      "ResponseStatusCodeParameter": "_proxy_status_code",
      "ResponseBodyParameter": "_proxy_body",
      "ResponseHeadersParameter": "_proxy_headers",
      "ResponseContentTypeParameter": "_proxy_content_type",
      "ResponseSuccessParameter": "_proxy_success",
      "ResponseErrorMessageParameter": "_proxy_error_message",
      "ForwardUploadContent": false
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable proxy functionality for endpoints with proxy annotations. |
| `Host` | string | `null` | Default upstream host URL. Used when the annotation has no URL. Ignored when the annotation specifies its own URL (absolute or relative). See [URL Resolution](../annotations/proxy#url-resolution). |
| `DefaultTimeout` | string | `"00:00:30"` | Default timeout for proxy requests. Format: `"HH:MM:SS"` or [interval format](../annotations/interval-format) (e.g., `"30s"`). |
| `ForwardHeaders` | bool | `true` | Forward request headers to upstream service. |
| `ExcludeHeaders` | array | `["Host", "Content-Length", "Transfer-Encoding"]` | Request headers to exclude from forwarding. |
| `ForwardResponseHeaders` | bool | `true` | Forward response headers from upstream to client. |
| `ExcludeResponseHeaders` | array | `["Transfer-Encoding", "Content-Length"]` | Response headers to exclude from forwarding. |
| `ForwardUploadContent` | bool | `false` | Forward raw multipart/form-data to upstream instead of processing locally. |

## Response Parameter Names

These settings configure which parameter names receive proxy response data:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ResponseStatusCodeParameter` | string | `"_proxy_status_code"` | Parameter name for HTTP status code from upstream. |
| `ResponseBodyParameter` | string | `"_proxy_body"` | Parameter name for response body content. |
| `ResponseHeadersParameter` | string | `"_proxy_headers"` | Parameter name for response headers as JSON. |
| `ResponseContentTypeParameter` | string | `"_proxy_content_type"` | Parameter name for Content-Type header value. |
| `ResponseSuccessParameter` | string | `"_proxy_success"` | Parameter name for success indicator (true for 2xx status). |
| `ResponseErrorMessageParameter` | string | `"_proxy_error_message"` | Parameter name for error message if request failed. |

## Proxy Modes

### Passthrough Mode

When the PostgreSQL function has no proxy response parameters, the upstream response is returned directly to the client without opening a database connection:

```sql
create function get_external_data()
returns void
language sql
begin atomic;
select;
end;

comment on function get_external_data() is 'HTTP GET
@proxy https://api.example.com/data';
```

**Equivalent as a SQL file endpoint** (`sql/get-external-data.sql`):

```sql
-- HTTP GET
-- @proxy https://api.example.com/data
select;
```

### Transform Mode

When the PostgreSQL function has parameters matching the configured response parameter names, the proxy response is passed to the function for processing:

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
@proxy https://api.example.com/data';
```

## Response Parameters

When the PostgreSQL function has parameters matching these names, the proxy response data is passed to the function:

| Parameter Name | Type | Description |
|----------------|------|-------------|
| `_proxy_status_code` | `int` | HTTP status code from upstream (e.g., 200, 404). |
| `_proxy_body` | `text` | Response body content. |
| `_proxy_headers` | `json` | Response headers as JSON object. |
| `_proxy_content_type` | `text` | Content-Type header value. |
| `_proxy_success` | `boolean` | True for 2xx status codes. |
| `_proxy_error_message` | `text` | Error message if request failed. |

## User Claims Forwarding

### Query Parameters (user_params)

When `user_params` is enabled on the endpoint, user claim values are forwarded to the upstream proxy as query string parameters:

```sql
create function proxy_with_claims(
    _user_id text default null,        -- Forwarded as ?userId=...
    _user_name text default null,      -- Forwarded as ?userName=...
    _ip_address text default null,     -- Forwarded as ?ipAddress=...
    _user_claims json default null,    -- Forwarded as ?userClaims=...
    _proxy_status_code int default null,
    _proxy_body text default null
)
returns json language plpgsql as $$
begin
    return json_build_object('user', _user_id, 'data', _proxy_body);
end;
$$;

comment on function proxy_with_claims(text, text, text, json, int, text) is 'HTTP GET
@authorize
@user_params
@proxy https://api.example.com/data';
```

### HTTP Headers (user_context)

When `user_context` is enabled, user context values are forwarded as HTTP headers to the upstream proxy:

```sql
create function proxy_with_context(
    _proxy_status_code int default null,
    _proxy_body text default null
)
returns json language plpgsql as $$
begin
    return json_build_object('status', _proxy_status_code);
end;
$$;

comment on function proxy_with_context(int, text) is 'HTTP GET
@authorize
@user_context
@proxy https://api.example.com/data';
-- Headers forwarded: request.user_id, request.user_name, request.user_roles
-- (configurable via ContextKeyClaimsMapping)
```

## Upload Forwarding

For upload endpoints with proxy, configure whether to process uploads locally or forward raw multipart data:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "ForwardUploadContent": false
    }
  }
}
```

| Value | Description |
|-------|-------------|
| `false` (default) | Uploads are processed locally; proxy receives parsed data. |
| `true` | Raw multipart/form-data is streamed directly to upstream (memory-efficient for large files). |

## Key Features

- **Passthrough mode**: No database connection opened when function has no proxy response parameters
- **Transform mode**: Process upstream response in PostgreSQL before returning to client
- **User claims forwarding**: Authenticated user claims passed as query parameters to upstream
- **User context headers**: User context values passed as HTTP headers to upstream
- **Streaming uploads**: Memory-efficient streaming for large file uploads when `ForwardUploadContent` is enabled
- **Timeout handling**: Configurable per-request timeout with proper 504 Gateway Timeout responses
- **Header forwarding**: Configurable request/response header forwarding with exclusion lists

## Self-Referencing Calls (Relative Paths)

When a proxy annotation includes a **relative path** (starting with `/`), the request is routed to another endpoint on the same NpgsqlRest server:

```sql
comment on function my_aggregator() is 'HTTP GET
@proxy POST /api/data-source';
```

Self-referencing calls bypass the HTTP stack entirely — the endpoint handler is invoked directly in-process via `InternalRequestHandler`, with zero network overhead.

::: info URL Resolution
A relative path in the annotation **always** creates a self-referencing internal call. The global `ProxyOptions.Host` setting is **not** prepended to relative paths — it is only used when the annotation has no URL at all. See [URL Resolution](../annotations/proxy#url-resolution) for the full priority table.
:::

### Internal-Only Endpoints

Combine with the [`@internal` annotation](../annotations/internal) to create endpoints accessible only via proxy but not exposed as public HTTP routes:

```sql
-- Internal helper: not accessible from outside
comment on function get_cached_rates() is 'HTTP GET
@internal';

-- Public endpoint that proxies the internal one
comment on function convert_currency(numeric, text, text) is 'HTTP GET
@proxy GET /api/get-cached-rates';
```

Direct HTTP call to `/api/get-cached-rates` returns 404, but the proxy call works.

## Complete Example

Production configuration with proxy enabled:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "https://api.internal.example.com",
      "DefaultTimeout": "00:00:30",
      "ForwardHeaders": true,
      "ExcludeHeaders": ["Host", "Content-Length", "Transfer-Encoding", "Authorization"],
      "ForwardResponseHeaders": true,
      "ExcludeResponseHeaders": ["Transfer-Encoding", "Content-Length"],
      "ForwardUploadContent": false
    }
  }
}
```

## Related

- [proxy annotation](../annotations/proxy) - Enable proxy for specific endpoints
- [user_context annotation](../annotations/user-context) - Enable user context forwarding
- [user_parameters annotation](../annotations/user-parameters) - Enable user parameters forwarding
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [HTTP Client](./http-client) - HTTP Types for external API calls from PostgreSQL functions
- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings
- [Authentication](./auth) - Configure authentication methods

## See Also

- [PROXY](/annotations/proxy) - Enable proxy for endpoints
- [PROXY_OUT](/annotations/proxy-out) - Configure outbound proxy settings

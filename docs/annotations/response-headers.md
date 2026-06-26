---
outline: [2, 3]
title: "Response Headers Annotation"
titleTemplate: NpgsqlRest
description: "Set custom HTTP response headers for PostgreSQL REST API endpoints. Configure Cache-Control, Content-Type, and custom headers."
head:
  - - meta
    - name: keywords
      content: npgsqlrest response headers, custom http headers, cache control header, content type header, api response headers
  - - meta
    - property: og:title
      content: "NpgsqlRest Response Headers Annotation"
  - - meta
    - property: og:description
      content: "Set custom HTTP response headers like Cache-Control and Content-Type."
  - - meta
    - property: og:type
      content: article
---

# Response Headers

Set custom HTTP response headers for the endpoint.

## Syntax

```
<Header-Name>: <value>
```

Response headers use standard HTTP header format with a colon separator. Header names are case-insensitive.

## Examples

### Set Content-Type

```sql
create function get_html_page()
returns text
language sql
begin atomic;
select '<html><body><h1>Hello</h1></body></html>';
end;

comment on function get_html_page() is
'HTTP GET
Content-Type: text/html';
```

**Equivalent as a SQL file endpoint** (`sql/get-html-page.sql`):

```sql
/*
HTTP GET
Content-Type: text/html
*/
select '<html><body><h1>Hello</h1></body></html>';
```

Response includes: `Content-Type: text/html`

### Multiple Headers

```sql
create function get_api_data()
returns json
language sql
begin atomic;
select '{"status": "ok"}'::json;
end;

comment on function get_api_data() is
'HTTP GET
Content-Type: application/json
Cache-Control: no-store
X-Custom-Header: custom-value';
```

Response includes all three headers.

### Multi-Value Headers

Headers with the same name are combined:

```sql
create function set_cookies()
returns text
language sql
begin atomic;
select 'OK';
end;

comment on function set_cookies() is
'HTTP GET
Set-Cookie: session=abc123
Set-Cookie: theme=dark
Set-Cookie: lang=en';
```

Response includes three `Set-Cookie` headers: `session=abc123`, `theme=dark`, `lang=en`

### Cache Control

```sql
create function get_static_config()
returns json
language sql
begin atomic;
select config from app_config where id = 1;
end;

comment on function get_static_config() is
'HTTP GET
Cache-Control: public, max-age=3600';
```

Clients can cache the response for 1 hour.

### Combined with Other Annotations

```sql
create function export_report()
returns text
language sql
begin atomic;
...;
end;

comment on function export_report() is
'HTTP GET
@authorize manager
Content-Type: text/csv
Content-Disposition: attachment; filename="report.csv"
Cache-Control: no-cache';
```

### Dynamic Headers from Parameters

Header values can include parameter values using the `{param_name}` template syntax — or an [allowlisted environment variable](./parameter-substitution#environment-variables) (`NpgsqlRest:AvailableEnvVars`), useful for per-deployment values like a server or environment name. Since 3.21.0 the strict forms work too: `{!name}` resolves like `{name}` for known names, and `{!name:fallback}` substitutes the inline fallback when an allowlisted variable is unset (with no configured default) or when a parameter value is null — e.g. `X-Plan: {!_plan:free}`. The matching and substitution rules (case-sensitivity, NULL handling, etc.) are shared across annotations — see [Parameter Value Substitution](./parameter-substitution).

::: warning Secrets
A value substituted into a response header is sent to the client. Use environment variables in response headers only for non-secret values — reserve API keys and tokens for outbound [HTTP custom type](./http-type) calls.
:::

```sql
create function export_report(_type text, _file text)
returns text
language sql
begin atomic;
...;
end;

comment on function export_report(text, text) is
'HTTP GET
@authorize manager
Content-Type: {_type}
Content-Disposition: attachment; filename={_file}
Cache-Control: no-cache';
```

Request: `GET /api/export-report?type=text/csv&file=report.csv`

Response headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename=report.csv
```

### CORS Headers

```sql
create function cors_endpoint()
returns json
language sql
begin atomic;
select '{}'::json;
end;

comment on function cors_endpoint() is
'HTTP GET
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type';
```

Note: To configure CORS centrally (origins, methods, credentials, preflight), use the [CORS configuration](../config/cors) instead.

## Common Headers

| Header | Purpose |
|--------|---------|
| `Content-Type` | Response media type |
| `Cache-Control` | Caching directives |
| `Content-Disposition` | Download filename |
| `X-*` | Custom application headers |
| `Set-Cookie` | Set cookies |

## Related

- [CORS configuration](../config/cors) - Configure CORS headers globally
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [RAW](./raw) - Return raw text output
- [CACHED](./cached) - Server-side caching

---
outline: [2, 3]
title: "BODY_PARAMETER_NAME Annotation"
titleTemplate: NpgsqlRest
description: "Specify which PostgreSQL function parameter receives the raw HTTP request body. Handle JSON payloads in SQL functions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest body parameter, request body parameter, json body postgresql, raw body function, http payload sql
  - - meta
    - property: og:title
      content: "NpgsqlRest BODY_PARAMETER_NAME Annotation"
  - - meta
    - property: og:description
      content: "Specify which function parameter receives the raw HTTP request body."
  - - meta
    - property: og:type
      content: article
---

# BODY_PARAMETER_NAME

::: info Also known as
`body_param_name` (with or without `@` prefix)
:::

Specify which parameter receives the raw request body.

## Syntax

```
@body_parameter_name <param-name>
```

## Examples

### Custom Body Parameter

```sql
create function process_payload(_metadata json, _payload text)
returns json
language sql
begin atomic;
...;
end;

comment on function process_payload(json, text) is
'HTTP POST
@body_parameter_name _payload';
```

**Equivalent as a SQL file endpoint** (`sql/process-payload.sql`):

```sql
/*
HTTP POST
@body_parameter_name payload
@param $1 metadata json
@param $2 payload text
*/
select process_payload($1, $2);
```

### JSON Body Parameter

```sql
create function handle_webhook(_body json)
returns void
language sql
begin atomic;
...;
end;

comment on function handle_webhook(json) is
'HTTP POST
@body_parameter_name _body';
```

## Behavior

- Directs the raw request body to the specified parameter
- Useful when you need access to the complete body content
- Parameter type should match expected content (text, json, bytea)

## Matching Rules

The parameter name is matched **case-insensitively** and accepts any of the parameter's names:

- the **converted (API) name** — e.g. `responseBody` (camelCase),
- the **actual SQL name** — e.g. `_response_body`,
- for a field expanded out of an [HTTP Custom Type](./http-type) composite parameter, the **expanded signature name** (`_response_body`) and the **base composite name** (`_response`, shared by all expanded fields — resolves to the first one).

::: tip New in 3.18.2
Before 3.18.2 the value was force-lowercased and compared case-sensitively, so the camelCase converted name never matched, and the expanded signature name of an HTTP Custom Type field matched nothing at all. From 3.18.2 the same matching rule is applied consistently by request handling **and** every code generator (TypeScript client, HTTP file, OpenAPI), so they no longer disagree about which parameter carries the body.
:::

### Redirecting an HTTP Custom Type field into a proxy body

A common use is forwarding a large field — such as an [HTTP Custom Type](./http-type)'s `responseBody` — into a [`@proxy`](./proxy) upstream **request body** instead of the query string (where an oversized value would be rejected, see [`MaxForwardedQueryParamLength`](../config/proxy#query-string-length-guard)). Target the field by its converted name (`responseBody`), its expanded signature name (`_response_body`), or the composite base (`_response`), and use a body-carrying method:

```sql
comment on function scrape_and_forward(...) is 'HTTP POST
@proxy https://upstream.example.com/ingest
@body_parameter_name responseBody';
```

The remaining small fields still travel on the proxy query string.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default body parameter
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [REQUEST_PARAM_TYPE](./request-param-type) - Control parameter source
- [HTTP_TYPE](./http-type) - HTTP Custom Type whose expanded fields can be targeted as the body
- [PROXY](./proxy) - Forward the body field into an upstream request body

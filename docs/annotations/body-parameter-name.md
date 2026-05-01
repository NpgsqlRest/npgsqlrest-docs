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

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default body parameter
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [REQUEST_PARAM_TYPE](./request-param-type) - Control parameter source

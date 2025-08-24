---
outline: [2, 3]
title: "REQUEST_HEADERS_PARAMETER_NAME Annotation"
titleTemplate: NpgsqlRest
description: "Set parameter name for receiving HTTP request headers in PostgreSQL functions. Customize header parameter naming."
head:
  - - meta
    - name: keywords
      content: npgsqlrest headers parameter, request headers param, http headers function, header parameter name
  - - meta
    - property: og:title
      content: "NpgsqlRest REQUEST_HEADERS_PARAMETER_NAME Annotation"
  - - meta
    - property: og:description
      content: "Set the parameter name that receives HTTP request headers."
  - - meta
    - property: og:type
      content: article
---

# REQUEST_HEADERS_PARAMETER_NAME

::: info Also known as
`request_headers_param_name` (with or without `@` prefix)
:::

Set the parameter name that receives request headers when using parameter mode.

## Syntax

```
@request_headers_parameter_name <param-name>
```

## Examples

### Custom Parameter Name

```sql
create function process_request(_data text, _req_headers json default null)
returns json
language sql
begin atomic;
...;
end;

comment on function process_request(text, json) is
'HTTP POST
@request_headers_mode parameter
@request_headers_parameter_name _req_headers';
```

### Default Parameter Name

By default, uses `_headers` as the parameter name:

```sql
create function my_func(_input text, _headers json default null)
returns json
language sql
begin atomic;
...;
end;

comment on function my_func(text, json) is
'HTTP POST
@request_headers_mode parameter';
```

## Behavior

- Only applies when `request_headers_mode` is `parameter`
- Parameter must have a default value (typically `null`)
- Parameter type should be `json` or `text`
- Headers are passed as JSON object

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default parameter name
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [REQUEST_HEADERS_MODE](./request-headers-mode) - Set header passing mode

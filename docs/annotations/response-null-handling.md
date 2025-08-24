---
outline: [2, 3]
title: "RESPONSE_NULL_HANDLING Annotation"
titleTemplate: NpgsqlRest
description: "Control how NULL results are returned in PostgreSQL REST API responses. Configure JSON null handling and empty responses."
head:
  - - meta
    - name: keywords
      content: npgsqlrest response null, null json response, empty response handling, postgresql null output, api null response
  - - meta
    - property: og:title
      content: "NpgsqlRest RESPONSE_NULL_HANDLING Annotation"
  - - meta
    - property: og:description
      content: "Control how NULL results are returned in API responses."
  - - meta
    - property: og:type
      content: article
---

# RESPONSE_NULL_HANDLING

::: info Also known as
`response_null`, `text_response_null_handling` (with or without `@` prefix)
:::

Control how NULL results are returned in plain text responses when the execution returns NULL from the database.

## Syntax

```
@response_null <mode>
@response_null_handling <mode>
@text_response_null_handling <mode>
```

## Values

| Value | Description |
|-------|-------------|
| `empty_string` | Returns an empty string response with status code 200 OK (default) |
| `null_literal` | Returns a string literal "NULL" with status code 200 OK |
| `no_content` or `204_no_content` | Returns status code 204 NO CONTENT |

## Examples

### Return Empty String for NULL

```sql
comment on function get_value(_id int) is
'HTTP GET
@response_null empty_string';
```

If result is NULL → Response body: `""`

### Return 204 for NULL

```sql
comment on function find_record(_id int) is
'HTTP GET
@response_null 204_no_content';
```

If result is NULL → HTTP 204 with no body

### Return JSON null

```sql
comment on function get_optional(_key text) is
'HTTP GET
@response_null null_literal';
```

If result is NULL → Response body: `null`

## Configuration Default

You can set the default behavior for all endpoints in `appsettings.json`:

```json
{
  "NpgsqlRest": {
    "TextResponseNullHandling": "NoContent"
  }
}
```

Available values: `EmptyString` (default), `NullLiteral`, `NoContent`.

This sets the default for all endpoints, which can then be overridden per-endpoint using comment annotations.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default null handling
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [QUERY_STRING_NULL_HANDLING](./query-string-null-handling) - NULL in query strings

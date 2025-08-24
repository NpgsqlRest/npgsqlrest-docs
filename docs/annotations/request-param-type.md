---
outline: [2, 3]
title: "REQUEST_PARAM_TYPE Annotation"
titleTemplate: NpgsqlRest
description: "Control parameter transmission method for PostgreSQL REST API endpoints. Choose between query string and request body parameters."
head:
  - - meta
    - name: keywords
      content: npgsqlrest param type, query string parameters, request body params, parameter transmission, api input method
  - - meta
    - property: og:title
      content: "NpgsqlRest REQUEST_PARAM_TYPE Annotation"
  - - meta
    - property: og:description
      content: "Control parameter transmission via query string or request body."
  - - meta
    - property: og:type
      content: article
---

# REQUEST_PARAM_TYPE

::: info Also known as
`param_type` (with or without `@` prefix)
:::

Control how parameters are transmitted to the endpoint - via query string or request body.

## Syntax

```
@request_param_type <type>
@param_type <type>
```

**type**: `query_string`, `query`, `body`, `body_json`

## Values

| Value | Description |
|-------|-------------|
| `query_string` | Parameters from URL query string |
| `query` | Same as `query_string` |
| `body_json` | Parameters from JSON request body |
| `body` | Same as `body_json` |

## Default Behavior

When not specified:
- `GET` and `DELETE` methods use query string
- All other methods use JSON body

## Examples

### Force Query String Parameters

```sql
create function search_users(_name text, _active bool)
returns setof users
language sql
begin atomic;
select * from users where name ilike '%' || _name || '%' and active = _active;
end;

comment on function search_users(text, bool) is
'HTTP GET
@request_param_type query_string';
```

Request: `GET /api/search-users?_name=john&_active=true`

### Force JSON Body Parameters

```sql
create function get_filtered_data(_filters text)
returns json
language sql
begin atomic;
...;
end;

comment on function get_filtered_data(text) is
'HTTP GET
@request_param_type body_json';
```

Request:
```http
GET /api/get-filtered-data
Content-Type: application/json

{"_filters": "status=active"}
```

### Short Form Keywords

```sql
-- Using '@param_type' instead of '@request_param_type'
comment on function func1(text) is
'HTTP
@param_type query';

-- Using 'BODY' (case-insensitive)
comment on function func2(text) is
'HTTP
@param_type BODY';
```

### POST with Query String

Override the default body behavior for POST:

```sql
create function quick_action(_id int)
returns text
language sql
begin atomic;
...;
end;

comment on function quick_action(int) is
'HTTP POST
@param_type query_string';
```

Request: `POST /api/quick-action?_id=123`

## Behavior

When parameter type doesn't match the request format, the endpoint returns `404 Not Found`:

- Endpoint configured for `query_string` but receives JSON body → 404
- Endpoint configured for `body_json` but receives query parameters → 404

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default parameter handling
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [HTTP](./http) - Define endpoint method
- [BODY_PARAMETER_NAME](./body-parameter-name) - Specify body parameter
- [QUERY_STRING_NULL_HANDLING](./query-string-null-handling) - NULL handling

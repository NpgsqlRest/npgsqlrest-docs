---
outline: [2, 3]
title: "SINGLE Annotation"
titleTemplate: NpgsqlRest
description: "Return a single record as a JSON object instead of a JSON array. Unwrap single-row results for cleaner API responses."
head:
  - - meta
    - name: keywords
      content: npgsqlrest single record, json object response, single result api, unwrap json array, postgresql single row
  - - meta
    - property: og:title
      content: "NpgsqlRest SINGLE Annotation"
  - - meta
    - property: og:description
      content: "Return a single record as a JSON object instead of a JSON array."
  - - meta
    - property: og:type
      content: article
---

# SINGLE

::: info Also known as
`single_record`, `single_result` (with or without `@` prefix)
:::

Return a single record as a JSON object instead of a JSON array.

## Syntax

```
@single
```

## Default Behavior vs Single

By default, all endpoints return results as a JSON array, even when only one row is returned. With the `@single` annotation, the result is returned as a plain JSON object.

**Without `@single`:**
```json
[{"id": 1, "name": "Alice"}]
```

**With `@single`:**
```json
{"id": 1, "name": "Alice"}
```

## Examples

### PostgreSQL Function

```sql
create function get_user(_id int)
returns table(id int, name text, email text)
language sql
begin atomic;
select id, name, email from users where id = _id;
end;

comment on function get_user(int) is 'HTTP GET /users/{_id}
@single';
```

`GET /users/1` →

```json
{"id": 1, "name": "Alice", "email": "alice@example.com"}
```

### SQL File

```sql
-- sql/get_user.sql
-- HTTP GET
-- @single
-- @param $1 user_id
SELECT id, name, email FROM users WHERE id = $1;
```

`GET /api/get-user?user_id=1` →

```json
{"id": 1, "name": "Alice", "email": "alice@example.com"}
```

### Single Unnamed Column

When the result has a single unnamed column, the bare JSON value is returned:

```sql
-- sql/get_username.sql
-- HTTP GET
-- @single
-- @param $1 user_id
SELECT name FROM users WHERE id = $1;
```

`GET /api/get-username?user_id=1` → `"Alice"`

### Multi-Command Files (Positional)

In multi-command SQL files, `@single` is positional — it applies to the next statement below it:

```sql
-- sql/process_user.sql
-- HTTP POST
-- @param $1 id
-- @single
SELECT id, name FROM users WHERE id = $1;
UPDATE orders SET status = 'done' WHERE id = $1;
-- @single
SELECT id, status FROM orders WHERE id = $1;
```

Result:

```json
{
  "result1": {"id": 1, "name": "alice"},
  "result2": 1,
  "result3": {"id": 1, "status": "done"}
}
```

- First and third commands return objects (`@single` above them)
- Second command returns rows-affected count (void, unaffected)
- Empty per-command `@single` results render as `null`

## Behavior

- Multi-column results return a JSON object (no array wrapping)
- Single unnamed column results return a bare JSON value (e.g., `"hello"`, `42`)
- If the query returns multiple rows, only the first row is returned
- Works across all endpoint sources: functions, SQL files, and CRUD endpoints
- In multi-command files, `@single` is positional — applies to the next statement below
- TypeScript client generates `Promise<IResponse>` instead of `Promise<IResponse[]>`

### Empty Results

When the query returns no rows, the behavior depends on the [`@response_null`](./response-null-handling) annotation:

| Setting | Response |
|---------|----------|
| `empty_string` (default) | Empty response body |
| `null_literal` | `null` |
| `no_content` | HTTP 204 No Content |

In multi-command files, empty per-command `@single` results render as `null`.

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [RESULT_NAME](./result-name) - Rename result keys in multi-command files
- [RESPONSE_NULL_HANDLING](./response-null-handling) - Control empty result behavior
- [RAW](./raw) - Return raw text instead of JSON

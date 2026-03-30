---
outline: [2, 3]
title: "RESULT_NAME Annotation"
titleTemplate: NpgsqlRest
description: "Rename result keys in multi-command SQL file endpoints. Replace default result1, result2 keys with meaningful names."
head:
  - - meta
    - name: keywords
      content: npgsqlrest result name, multi-command result, sql file result, rename result key, batch sql endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest RESULT_NAME Annotation"
  - - meta
    - property: og:description
      content: "Rename result keys in multi-command SQL file endpoints."
  - - meta
    - property: og:type
      content: article
---

# RESULT_NAME

::: info Also known as
`resultN` where N is the result number (with or without `@` prefix)
:::

Rename the default result keys (`result1`, `result2`, ...) in multi-command SQL file endpoints. This makes the response JSON more descriptive and easier to consume.

This annotation only applies to multi-command SQL file endpoints (files with multiple SQL statements separated by `;`).

## Syntax

**Numbered (from anywhere in the file):**
```
@resultN <name>
@resultN is <name>
```

- `N`: The 1-based index of the command in the file (e.g., `1` for the first statement, `2` for the second)
- `name`: The custom key name for this result in the response JSON

**Positional (applies to the next statement below):**
```
@result <name>
@result is <name>
```

Place `@result name` between statements and it applies to the next command below.

## Examples

### Basic Result Naming

```sql
-- sql/process_order.sql
-- HTTP POST
-- @result1 validate
-- @result3 confirm
-- @param $1 order_id
select count(*) from orders where id = $1;
update orders set status = 'processing' where id = $1;
select id, status from orders where id = $1;
```

`POST /api/process-order` with `{"order_id": 42}` returns:

```json
{
  "validate": [1],
  "result2": 1,
  "confirm": [{"id": 42, "status": "processing"}]
}
```

- `result1` renamed to `validate`
- `result2` keeps its default name (no annotation)
- `result3` renamed to `confirm`

### "is" Style Syntax

The `is` keyword is optional:

```sql
-- These are equivalent:
-- @result1 validate
-- @result1 is validate
```

### Naming All Results

```sql
-- sql/dashboard_data.sql
-- HTTP GET
-- @result1 users
-- @result2 orders
-- @result3 revenue
select count(*) from users;
select count(*) from orders where created_at > now() - interval '24 hours';
select sum(total) from orders where created_at > now() - interval '24 hours';
```

Response:

```json
{
  "users": [{"count": 150}],
  "orders": [{"count": 42}],
  "revenue": [{"sum": 12500.00}]
}
```

### Positional Syntax

Place `@result name` between statements — it applies to the next command below:

```sql
-- sql/dashboard.sql
-- HTTP GET
-- @result users
SELECT id, name FROM users;
-- @result orders
SELECT id, total FROM orders;
```

Response:

```json
{
  "users": [{"id": 1, "name": "Alice"}, ...],
  "orders": [{"id": 1, "total": 99.99}, ...]
}
```

### Combining Both Forms

Both numbered and positional forms can coexist in the same file:

```sql
-- @result3 summary
-- @result users
SELECT id, name FROM users;
-- @result orders
SELECT id, total FROM orders;
SELECT count(*) FROM orders;
```

- Positional `@result` takes precedence when both target the same command
- `result1` → `users` (positional), `result2` → `orders` (positional), `result3` → `summary` (numbered)

## Behavior

- Default result keys use the format `result1`, `result2`, `result3`, etc.
- The prefix (`result`) is configurable via the `ResultPrefix` setting in `SqlFileSource` configuration
- Commands returning rows produce a JSON array of row objects
- Void commands (INSERT/UPDATE/DELETE without RETURNING) produce an integer (rows affected count)
- Only results with a matching annotation are renamed; others keep their default key
- Positional `@result name` applies to the next statement below it
- Numbered `@resultN name` targets a specific command by index from anywhere in the file
- Positional takes precedence when both forms target the same command
- This annotation has no effect on single-command SQL file endpoints (they return a plain array, not a keyed object)

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [SINGLE](./single) - Return single records as objects in multi-command results
- [PARAMETER_RENAME](./parameter-rename) - Rename endpoint parameters

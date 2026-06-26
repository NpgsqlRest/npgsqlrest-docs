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

Rename the default result keys (`result1`, `result2`, ...) in multi-command SQL file endpoints. This makes the response JSON more descriptive and easier to consume.

This annotation only applies to multi-command SQL file endpoints (files with multiple SQL statements separated by `;`).

Available since version 3.12.0.

## Syntax

```
@result <name>
@result is <name>
```

The `@result` annotation is positional. It can be placed in two ways:

1. **Before the statement** (on a separate line) — applies to the next statement below it
2. **Inline after the semicolon** (on the same line) — applies to the statement on that line

This same placement rule applies to all positional annotations: `@result`, [`@single`](./single), and [`@skip`](./skip).

## Examples

### Before Statement (Separate Line)

Place `@result name` on a line before the statement it applies to:

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

### Inline After Semicolon (Same Line)

Place `@result name` after the semicolon on the same line as the statement:

```sql
-- sql/dashboard.sql
-- HTTP GET
SELECT id, name FROM users; -- @result users
SELECT id, total FROM orders; -- @result orders
```

Produces the same result as the previous example.

### "is" Style Syntax

The `is` keyword is optional:

```sql
-- These are equivalent:
-- @result validate
-- @result is validate
```

### Naming Some Results

Commands without a `@result` annotation keep their default auto-generated key:

```sql
-- sql/process_order.sql
-- HTTP POST
-- @result validate
select count(*) from orders where id = :order_id;
update orders set status = 'processing' where id = :order_id;
-- @result confirm
select id, status from orders where id = :order_id;
```

`POST /api/process-order` with `{"orderId": 42}` returns:

```json
{
  "validate": [1],
  "result2": 1,
  "confirm": [{"id": 42, "status": "processing"}]
}
```

- First command renamed to `validate`
- Second command keeps its default name `result2` (no annotation)
- Third command renamed to `confirm`

### Naming All Results

```sql
-- sql/dashboard_data.sql
-- HTTP GET
-- @result users
select count(*) from users;
-- @result orders
select count(*) from orders where created_at > now() - interval '24 hours';
-- @result revenue
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

## Behavior

- Default result keys use the format `result1`, `result2`, `result3`, etc.
- The prefix (`result`) is configurable via the `ResultPrefix` setting in `SqlFileSource` configuration
- Commands returning rows produce a JSON array of row objects
- Void commands (INSERT/UPDATE/DELETE without RETURNING) produce an integer (rows affected count)
- Only results with a `@result` annotation are renamed; others keep their default key
- This annotation has no effect on single-command SQL file endpoints (they return a plain array, not a keyed object)

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [SINGLE](./single) - Return single records as objects in multi-command results
- [SKIP](./skip) - Exclude commands from multi-command results
- [PARAM](./param) - Rename, retype, and configure parameters
- [SQL File Source](../config/sql-file-source) - SQL file source configuration

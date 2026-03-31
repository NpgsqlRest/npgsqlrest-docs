---
outline: [2, 3]
title: "SKIP Annotation"
titleTemplate: NpgsqlRest
description: "Exclude commands from multi-command SQL file JSON responses while still executing them. Control which statements appear in the result."
head:
  - - meta
    - name: keywords
      content: npgsqlrest skip result, skip command, multi-command skip, sql file skip result, exclude result
  - - meta
    - property: og:title
      content: "NpgsqlRest SKIP Annotation"
  - - meta
    - property: og:description
      content: "Exclude commands from multi-command SQL file JSON responses while still executing them."
  - - meta
    - property: og:type
      content: article
---

# SKIP

::: info Also known as
`skip_result`, `no_result` (with or without `@` prefix)
:::

Mark a command in a multi-command SQL file to be executed but excluded from the JSON response. The statement runs against the database, but its result is not included in the response object and it does not consume a result number.

Available since version 3.12.0.

## Syntax

```
@skip
```

The `@skip` annotation is positional. It can be placed in two ways:

1. **Before the statement** (on a separate line) — applies to the next statement below it
2. **Inline after the semicolon** (on the same line) — applies to the statement on that line

This same placement rule applies to all positional annotations: [`@result`](./result-name), [`@single`](./single), and `@skip`.

## Examples

### Skipping a DO Block

```sql
-- sql/process_and_notify.sql
-- HTTP POST
-- @param $1 user_id
-- @skip
do $$ begin perform pg_notify('user_updated', 'event'); end; $$;
-- @result data
SELECT id, name FROM users WHERE id = $1;
```

Result: `{"data": [{"id": 1, "name": "Alice"}]}`

The `DO` block executes (sending the notification) but does not appear in the response.

### Skipping Transaction Control

```sql
-- sql/transfer.sql
-- HTTP POST
-- @param $1 from_id
-- @param $2 to_id
-- @param $3 amount
-- @skip
BEGIN;
UPDATE accounts SET balance = balance - $3 WHERE id = $1;
UPDATE accounts SET balance = balance + $3 WHERE id = $2;
-- @skip
COMMIT;
-- @result from_account
SELECT id, balance FROM accounts WHERE id = $1;
-- @result to_account
SELECT id, balance FROM accounts WHERE id = $2;
```

Result:

```json
{
  "result1": 1,
  "result2": 1,
  "from_account": [{"id": 1, "balance": 900}],
  "to_account": [{"id": 2, "balance": 1100}]
}
```

The `BEGIN` and `COMMIT` statements are executed but excluded from the response. The two UPDATE results show rows-affected counts.

### Inline Placement

```sql
-- sql/cleanup.sql
-- HTTP POST
-- @param $1 user_id
DELETE FROM sessions WHERE user_id = $1; -- @skip
-- @result user
SELECT id, name FROM users WHERE id = $1;
```

Result: `{"user": [{"id": 1, "name": "Alice"}]}`

## SkipNonQueryCommands Setting

The `SkipNonQueryCommands` setting (default: `true`) in `SqlFileSource` configuration automatically excludes non-query commands from the response. This covers transaction control (`BEGIN`, `COMMIT`, `ROLLBACK`, etc.), session commands (`SET`, `RESET`), `DO` blocks, and other non-query statements.

With `SkipNonQueryCommands` enabled (the default), you typically do not need `@skip` for these common cases. The `@skip` annotation is useful for:

- Explicitly skipping DML commands (`INSERT`, `UPDATE`, `DELETE`) whose rows-affected count you do not want in the response
- Skipping statements when `SkipNonQueryCommands` is set to `false`
- Making skip intent explicit in the SQL file for documentation purposes

## Behavior

- The skipped statement is still executed against the database
- Skipped commands do not consume a result number — subsequent commands are numbered as if the skipped command did not exist
- Works with any statement type: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DO`, transaction control, etc.
- Only applies to multi-command SQL file endpoints

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [RESULT_NAME](./result-name) - Rename result keys in multi-command files
- [SINGLE](./single) - Return single records as objects in multi-command results
- [SQL File Source](../config/sql-file-source) - SQL file source configuration including `SkipNonQueryCommands`

---
outline: [2, 3]
title: "TEST @response Directive"
titleTemplate: NpgsqlRest
description: "Name the temp table that captures an HTTP block's response in a SQL test file. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test response, response temp table, response capture, sql test assertions
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @response Directive"
  - - meta
    - property: og:description
      content: "Name the temp table that captures an HTTP block's response in a SQL test file."
  - - meta
    - property: og:type
      content: article
---

# TEST @response

::: warning Test files only
This directive applies **only inside HTTP blocks of test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`).
:::

Capture this HTTP block's response into a temp table with a **custom name**, instead of the default.

## Default naming

Without the directive, the response table name comes from [`TestRunner.ResponseTempTable`](../config/test-runner#responsetemptable):

- a file with **one** HTTP block → `_response`
- a file with **two or more** blocks → `_response_1`, `_response_2`, … in block order

Includes participate in the numbering: HTTP blocks spliced in by `\i`/`\ir` count as if pasted.

## Syntax

```sql
/*
POST /api/login
Content-Type: application/json
# @response login_result

{"email": "ada@example.com", "password": "secret"}
*/
select (select status from login_result) = 200, 'login succeeds';
select (select body::jsonb ->> 'role' from login_result) = 'admin', 'role returned';
```

The named table has the same columns as the default (`status int`, `body text`, `content_type text`, `headers jsonb`, `is_success boolean` — configurable).

## Notes

- Each block's table is created **fresh** (no `IF NOT EXISTS`): reusing a name — two blocks both saying `# @response x`, or a name colliding with the default — fails the test loudly rather than silently overwriting.
- Named tables make multi-call tests readable: `login_result`, `created`, `after_delete` beat `_response_1..3`.
- `// @response` is accepted as an alternative to `# @response`.

## Related

- [TEST @claim](./test-claim) — the other HTTP block directive
- [Test Runner configuration](../config/test-runner#responsetemptable) — table name and column configuration
- [Testing Guide](../guide/testing)

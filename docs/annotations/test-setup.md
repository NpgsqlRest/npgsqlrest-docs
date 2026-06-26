---
outline: [2, 3]
title: "TEST @setup Annotation"
titleTemplate: NpgsqlRest
description: "Run named setup steps before an individual SQL test file. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test setup, per-file setup, test fixtures, sql test runner annotations
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @setup Annotation"
  - - meta
    - property: og:description
      content: "Run named setup steps before an individual SQL test file."
  - - meta
    - property: og:type
      content: article
---

# TEST @setup

::: warning Test files only
This annotation applies **only to test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`). It has no meaning in endpoint SQL files or routine comments.
:::

Run one or more **named steps** (from the [`TestRunner.Steps`](../config/test-runner#steps) registry) **before this test file** executes.

## Syntax

Placed in the file's **header** — the leading `--` line comments before the first SQL statement or HTTP block:

```sql
-- @setup StepName [StepName ...]
```

- Names may be **whitespace- or comma-separated**: `-- @setup CreateDb SeedData` and `-- @setup CreateDb, SeedData` are equivalent.
- The annotation is **repeatable**; all listed steps run in the **order written**.
- Every name must exist in the `TestRunner.Steps` registry — an unknown name is a loud error, not a silent skip.
- A step with `"Enabled": false` is the one sanctioned skip: it is ignored wherever referenced (logged at debug level) — the default configuration ships disabled example steps to flip on instead of typing.

## Example

Config:

```json
{
  "TestRunner": {
    "Steps": {
      "CreateIsolatedDb": {
        "Sql": "create database app_iso_{rnd5_1} template app_template_{rnd5}",
        "ConnectionName": "Admin"
      },
      "DropIsolatedDb": {
        "Sql": "drop database if exists app_iso_{rnd5_1} with (force)",
        "ConnectionName": "Admin"
      }
    }
  }
}
```

Test file:

```sql
-- @setup CreateIsolatedDb
-- @teardown DropIsolatedDb
-- @connection Isolated

/*
POST /api/create-user
Content-Type: application/json

{"name": "Ada"}
*/
select status = 200, 'user created in the isolated clone' from _response;
```

The step runs once, immediately before this file (after the run-level `Setup`). Combined with [`-- @teardown`](./test-teardown) and [`-- @connection`](./test-connection), this gives a single test file its **own private database**.

## Header semantics

The header ends at the first SQL statement or HTTP block. An included file (`\i`/`\ir`) that contains **only comments** (an *annotation profile*) continues the header — its annotations count as if written in-place — so a shared profile can carry `@setup`/`@teardown`/`@connection`/`@tag` for many test files.

::: tip Watch the prose
Everything after the step names on the line is treated as more step names. Write explanatory text on its own comment line, not after the names.
:::

## Related

- [TEST @teardown](./test-teardown) — the mirror, always runs after the file
- [TEST @connection](./test-connection) — run the file on another connection
- [Test Runner configuration](../config/test-runner) — the `Steps` registry
- [Testing Guide](../guide/testing)

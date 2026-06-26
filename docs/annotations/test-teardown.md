---
outline: [2, 3]
title: "TEST @teardown Annotation"
titleTemplate: NpgsqlRest
description: "Run named teardown steps after an individual SQL test file, always. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test teardown, per-file teardown, test cleanup, sql test runner annotations
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @teardown Annotation"
  - - meta
    - property: og:description
      content: "Run named teardown steps after an individual SQL test file, always."
  - - meta
    - property: og:type
      content: article
---

# TEST @teardown

::: warning Test files only
This annotation applies **only to test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`). It has no meaning in endpoint SQL files or routine comments.
:::

Run one or more **named steps** (from the [`TestRunner.Steps`](../config/test-runner#steps) registry) **after this test file** — **always**, best-effort, even when the file failed or errored.

## Syntax

Placed in the file's **header** — the leading `--` line comments before the first SQL statement or HTTP block:

```sql
-- @teardown StepName [StepName ...]
```

- Names may be **whitespace- or comma-separated**; the annotation is **repeatable**; steps run in the **order written**.
- Every name must exist in the `TestRunner.Steps` registry.
- Runs after the file's own connection is disposed, so it can safely `drop database ... with (force)` on an admin connection.

## Example

```sql
-- @setup CreateIsolatedDb
-- @teardown DropIsolatedDb
-- @connection Isolated

begin;
insert into users (name) values ('fixture');
select count(*) = 1, 'fixture inserted in the private clone' from users;
rollback;
```

Even if the assertion fails — or the file errors halfway — `DropIsolatedDb` still runs, so the per-file database never leaks.

## Ordering

For one test file the lifecycle is:

1. per-file `@setup` steps (in written order)
2. the file body, on its own non-pooled connection
3. connection disposed
4. per-file `@teardown` steps (in written order, always)

The run-level [`TestRunner.Setup`/`Teardown`](../config/test-runner#setup-and-teardown) wrap the *whole run* outside of this.

## Related

- [TEST @setup](./test-setup) — the mirror, runs before the file
- [TEST @connection](./test-connection) — run the file on another connection
- [Test Runner configuration](../config/test-runner)
- [Testing Guide](../guide/testing)

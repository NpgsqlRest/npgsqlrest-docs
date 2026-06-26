---
outline: [2, 3]
title: "TEST @connection Annotation"
titleTemplate: NpgsqlRest
description: "Run an individual SQL test file on a different named connection. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test connection, per-file connection, test isolation, isolated test database
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @connection Annotation"
  - - meta
    - property: og:description
      content: "Run an individual SQL test file on a different named connection."
  - - meta
    - property: og:type
      content: article
---

# TEST @connection

::: warning Test files only
This annotation applies **only to test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`). It is distinct from the endpoint [`CONNECTION`](./connection) annotation, which selects a connection for a routine endpoint.
:::

Run **this test file** on a named `ConnectionStrings` entry instead of the test runner's default connection ([`TestRunner.ConnectionName`](../config/test-runner#connectionname) or the app's main connection).

## Syntax

Placed in the file's **header** — the leading `--` line comments before the first SQL statement or HTTP block:

```sql
-- @connection Name
```

The whole file — its SQL statements **and the endpoints invoked by its HTTP blocks** — runs on a non-pooled connection built from that entry. This is the key to **perfect per-test isolation**: point the file at a database that its own [`@setup`](./test-setup) step just created.

## Example

Config:

```json
{
  "ConnectionStrings": {
    "Admin": "Host=localhost;Database=postgres;...",
    "Test": "Host=localhost;Database=app_test_{rnd5};...",
    "Isolated": "Host=localhost;Database=app_iso_{rnd5_1};..."
  }
}
```

Test file — gets its own clone, invisible to every other test:

```sql
-- @setup CreateIsolatedDb
-- @teardown DropIsolatedDb
-- @connection Isolated

/*
POST /api/create-user
Content-Type: application/json

{"name": "Ada", "email": "ada@example.com"}
*/
select body::jsonb ->> 'id' = '4',
       'sequence ids are deterministic in a fresh clone'
from _response;
```

Sequences are the classic motivation: `nextval()` is non-transactional (it sticks even through `rollback`), so on a **shared** test database a generated id depends on which other tests ran first. In a private clone the id is deterministic.

## Notes

- The endpoint pipeline still type-checks (Describe) against the run-level test connection at startup; `@connection` switches the **execution** connection for this file. The databases must therefore be structurally compatible — which they are by construction when both are created from the same template or migrations.
- `{rnd}` tokens in the connection string resolve once per run; use indexed tokens (`{rnd5_1}`, `{rnd5_2}`) when several files each need their **own** database name.

## Related

- [TEST @setup](./test-setup) / [TEST @teardown](./test-teardown) — create/drop that database around the file
- [Test Runner configuration](../config/test-runner) — `ConnectionName`, `{rnd}` tokens
- [Testing Guide](../guide/testing) — the template-database isolation scenario

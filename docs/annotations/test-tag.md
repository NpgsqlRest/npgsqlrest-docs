---
outline: [2, 3]
title: "TEST @tag Annotation"
titleTemplate: NpgsqlRest
description: "Tag SQL test files for selective runs with Tag/ExcludeTag filtering. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test tag, tag filtering, smoke tests, test suites, sql test runner annotations
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @tag Annotation"
  - - meta
    - property: og:description
      content: "Tag SQL test files for selective runs with Tag/ExcludeTag filtering."
  - - meta
    - property: og:type
      content: article
---

# TEST @tag

::: warning Test files only
This annotation applies **only to test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`). It is distinct from the endpoint [`TAGS`](./tags) annotation, which scopes routine annotations by volatility.
:::

Declare **tags** on a test file, so runs can be narrowed with [`TestRunner.Tag` / `ExcludeTag`](../config/test-runner#tag-and-excludetag).

## Syntax

Placed in the file's **header** — the leading `--` line comments before the first SQL statement or HTTP block:

```sql
-- @tag name [name ...]
```

- Names may be **whitespace- or comma-separated**: `-- @tag smoke auth` and `-- @tag smoke, auth` are equivalent.
- The annotation is **repeatable**; tags accumulate. Matching is **case-insensitive**.

## Example

```sql
-- @tag auth, smoke
-- Test: GET /api/get-users requires authentication.

/*
GET /api/get-users
*/
select status = 401, 'anonymous request is rejected' from _response;
```

Selective runs:

```sh
# only the smoke suite
npgsqlrest ./config.json --test --testrunner:tag=smoke

# everything except slow tests
npgsqlrest ./config.json --test --testrunner:excludetag=slow

# smoke AND auth files, but never slow ones (exclude wins)
npgsqlrest ./config.json --test --testrunner:tag=smoke,auth --testrunner:excludetag=slow
```

## Tags via a shared profile

Tags declared in an included **annotation profile** count as if written in the file — a shared `\ir` include can tag a whole family of tests at once:

```sql
-- tests/shared/isolated_database.sql (an annotation profile: comments only)
-- @setup CreateIsolatedDb
-- @teardown DropIsolatedDb
-- @connection Isolated
-- @tag isolation, slow
```

```sql
-- a test file attaching the profile
\ir shared/isolated_database.sql

select 1 = 1, 'runs isolated, tagged isolation+slow via the profile';
```

## Related

- [Test Runner configuration](../config/test-runner) — `Tag`, `ExcludeTag`, `Filter`
- [TEST @setup](./test-setup) — header annotations share the same placement rules
- [Testing Guide](../guide/testing)

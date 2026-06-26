---
outline: [2, 3]
title: "Test Runner Configuration"
titleTemplate: NpgsqlRest
description: "Configuration reference for the NpgsqlRest SQL test runner (--test). File discovery, filtering, tags, parallelism, setup and teardown steps, test databases, watch mode, coverage, and CI output."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test runner, sql testing, testrunner configuration, postgresql api testing, test database, junit xml, endpoint coverage
  - - meta
    - property: og:title
      content: "NpgsqlRest Test Runner Configuration"
  - - meta
    - property: og:description
      content: "Configuration reference for the NpgsqlRest SQL test runner (--test)."
  - - meta
    - property: og:type
      content: article
---

# Test Runner

Configuration for the **SQL test runner** (`npgsqlrest --test`) — write tests for your endpoints as plain `.sql` files and run them against the real endpoint pipeline, in-process. For the full walkthrough (test file anatomy, HTTP blocks, assertions, isolation patterns, migrations, Docker, template databases), see the [Testing Guide](../guide/testing).

The `TestRunner` section is a **top-level** configuration section (a sibling of `NpgsqlRest`, not nested inside it). It only has an effect when the client runs with the `--test` argument — it is completely inert during normal server operation.

```sh
npgsqlrest ./config.json --test
npgsqlrest ./config.json ./test-config.json --test --watch
npgsqlrest ./config.json --test --testrunner:filter=login --testrunner:tag=smoke
```

## Overview

```json
{
  "TestRunner": {
    "FilePattern": "",
    "Filter": "",
    "Tag": "",
    "ExcludeTag": "",
    "ConnectionName": "",
    "MaxParallelism": 0,
    "FailFast": false,
    "PerTestTimeout": "30s",
    "JUnitOutput": null,
    "Keep": false,
    "DetailedReport": false,
    "AllowEmpty": false,
    "Coverage": null,
    "CoverageThreshold": null,
    "LoggerName": "NpgsqlRestTest",
    "ResponseTempTable": {
      "Name": "_response",
      "MultiNamePattern": "_response_{n}",
      "DebugTable": null,
      "Columns": {
        "Status": "status",
        "Body": "body",
        "ContentType": "content_type",
        "Headers": "headers",
        "IsSuccess": "is_success"
      }
    },
    "Steps": {
      "CreateTestDatabase": {
        "Enabled": false,
        "ConnectionName": "Admin",
        "Sql": "create database app_test_{rnd5}"
      },
      "DropTestDatabase": {
        "Enabled": false,
        "ConnectionName": "Admin",
        "Sql": "drop database if exists app_test_{rnd5} with (force)"
      },
      "ApplySchema": {
        "Enabled": false,
        "SqlFile": "./migrations/schema.sql"
      },
      "RunMigrationTool": {
        "Enabled": false,
        "Command": "echo replace with your migration tool command",
        "WorkingDirectory": "."
      },
      "StartDockerPostgres": {
        "Enabled": false,
        "Command": "docker run -d --name npgsqlrest-test-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres"
      },
      "StopDockerPostgres": {
        "Enabled": false,
        "Command": "docker rm -f npgsqlrest-test-pg"
      }
    },
    "Setup": [],
    "Teardown": []
  }
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `FilePattern` | string | `""` | Glob selecting test files. Empty disables discovery. |
| `Filter` | string | `""` | Narrow the discovered set by path (substring or glob). |
| `Tag` | string | `""` | Run only files carrying at least one of these tags. |
| `ExcludeTag` | string | `""` | Skip files carrying any of these tags (exclude wins). |
| `ConnectionName` | string | `""` | `ConnectionStrings` entry to run tests against instead of the main connection. |
| `MaxParallelism` | int | `0` | Max test files running concurrently. `0` = processor count. |
| `FailFast` | bool | `false` | Stop scheduling new tests after the first failure/error. |
| `PerTestTimeout` | string | `"30s"` | Per-test-file timeout (`"30s"`, `"5m"`, seconds, or `hh:mm:ss`). `0` disables. |
| `JUnitOutput` | string | `null` | Optional path for a JUnit XML report. |
| `Keep` | bool | `false` | Skip `Teardown` so a failed run's state can be inspected. |
| `DetailedReport` | bool | `false` | Richer console report (passed assertions, failing SQL, notices). |
| `AllowEmpty` | bool | `false` | "No tests discovered" exits `0` instead of `4`. |
| `Coverage` | bool? | `null` | Endpoint-coverage summary. `null` = on for full runs, quiet when narrowed; `true`/`false` = always/never. |
| `CoverageThreshold` | int? | `null` | Fail an otherwise-passing run (exit `2`) when coverage is below this percentage. |
| `LoggerName` | string | `"NpgsqlRestTest"` | SourceContext name of the runner's log channel. |
| `ResponseTempTable` | object | see below | Naming and columns of the per-HTTP-block response temp table. |
| `Steps` | object | `{}` | Named, reusable steps for `Setup`/`Teardown` and per-file annotations. |
| `Setup` | array | `[]` | Run-once setup steps, before endpoint discovery, in written order. |
| `Teardown` | array | `[]` | Run-once teardown steps, always (best-effort), in written order. |

Every setting is also available as a command-line override with the standard configuration syntax: `--testrunner:filter=login`, `--testrunner:coveragethreshold=100`, and so on.

## FilePattern

Glob (same engine as [`SqlFileSource.FilePattern`](./sql-file-source)) selecting the test files. Empty disables discovery — `--test` then exits with code `4` (no tests found).

Two common layouts:

```json
// Co-located: app.sql (endpoint) next to app.test.sql (test), same tree
{ "TestRunner": { "FilePattern": "./sql/**/*.test.sql" } }
```

```json
// Separate tree: endpoints in ./sql, tests in ./tests
{ "TestRunner": { "FilePattern": "./tests/**/*.test.sql" } }
```

The co-located layout works because [`SqlFileSource.SkipPattern`](./sql-file-source) defaults to `"*.test.sql"`, so test files are never exposed as endpoints.

## Filter

The fast path for iterating on one test:

```sh
npgsqlrest ./config.json --test --testrunner:filter=login
```

Matched against each file's cwd-relative path: a value **without wildcards is a substring match**; with wildcards it uses the same glob engine as `FilePattern`. Empty runs everything discovered.

## Tag and ExcludeTag

Tag filtering (comma- or whitespace-separated lists, case-insensitive). A test file declares its tags with a header annotation:

```sql
-- @tag smoke, auth
```

`Tag` runs only files carrying **at least one** of the listed tags; `ExcludeTag` skips files carrying **any** of them — exclude wins when both match. Composes with `Filter` (both must pass).

```sh
npgsqlrest ./config.json --test --testrunner:tag=smoke --testrunner:excludetag=slow
```

Tags declared in an included annotation profile (via `\i`/`\ir` in the file header) count as if written in the file. See the [TEST TAG annotation](../annotations/test-tag).

## ConnectionName

A `ConnectionStrings` entry to run the tests against instead of the app's main connection. In test mode it becomes the connection used for endpoint type-checking (Describe) **and** execution, so it can point at a **dedicated test database that a `Setup` step creates first** — it does not need to exist at startup.

```json
{
  "ConnectionStrings": {
    "Default": "...Database=app_db...",
    "Admin": "...Database=postgres...",
    "Test": "...Database=app_test_{rnd5}..."
  },
  "TestRunner": {
    "ConnectionName": "Test"
  }
}
```

::: tip Random tokens
`{rnd1}`…`{rnd10}` are random lowercase tokens (length = the digit), generated once and **stable for the whole run**, usable in any connection string or Setup/Teardown SQL — so `app_test_{rnd5}` resolves to the *same* name in the connection string, the `create database` step, and the `drop database` step. Need several distinct tokens of the same length? Indexed instances `{rnd5_1}`…`{rnd5_9}` are each independent.
:::

## MaxParallelism

Maximum number of test files running concurrently; `0` means processor count. Each test file runs on its **own non-pooled physical connection** (fresh session — no temp-table, GUC, or prepared-statement carryover), so parallel files cannot see each other's uncommitted state.

## FailFast

Stop scheduling new tests after the first failure or error. In-flight tests still finish and are reported.

## PerTestTimeout

Per-test-file timeout. Accepts `"30s"`, `"5m"`, `"1h"`, a plain number of seconds, or `"hh:mm:ss"`. `0` disables. A timed-out file is reported as an **error** (exit code `2`).

## JUnitOutput

Optional path to also write a JUnit XML report — the standard CI artifact (GitHub Actions, GitLab, Jenkins all consume it). Console output is always printed regardless. Assertion names (the second column of a boolean-`SELECT` assertion) become the JUnit test-case names.

```json
{ "TestRunner": { "JUnitOutput": "./test-results.xml" } }
```

## Keep

Skip `Teardown` so a failed run's state (the test database, fixture rows) can be inspected. Remember to clean up manually — with `{rnd}`-named databases each kept run leaves one behind.

## DetailedReport

Richer console **report**: lists passed assertions (`✓`), prints the full failing SQL statement, and shows captured `raise notice` output for passing tests too (notices always show under failing tests).

This shapes the report only — for diagnostic logging of every executed query and HTTP invocation, raise the runner's log channel instead:

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Off",
      "NpgsqlRestClient": "Off",
      "NpgsqlRestTest": "Verbose"
    }
  }
}
```

## AllowEmpty

Treat "no tests discovered" as success (exit `0`) instead of exit `4`. Useful for repos where a test tree may legitimately be empty.

## Watch mode

Watch mode is enabled by the **top-level `Watch` configuration section** (`"Watch": { "Enabled": true }`) or its CLI shorthand `--watch` — it is not a `TestRunner` setting, because the same section drives both watch flavors (test watch with `--test`, server watch without). In test mode: run everything once, then re-run on changes until Ctrl+C.

- A changed **test file** re-runs alone (`Filter` still applies).
- A changed **endpoint file** (matching `SqlFileSource.FilePattern`) triggers an **in-process endpoint rebuild** — sources re-read, re-described, endpoint registry swapped atomically — followed by a full rerun, with the endpoint delta reported (`+ POST /api/new`, `- GET /api/x (endpoint dropped — check its SQL file for errors)`). To make this safe, watch mode forces `SqlFileSource.ErrorMode` from `Exit` to `Skip`; non-watch `--test` keeps `Exit` for CI.
- A **database routine change** (create/replace/drop/comment on functions or procedures, detected by polling the routine discovery query — `Watch:DatabasePollingInterval`, default `2s`) rebuilds endpoints and re-runs everything (`— change detected (database) —`).
- Any **other** changed `.sql` under the test tree (an included fixture or profile, whose dependents are unknown) re-runs everything.

`Teardown` runs **once, on exit** — synchronously inside the SIGINT/SIGTERM handler, so the test database is dropped even when the watch process is stopped through a wrapper like `bun run` or `npm run`; a second Ctrl+C force-quits. A graceful stop exits `0` regardless of test outcomes — watch is not for CI gating.

## Coverage and CoverageThreshold

Endpoint-coverage summary after the run: exercised N of M testable endpoints, plus the exact list of untested ones:

```
19 passed, 0 failed, 0 error(s)  —  19 assertions in 9 files

endpoint coverage: 2/2 (100%)
```

`Coverage` is tri-state:

| Value | Behavior |
|---|---|
| `null` (default) | Report after **full** runs; stay quiet when the run is narrowed by `Filter`/`Tag` (a deliberately partial run would just nag). |
| `true` | Always report, including narrowed runs. |
| `false` | Never report. |

`CoverageThreshold` (0–100) turns it into a **CI gate** — it always reports, regardless of `Coverage` or narrowing: an otherwise-passing run below the threshold exits `2`. Set it to `100` and forgetting to write a test for a new endpoint fails the build, naming the endpoint.

"Covered" means *invoked at least once by a test* — execution, not assertion depth (the same semantics as code coverage). Endpoint kinds the runner rejects (SSE, upload, login/logout, outbound proxy) are excluded from the ratio and counted separately.

## LoggerName

SourceContext name of the runner's own log channel (default `"NpgsqlRestTest"`); set its level independently under `Log:MinimalLevels`. Discovery and parsing log at `Debug`, each executed query and HTTP invocation at `Verbose`, `raise notice` output by its severity.

## ResponseTempTable

Each HTTP block's response is captured into its own **temp table** on the test's connection, created fresh (no `IF NOT EXISTS` — a duplicate name fails the test loudly).

| Setting | Default | Description |
|---|---|---|
| `Name` | `"_response"` | Table name when the file has **one** HTTP block. |
| `MultiNamePattern` | `"_response_{n}"` | Name pattern when the file has **2+** blocks; `{n}` is the 1-based block ordinal. |
| `DebugTable` | `null` | Debugging aid: also mirror every response into this **permanent** table (see below). |
| `Columns.Status` | `"status"` | `int` — HTTP status code. |
| `Columns.Body` | `"body"` | `text` — response body (cast to `::jsonb` to assert on JSON). |
| `Columns.ContentType` | `"content_type"` | `text` — response content type. |
| `Columns.Headers` | `"headers"` | `jsonb` — response headers. |
| `Columns.IsSuccess` | `"is_success"` | `boolean` — true for 2xx. |

A `null` or empty column name omits that column. A per-block override is available with the `# @response <name>` directive inside the HTTP block.

### DebugTable — inspect responses after the run

Temp tables vanish with the test's rollback and connection, so they cannot be examined afterwards — and re-issuing the request from an `.http` file cannot reproduce a response that depended on the test's **uncommitted fixtures**. Set `DebugTable` (e.g. `"_responses_debug"`) and every captured response is **also** mirrored into a permanent table, written on a separate autocommit connection — immune to rollbacks, recreated at the start of every run (it always holds the **last run**):

```sh
npgsqlrest ./config.json --test --testrunner:responsetemptable:debugtable=_responses_debug
```

**One table covers everything** — each HTTP block adds one row: `captured_at`, `test_file`, `block` (that block's response-table name: `_response`, a `_response_{n}` ordinal, or the `# @response` name), `method`, `path`, `status`, `body`, `content_type`, `headers`, `is_success`. After the run, open a query editor:

```sql
select test_file, block, status, body::jsonb
from _responses_debug
where status >= 400;
```

The temp-table semantics are unchanged; enabling it prints a loud warning — it is a debugging aid, **do not enable in CI**. In the fresh-test-database workflow combine it with [`Keep`](#keep), or teardown drops the database (and the mirror with it).

## Steps

Named, reusable steps (name → step object, same shape as `Setup`/`Teardown` entries). Reference them by name in `Setup`/`Teardown`, or from an individual test file's header annotations ([`-- @setup`](../annotations/test-setup), [`-- @teardown`](../annotations/test-teardown)):

```json
{
  "TestRunner": {
    "Steps": {
      "CreateDatabase": { "Sql": "create database app_test_{rnd5}", "ConnectionName": "Admin" },
      "ApplyMigrations": { "Command": "bun db up", "WorkingDirectory": "./db" },
      "DropDatabase": { "Sql": "drop database if exists app_test_{rnd5} with (force)", "ConnectionName": "Admin" }
    }
  }
}
```

A step object is one of:

| Shape | Runs |
|---|---|
| `{ "Sql": "..." }` | SQL text, statement by statement, on the test connection — or on any named `ConnectionStrings` entry via `"ConnectionName"`. |
| `{ "SqlFile": "..." }` | A SQL file, statement by statement, same connection rules. |
| `{ "Command": "...", "WorkingDirectory": "..." }` | An OS shell command — migration runners, Docker, `pg_dump`, anything. |

Referencing an unknown step name is a configuration error (exit `3`).

Every step also has an **`Enabled`** flag (default `true`): a disabled step is simply **ignored** wherever it is referenced — skipped with a debug log line, never an error. The default configuration ships **disabled example steps** covering the typical scenarios (create/drop a `{rnd}`-named test database, apply a schema file, run a migration tool, start/stop a Docker PostgreSQL) — copy one into your config, adjust names and connections, and flip `Enabled` to `true` instead of typing it from scratch:

```json
{
  "TestRunner": {
    "Steps": {
      "CreateTestDatabase":  { "Enabled": false, "ConnectionName": "Admin", "Sql": "create database app_test_{rnd5}" },
      "DropTestDatabase":    { "Enabled": false, "ConnectionName": "Admin", "Sql": "drop database if exists app_test_{rnd5} with (force)" },
      "ApplySchema":         { "Enabled": false, "SqlFile": "./migrations/schema.sql" },
      "RunMigrationTool":    { "Enabled": false, "Command": "echo replace with your migration tool command", "WorkingDirectory": "." },
      "StartDockerPostgres": { "Enabled": false, "Command": "docker run -d --name npgsqlrest-test-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres" },
      "StopDockerPostgres":  { "Enabled": false, "Command": "docker rm -f npgsqlrest-test-pg" }
    }
  }
}
```

## Setup and Teardown

Run-once lifecycle around the whole run. `Setup` runs **before endpoint discovery** — which is what makes the create-a-fresh-database workflow possible: by the time endpoints are described against `ConnectionName`, the database exists and is migrated. Steps run in the **exact order written**; each entry is a step name from `Steps` or an inline step object.

```json
{
  "TestRunner": {
    "Setup":    [ "CreateDatabase", "ApplyMigrations" ],
    "Teardown": [ "DropDatabase" ]
  }
}
```

`Teardown` runs **always** (best-effort), even when the run fails — and it is guaranteed beyond the happy path: from Setup onward the runner intercepts **SIGINT (Ctrl+C) and SIGTERM** and runs Teardown synchronously in the signal handler, and a **process-exit hook** covers hard exits (e.g. a broken endpoint SQL file under `SqlFileSource.ErrorMode: Exit`). `Keep: true` skips Teardown deliberately.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All tests passed (or a graceful watch-mode stop). |
| `1` | At least one assertion failed. |
| `2` | At least one error (SQL error, timeout, unsupported endpoint, an interrupted run, or a failed coverage gate). |
| `3` | Setup or configuration error. |
| `4` | No test files found (`AllowEmpty: true` turns this into `0`). |

## Related

- [Testing Guide](../guide/testing) — the full walkthrough with scenarios: transactions, fixtures, test databases, template clones, migrations, Docker, CI
- [Test file annotations](../annotations/test-setup) — `@setup`, `@teardown`, `@connection`, `@tag`
- [SQL File Source](./sql-file-source) — endpoint files and `SkipPattern`
- [Logging](./logging) — `Log:MinimalLevels`, including `"Off"` to mute a channel

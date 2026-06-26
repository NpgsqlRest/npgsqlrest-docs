---
outline: [2, 3]
title: "Testing Guide"
titleTemplate: NpgsqlRest
description: "Test NpgsqlRest endpoints with plain SQL files. In-process endpoint invocation, transactional isolation, test databases, template clones, migrations, Docker, watch mode, coverage, and CI."
head:
  - - meta
    - name: keywords
      content: npgsqlrest testing, sql test runner, postgresql api testing, test database, template database, test isolation, junit, endpoint coverage, watch mode
  - - meta
    - property: og:title
      content: "NpgsqlRest Testing Guide"
  - - meta
    - property: og:description
      content: "Test NpgsqlRest endpoints with plain SQL files — in-process, transactional, CI-ready."
  - - meta
    - property: og:type
      content: article
---

# Testing

NpgsqlRest ships a built-in **SQL test runner**: write tests for your endpoints as plain `.sql` files and run them with `npgsqlrest --test`. A test arranges data with ordinary SQL, invokes a real endpoint **in-process** (the complete pipeline — routing, authorization, parameter binding, execution, serialization — with no network and no running server), captures the response into a temp table, and asserts on it with ordinary SQL. Everything happens inside the test's own transaction, so tests leave no trace.

```sql
-- tests/get_users_excludes_caller.test.sql
begin;

-- ARRANGE

insert into app.users (id, email, name) values (100, 'x@example.com', 'Fixture');

-- ACT

/*
GET /api/get-users
# @claim user_id=1
*/

-- ASSERT

select status = 200, 'authenticated caller gets 200'
from _response;
select body::jsonb @> '[{"email": "x@example.com"}]', 'the fixture user is listed'
from _response;

rollback;
```

```
NpgsqlRest test runner — 9 file(s)
PASS  tests/get_users_excludes_caller.test.sql  (2 assertions, 52ms)
...
19 passed, 0 failed, 0 error(s)  —  19 assertions in 9 files

endpoint coverage: 2/2 (100%)
```

This guide covers the full feature. The configuration reference lives at [Test Runner configuration](../config/test-runner); three complete working projects live in the repository: [`examples/19_testing_basic`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/19_testing_basic), [`examples/20_testing_newdb`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/20_testing_newdb), and [`examples/21_testing_isolation`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/21_testing_isolation).

## Quick start

1. Put a test file next to your endpoint SQL (the *co-located* layout):

```sql
-- sql/normalize_email.sql  (the endpoint)
/*
HTTP GET
*/
select lower(trim(:email)) as normalized;
```

```sql
-- sql/normalize_email.test.sql  (the test)
/*
GET /api/normalize-email?email=%20X%40Y.z%20
*/
select status = 200, 'endpoint responds' from _response;
select body::jsonb ->> 0 = 'x@y.z', 'trims and lowercases' from _response;
```

2. Point the runner at the tests:

```json
{
  "TestRunner": {
    "FilePattern": "./sql/**/*.test.sql"
  }
}
```

3. Run:

```sh
npgsqlrest ./config.json --test
```

That's the whole setup. Test files are automatically **excluded from endpoint discovery** — [`SqlFileSource.SkipPattern`](../config/sql-file-source) defaults to `"*.test.sql"` — so an HTTP block inside a test is never mistaken for an endpoint annotation.

## How it works

In `--test` mode the client builds the full endpoint middleware exactly as in normal operation — endpoints from database routines and/or SQL files, authentication, custom parameters, everything — but instead of starting the web server it runs the test files and exits with a result code.

The critical property is **connection affinity**: an endpoint invoked from a test runs on the *test's own connection*, inside the *test's own transaction*. A test can `begin`, insert fixture rows, call an endpoint that **sees those uncommitted rows**, assert on the response, and `rollback` — the database is untouched afterwards. Each test file gets its own **non-pooled** physical connection (fresh session: no temp-table, GUC, or prepared-statement carryover), and files run **in parallel** (`MaxParallelism`, default = processor count). If a file never rolls back, closing its physical connection aborts the open transaction — that is the safety net.

Test-mode invariants, applied automatically:

- `WrapInTransaction` is forced off — the test file owns transaction control; the runner never injects `BEGIN`/`COMMIT`/`ROLLBACK`.
- Response caching is disabled — a test never sees another test's cached response.
- Code generation (HTTP files, TypeScript client, OpenAPI) is skipped — a test run never rewrites generated artifacts.

## Test file anatomy

A test file is a sequence of SQL statements and HTTP blocks, executed strictly **in order**, **statement by statement** (like `psql`): each statement runs in autocommit unless the file opens its own transaction. Semicolon splitting understands comments, string literals with `''` escapes, and dollar-quoted bodies — a `do $$ … $$;` block stays whole.

### Assertions

A reported test is one of:

**A boolean-returning `SELECT`.** If the first column is `boolean`, the statement is an assertion: the first row's value must be true (`false` or `null` fails; zero rows passes vacuously). The optional **second column is the assertion's name**, shown in the report and used as the JUnit test-case name:

```sql
select count(*) = 3, 'exactly three users are seeded' from app.users;
```

**A `do` block.** Passes unless it raises — `assert` inside a DO block raises SQLSTATE `P0004`, reported as a failure with the assert message. One DO block = one reported test:

```sql
do $$ begin
    assert app.normalize_email(' X@Y.z ') = 'x@y.z', 'should trim and lowercase';
end $$;
```

Any other statement is *arrange/act* — not counted; it only surfaces if it errors. Any SQL error (other than an assert) is reported as an **error** with its SQLSTATE, message, statement text, and `file:line`.

Failing behavior is **fail-fast per file**: after the first failed/errored assertion the rest of the file does not run. Assertions that passed before the failure are still credited.

### HTTP blocks: invoking endpoints

An HTTP request is embedded in a **block comment** whose first content line is a request line — a single-request subset of the standard `.http` file syntax:

```sql
/*
POST /api/create-user
Content-Type: application/json
# @claim user_id=42
# @claim roles=admin
# @response created

{"name": "Grace Hopper", "email": "grace@example.com"}
*/
```

- **Request line:** `[HTTP] METHOD /path[?query] [HTTP/x]` — method is `GET`/`POST`/`PUT`/`DELETE`; the path must equal the endpoint's full path **including `UrlPathPrefix`** (default `/api`). A block comment whose first line is not a valid request line is an ordinary comment — ignored.
- **Headers:** `Name: Value` lines after the request line.
- **Directives** (before the body): [`# @claim name=value`](../annotations/test-claim) sets the acting principal (repeatable; no `@claim` = anonymous), [`# @response name`](../annotations/test-response) names the captured response table.
- **Body:** everything after the first **blank line**, verbatim.

An HTTP block is an **act** step, not an assertion — the assertions are the SQL statements that follow it. One request per block; use multiple blocks for multiple calls.

Endpoint kinds that cannot work in-process are rejected with a clear error: **SSE**, **upload**, **login/logout** (inject the principal with `# @claim` instead), and **outbound proxy/HTTP-type** endpoints (tests must not call external services). A request whose path matches **no endpoint** still runs — a test may assert a 404 deliberately — but logs a warning, since the most common cause is a path typo or a missing `/api` prefix.

### The response table

Each HTTP block's response lands in its own fresh temp table on the test's connection — default `_response` (one block per file) or `_response_1`, `_response_2`, … (several). Columns: `status int`, `body text`, `content_type text`, `headers jsonb`, `is_success boolean` — all [configurable](../config/test-runner#responsetemptable). Need to *see* a captured response after the run (temp tables vanish with the rollback)? Set [`ResponseTempTable.DebugTable`](../config/test-runner#debugtable-—-inspect-responses-after-the-run) to mirror every response into a permanent, query-editor-friendly table.

```sql
select status = 200, 'status ok' from _response;
select body::jsonb ->> 'email' = 'x@y.z', 'right user returned' from _response;
select headers ->> 'Content-Type' like 'application/json%', 'json response' from _response;
```

### Transactions: when to `begin`/`rollback`

The file owns transaction control. Two patterns:

- **The test writes something** → wrap it: `begin; … rollback;`. Everything — fixtures *and* endpoint writes — is discarded.
- **The test only reads** → no transaction needed at all. Don't cargo-cult `begin`/`rollback` onto read-only tests.

One caveat worth knowing: **sequences are non-transactional**. Every `nextval()` sticks even through `rollback`, so on a shared database a generated id depends on what ran before. Don't assert generated ids on a shared database — or give the test its own database (see [per-test isolation](#scenario-template-database-and-per-test-isolation) below).

### Fixtures without inserting the whole database: deferrable constraints

The classic fixture problem: to insert one `orders` row you need a `user`, which needs a `company`, which needs a `country`… and suddenly every test starts by populating half the schema. PostgreSQL solves this elegantly — and the rollback-based test pattern is exactly the situation the solution was made for.

Declare foreign keys **`deferrable`** in your schema:

```sql
create table posts (
    id int primary key,
    user_id int references users (user_id) deferrable,
    content text not null
);
```

Then a test defers the checks and inserts **only what it needs** — in any order, referencing rows that never exist:

```sql
begin;

set constraints all deferred;

-- one post by a user that is never inserted — legal, because the FK check
-- would run at COMMIT, and this transaction never commits
insert into posts (id, user_id, content) values (1, 999, 'fixture post');

/*
GET /api/get-posts
*/
select body::jsonb -> 0 ->> 'content' = 'fixture post', 'fixture is served' from _response;

rollback;
```

Deferrable constraints are checked at **`COMMIT`** — and a test that ends in `rollback` never gets there, so the checks simply never run. No fixture factories, no dependency-ordered builders, no "insert the world" preamble: each test states exactly the rows it is about, and the endpoint's `LEFT JOIN`s resolve the missing references to `null` just as they would for genuinely absent data.

Two things to know:

- The constraint must be **declared** `deferrable` — `set constraints all deferred` has no effect on the default `NOT DEFERRABLE` constraints. Making FKs deferrable is a one-time schema decision that costs nothing in production (they still check at commit).
- This composes with the ordinary fixture style: insert the full graph in dependency order when the test is *about* the graph, and defer when it isn't. [Example 20](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/20_testing_newdb) demonstrates both side by side, and the [end-to-end type checking post](/blog/end-to-end-static-type-checking-postgresql-typescript) covers the technique in depth.

## Reusing SQL: includes

Test files support psql-style includes: `\i path` (cwd-relative) and `\ir path` (relative to the including file). Semantics are **as if you pasted the content yourself**: SQL statements *and* HTTP blocks are spliced in place, run on the test's connection inside its transaction, and HTTP blocks participate in response-table numbering.

```sql
begin;

\ir fixtures/extra_users.sql   -- reusable fixture, rolls back with the test

/*
GET /api/get-users
# @claim user_id=1
*/
select jsonb_array_length(body::jsonb) = 5,
       'three seeded + two fixture users are listed'
from _response;

rollback;
```

An included file that contains **only comments** is an *annotation profile*: included in a file's header, its annotations (`@setup`, `@teardown`, `@connection`, `@tag`) count as if written in-place — one shared profile can configure a whole family of tests. Includes nest (up to 16 levels), and cycles are detected and reported.

**Pattern: schema-relaxing system scripts.** Because PostgreSQL DDL is **transactional**, an include can temporarily *reshape the schema* for the test — and the rollback restores everything. The classic use: a shared script that drops `NOT NULL` from columns that are irrelevant to most tests, so fixtures only mention the columns they are actually about:

```sql
-- fixtures/relax_users.sql — make the noise columns optional for this test only
alter table users alter column legal_name drop not null;
alter table users alter column billing_address drop not null;
alter table users alter column marketing_consent drop not null;
```

```sql
begin;
\ir fixtures/relax_users.sql

-- insert ONLY what this test is about — the relaxed columns stay null
insert into users (id, email) values (100, 'fixture@example.com');

/*
GET /api/get-users
# @claim user_id=1
*/
select body::jsonb @> '[{"email": "fixture@example.com"}]', 'fixture listed' from _response;

rollback;   -- the ALTERs roll back too — the schema is untouched
```

This composes with [deferrable constraints](#fixtures-without-inserting-the-whole-database-deferrable-constraints): defer the FKs, relax the `NOT NULL`s, and a fixture shrinks to exactly the columns and rows under test. One caveat: `ALTER TABLE` takes an exclusive lock until the transaction ends, so on a **shared** test database this serializes parallel tests touching the same table — it shines with [per-test isolated databases](#scenario-template-database-and-per-test-isolation), where the lock contends with nobody.

## Per-file annotations

Four header annotations (leading `--` comments before the first statement) configure an individual file — see their reference pages for details:

| Annotation | Effect |
|---|---|
| [`-- @setup Step [Step ...]`](../annotations/test-setup) | Run named steps before this file. |
| [`-- @teardown Step [Step ...]`](../annotations/test-teardown) | Run named steps after this file — always. |
| [`-- @connection Name`](../annotations/test-connection) | Run this file (SQL + endpoint calls) on a named connection. |
| [`-- @tag name [name ...]`](../annotations/test-tag) | Tag the file for `Tag`/`ExcludeTag` filtering. |

All are repeatable; names may be whitespace- or comma-separated; steps run in written order.

## Setup, Teardown, and named steps

`TestRunner.Setup` runs once **before endpoint discovery**; `TestRunner.Teardown` runs once at the end — **always**, best-effort, even on failure, Ctrl+C, SIGTERM, or a hard startup error. Steps run in the exact order written. Each step is either an inline object or a **name** from the reusable `Steps` registry:

```json
{
  "TestRunner": {
    "Steps": {
      "CreateDatabase":  { "Sql": "create database app_test_{rnd5}", "ConnectionName": "Admin" },
      "ApplyMigrations": { "Command": "bun db up", "WorkingDirectory": "." },
      "DropDatabase":    { "Sql": "drop database if exists app_test_{rnd5} with (force)", "ConnectionName": "Admin" }
    },
    "Setup":    [ "CreateDatabase", "ApplyMigrations" ],
    "Teardown": [ "DropDatabase" ]
  }
}
```

Three step shapes:

- `{ "Sql": "..." }` — SQL text, statement by statement, on the test connection or any named `ConnectionStrings` entry (`"ConnectionName"`). This is how `create database` works as a plain step — the runner never issues DDL on its own.
- `{ "SqlFile": "..." }` — same, from a file.
- `{ "Command": "...", "WorkingDirectory": "..." }` — an OS shell command.

Every step also has an `"Enabled"` flag (default `true`): a disabled step is **ignored wherever referenced** — never an error. That's how the default configuration ships ready-made [example steps](../config/test-runner#steps) (create/drop a test database, apply a schema file, run a migration tool, start/stop a Docker PostgreSQL) that you copy and flip on instead of typing.

**Random tokens:** `{rnd1}`…`{rnd10}` are random lowercase tokens (length = the digit), generated once, **stable for the entire run**, and substituted in connection strings and Setup/Teardown SQL alike — so the same unique database name lands in the connection string, the create step, and the drop step. `{rndN_1}`…`{rndN_9}` are independent instances for when several distinct names of the same length are needed.

The scenarios below are all combinations of these pieces.

## Scenario: dedicated test database per run

Run every test against a **fresh database created for this run** — the app's real database is never touched. This is [`examples/20_testing_newdb`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/20_testing_newdb) in full:

```json
{
  "ConnectionStrings": {
    "Admin": "Host=localhost;Database=postgres;Username=postgres;Password=...",
    "Test":  "Host=localhost;Database=app_test_{rnd5};Username=postgres;Password=..."
  },
  "TestRunner": {
    "FilePattern": "./tests/**/*.test.sql",
    "ConnectionName": "Test",
    "Steps": {
      "CreateDatabase": { "Sql": "create database app_test_{rnd5}", "ConnectionName": "Admin" },
      "ApplyMigrations": { "Command": "bun db up --config=./db.js" },
      "DropDatabase": { "Sql": "drop database if exists app_test_{rnd5} with (force)", "ConnectionName": "Admin" }
    },
    "Setup":    [ "CreateDatabase", "ApplyMigrations" ],
    "Teardown": [ "DropDatabase" ]
  }
}
```

The flow: Setup creates `app_test_xxxxx` on the Admin connection and migrates it → endpoints are discovered and type-checked **against that database** (`ConnectionName: "Test"`) → tests run → Teardown drops it. `{rnd5}` guarantees parallel CI jobs never collide.

Keep the test configuration in a separate overlay file so the same project runs normally without it:

```sh
npgsqlrest ./config.json ./test-config.json --test
```

## Scenario: template database and per-test isolation

For tests that need **complete isolation** — deterministic sequence ids, exclusive locks, destructive DDL — clone a **template database** per test file. This is [`examples/21_testing_isolation`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/21_testing_isolation):

```json
{
  "ConnectionStrings": {
    "Admin":     "...Database=postgres...",
    "Test":      "...Database=app_test_{rnd5}...",
    "Isolated1": "...Database=app_iso_{rnd5_1}...",
    "Isolated2": "...Database=app_iso_{rnd5_2}..."
  },
  "TestRunner": {
    "ConnectionName": "Test",
    "Steps": {
      "CreateTemplate":    { "Sql": "create database app_template_{rnd5}", "ConnectionName": "Admin" },
      "MigrateTemplate":   { "Command": "bun db up --db=app_template_{rnd5}" },
      "CreateTestDb":      { "Sql": "create database app_test_{rnd5} template app_template_{rnd5}", "ConnectionName": "Admin" },
      "DropTestDb":        { "Sql": "drop database if exists app_test_{rnd5} with (force)", "ConnectionName": "Admin" },
      "DropTemplate":      { "Sql": "drop database if exists app_template_{rnd5} with (force)", "ConnectionName": "Admin" },
      "CreateIsolatedDb1": { "Sql": "create database app_iso_{rnd5_1} template app_template_{rnd5}", "ConnectionName": "Admin" },
      "DropIsolatedDb1":   { "Sql": "drop database if exists app_iso_{rnd5_1} with (force)", "ConnectionName": "Admin" }
    },
    "Setup":    [ "CreateTemplate", "MigrateTemplate", "CreateTestDb" ],
    "Teardown": [ "DropTestDb", "DropTemplate" ]
  }
}
```

Migrations run **once** (into the template); every clone is a byte-identical, instant copy (`CREATE DATABASE ... TEMPLATE` is a file-level copy — milliseconds for a schema-sized database). Most tests share the run database; a test that needs isolation attaches its own clone with header annotations:

```sql
-- @setup CreateIsolatedDb1
-- @teardown DropIsolatedDb1
-- @connection Isolated1
-- @tag isolation, slow

/*
POST /api/create-user
Content-Type: application/json

{"name": "Ada", "email": "ada@example.com"}
*/
select body::jsonb ->> 'id' = '4',
       'sequence ids are deterministic in a fresh clone'
from _response;
```

The classic motivation is **sequences**: `nextval()` survives `rollback`, so on a shared database this assertion would depend on run order — in a private clone it is exact. The indexed tokens (`{rnd5_1}`, `{rnd5_2}`) let several isolated tests hold their own clone *simultaneously* under parallel execution. Put the three annotations in a shared profile (`\ir shared/isolated_database.sql`) and attaching isolation to a test becomes a one-liner.

## Scenario: external migration runners

`Command` steps run anything — so any migration tool works as-is. The step inherits the process environment plus the run's `{rnd}` substitutions in its command line:

```json
// EF Core
{ "Command": "dotnet ef database update --connection \"Host=localhost;Database=app_test_{rnd5};...\"" }

// Django
{ "Command": "python manage.py migrate", "WorkingDirectory": "./backend" }

// Flyway
{ "Command": "flyway -url=jdbc:postgresql://localhost/app_test_{rnd5} migrate" }

// psql — plain SQL migrations, no tooling at all
{ "Command": "psql -d app_test_{rnd5} -f ./migrations/schema.sql" }
```

Or skip external tools entirely: `SqlFile` steps run migration scripts statement-by-statement on any named connection — no client tooling required in the CI image.

## Scenario: Docker

Because `Setup`/`Teardown` are ordered shell commands, the runner can own the **entire database lifecycle**, container included:

```json
{
  "TestRunner": {
    "Setup": [
      { "Command": "docker run -d --name npgsqlrest-test-pg -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:17" },
      { "Command": "until docker exec npgsqlrest-test-pg pg_isready -U postgres; do sleep 0.3; done" },
      "CreateDatabase",
      "ApplyMigrations"
    ],
    "Teardown": [
      { "Command": "docker rm -f npgsqlrest-test-pg" }
    ]
  }
}
```

Point the connection strings at `Port=54329` and the whole test run is hermetic: `npgsqlrest --test` starts PostgreSQL, builds the schema, runs the tests, and removes the container — pass or fail.

## Scenario: testing least-privilege (PoLP) setups

When the application connects as a restricted role, use **two connections deliberately**: fixtures and DDL on the Admin connection (via `@setup` steps or `Setup`), while the tests — and the endpoints they invoke — run as the restricted application role (`TestRunner.ConnectionName`). A test then proves not just behavior but **permissions**: if the app role is missing a grant, the endpoint fails in the test exactly as it would in production. An expected-denial test asserts the error directly:

```sql
/*
POST /api/admin-only-report
# @claim user_id=7
*/
select status = 404, 'restricted role cannot reach the admin endpoint'
from _response;
```

## Filtering and tags

Iterating on one test — `Filter` matches the cwd-relative path (substring, or glob with wildcards):

```sh
npgsqlrest ./config.json --test --testrunner:filter=login
```

Suites — files declare [`-- @tag`](../annotations/test-tag) and runs narrow by tag (case-insensitive; exclude wins; composes with `Filter`):

```sh
npgsqlrest ./config.json --test --testrunner:tag=smoke --testrunner:excludetag=slow
```

## Watch mode

```sh
npgsqlrest ./config.json --test --watch
```

Runs everything once, then re-runs on changes until Ctrl+C (`--watch` is the shorthand for the top-level [`Watch:Enabled`](../config/watch) setting):

- a changed **test file** re-runs alone (typically tens of milliseconds);
- a changed **endpoint file** rebuilds the endpoints **in-process** and re-runs everything, printing the endpoint delta — break an endpoint's SQL and you immediately see `- GET /api/get-users (endpoint dropped — check its SQL file for errors)` plus the failing tests; fix it and the next save brings it back. No restart, ever;
- a **database routine change** — `create or replace`/`drop`/`comment on` a function in psql, or a migration touching routines — rebuilds endpoints and re-runs everything too (`— change detected (database) —`). Detection polls the routine discovery query itself, hashed server-side (every `2s` by default; [`Watch:DatabasePollingInterval`](../config/watch#databasepollinginterval)), so it fires exactly when the discovered endpoints change and never on unrelated tables or temp objects;
- any other changed `.sql` under the test tree (a fixture whose dependents are unknown) re-runs everything.

Teardown runs once on exit — Ctrl+C and SIGTERM are intercepted and the test database is still dropped, even under wrappers like `bun run`/`npm run`. A graceful stop exits `0`: watch is a dev loop, not a CI gate.

::: tip Server watch
The same flag without `--test` watches the **running server**: `npgsqlrest ./config.json --watch` restarts it on SQL file, configuration, and database routine changes, regenerating the TypeScript client and HTTP files on every cycle. See [Watch Mode configuration](../config/watch).
:::

## Endpoint coverage

The runner knows the **entire API surface** it built *and* records every endpoint the tests invoked — so after a full run it reports the API-level analogue of code coverage, naming the endpoints no test touches:

```
endpoint coverage: 3/4 (75%)
        untested: POST /api/delete-user
```

On by default for full runs (one line); suppressed automatically when the run is narrowed by `Filter`/`Tag`; forced with `Coverage: true` / silenced with `false`. **`CoverageThreshold: 100`** turns it into a CI gate: an otherwise-green run that misses an endpoint exits `2` — forgetting to write a test for a new endpoint fails the build, by name. "Covered" means invoked at least once; untestable kinds (SSE, upload, login/logout, outbound proxy) are excluded from the ratio.

## Reporting, logging, CI

**Console report:** `PASS`/`FAIL`/`ERROR` per file with per-assertion detail on failure (name, `file:line`, failing statement). `DetailedReport: true` additionally lists passed assertions, full failing SQL, and captured `raise notice` output. Colors match the Serilog console theme and are stripped automatically when output is piped.

**Log channel:** the runner logs on its own `NpgsqlRestTest` channel — discovery at `Debug`, every executed statement and HTTP invocation at `Verbose`, `raise notice` by severity. Typical dev setup — mute the app, watch the tests:

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Off", "NpgsqlRestClient": "Off", "NpgsqlRestTest": "Verbose" } } }
```

**JUnit XML** for CI (`JUnitOutput: "./test-results.xml"`) — assertion names become test-case names. **Exit codes**: `0` pass · `1` failures · `2` errors / coverage gate · `3` setup/config error · `4` no tests found. A minimal GitHub Actions job:

```yaml
- run: npgsqlrest ./config.json ./test-config.json --test --testrunner:junitoutput=results.xml
- uses: dorny/test-reporter@v1
  if: always()
  with: { name: SQL tests, path: results.xml, reporter: java-junit }
```

## Troubleshooting

- **`no endpoint matches GET /api/x — the response will be a 404`** — path typo or missing `UrlPathPrefix` (default `/api`) in the request line.
- **`PASS ... (no assertions)`** (flagged) — the file ran but contained no boolean-`SELECT`/DO-block assertion; check that your assert's *first column* is a boolean.
- **A test passes alone but fails in the full run** — shared-state leak: an uncommitted-fixture assumption, a committed write without `rollback`, or a sequence-id assertion on a shared database. Wrap writes in `begin`/`rollback`, or isolate the test with a per-file clone.
- **Unsupported endpoint error** — SSE/upload/login/logout/proxy endpoints cannot be invoked in-process by design; test login flows by injecting `# @claim` instead.
- **Leftover `*_{rnd}` databases** — a run was killed with SIGKILL (nothing can intercept that), or `Keep: true` was on. Drop them manually; every graceful path (including Ctrl+C, SIGTERM, and hard startup errors) tears down automatically.

## Reference

- [Test Runner configuration](../config/test-runner) — every option
- Annotations: [`@setup`](../annotations/test-setup) · [`@teardown`](../annotations/test-teardown) · [`@connection`](../annotations/test-connection) · [`@tag`](../annotations/test-tag) · [`@claim`](../annotations/test-claim) · [`@response`](../annotations/test-response)
- [SQL File Endpoints](./sql-files) — the endpoints being tested
- [Changelog v3.19.0](./changelog/v3.19.0) — the complete feature announcement

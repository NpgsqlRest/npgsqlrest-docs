# Example 21 — per-test database isolation with template clones

Builds on [example 20](../20_testing_newdb) and demonstrates the test runner's **reuse and isolation**
features working together:

1. **Named steps** (`TestRunner.Steps`) — define create/migrate/drop operations once, reference them by
   name from the global `Setup`/`Teardown` *and* from individual test files (mixed freely with inline
   step objects, including a shell **`Command`** step).
2. **Per-file setup/teardown/connection** — header annotations give a single test file its **own database**,
   cloned from a template, for perfect isolation. Two isolated tests run in parallel, each in its own clone,
   named apart by the **indexed random tokens** `{rnd5_1}`/`{rnd5_2}`.
3. **Script includes** (`\ir`) — reusable fixture SQL spliced into a test inside its transaction, and a
   shared annotation **profile** attached with one include line.

```
bun run test           # template → clones → run tests (two tests in their own clones) → drop everything
bun run local-test     # same, with the local NpgsqlRest build
```

## Why per-test isolation? Sequences.

Transaction rollback is the runner's default isolation — and it is almost always enough. But **sequences
are non-transactional**: every `nextval()` sticks, even when the transaction rolls back. On a shared test
database, "what id will the next insert get?" is unanswerable — it depends on every test that ever inserted,
including rolled-back ones. The same applies to anything else outside transactional semantics.

The fix is a **fresh database cloned from a template** for exactly the tests that need it:

- `tests/create_user_returns_the_new_user.test.sql` runs on the **shared** test database and deliberately
  does *not* assert the generated id (the comment explains why).
- `tests/create_user_ids_are_deterministic.test.sql` runs in its **own clone** and proves the ids are
  exactly **4 and 5** (template seeds users 1–3 and sets the sequence to 3).
- `tests/clones_are_independent.test.sql` runs in a **second clone** and *also* gets id **4** — possible
  only because each isolated test has its own database.

## The template workflow

The migration is applied **once** to a template database; everything else is a near-instant file-level
clone (`create database … template …`). All of it is plain configuration — the runner issues no DDL:

```jsonc
// test-config.json
"TestRunner": {
  "ConnectionName": "Test",
  "Steps": {
    "CreateTemplate":    { "Sql": "create database example_21_template_{rnd5}", "ConnectionName": "Admin" },
    "MigrateTemplate":   { "SqlFile": "./21_testing_isolation/migrations_21/R__example_21_schema.sql", "ConnectionName": "Template" },
    "CreateTestDb":      { "Sql": "create database example_21_test_{rnd5} template example_21_template_{rnd5}", "ConnectionName": "Admin" },
    "DropTestDb":        { "Sql": "drop database if exists example_21_test_{rnd5} with (force)", "ConnectionName": "Admin" },
    "DropTemplate":      { "Sql": "drop database if exists example_21_template_{rnd5} with (force)", "ConnectionName": "Admin" },
    "CreateIsolatedDb1": { "Sql": "create database example_21_iso_{rnd5_1} template example_21_template_{rnd5}", "ConnectionName": "Admin" },
    "DropIsolatedDb1":   { "Sql": "drop database if exists example_21_iso_{rnd5_1} with (force)", "ConnectionName": "Admin" },
    "CreateIsolatedDb2": { "Sql": "create database example_21_iso_{rnd5_2} template example_21_template_{rnd5}", "ConnectionName": "Admin" },
    "DropIsolatedDb2":   { "Sql": "drop database if exists example_21_iso_{rnd5_2} with (force)", "ConnectionName": "Admin" }
  },
  "Setup": [
    { "Command": "echo preparing run: template=example_21_template_{rnd5} clones={rnd5_1},{rnd5_2}" },
    "CreateTemplate", "MigrateTemplate", "CreateTestDb"
  ],
  "Teardown": ["DropTestDb", "DropTemplate"]
}
```

Three things this config demonstrates beyond the clone workflow itself:

- **A `Command` step** — the first Setup entry runs via the OS shell, with `{rnd}` placeholders substituted
  in the command text too. Here it just echoes the run's database names; in a real project this slot is
  where `docker run` + a `pg_isready` wait, or an external migrator (EF Core, Django, Flyway) would go.
  Command output goes to the `NpgsqlRestTest` log channel at `Debug` — this example's `test-config.json`
  sets that channel to `Debug` so you can watch the run's lifecycle (steps, clones, outcomes); the default
  level (`Information`) keeps runs quiet.
- **Name references and inline step objects mix freely** in the same `Setup` array.
- **Indexed random tokens** — `{rnd5}`, `{rnd5_1}` and `{rnd5_2}` are three *independent* 5-character tokens
  (`{rndN_1}`–`{rndN_9}` exist for every length), each stable for the whole run. The two isolated tests get
  *different* clone names from the same naming pattern, so both databases coexist in one run.

One rule to know: **a template must have no active connections while it is being cloned.** That is why the
template is migrated over its own short-lived connection in Setup and never touched again — Setup/Teardown
step connections are non-pooled and close as soon as the step finishes. (Two clones *can* be created from
the same template concurrently — the parallel isolated tests in this example do exactly that.)

## Giving one test its own database

An isolated test opts in with three header annotations (leading `--` comments, before any statement):

```sql
-- @setup CreateIsolatedDb1
-- @teardown DropIsolatedDb1
-- @connection Isolated1

/*
POST /api/create-user
Content-Type: application/json

{"name": "First In Clone", "email": "first@example.com"}
*/
select (body::jsonb ->> 'id')::int = 4,
       'first created user gets id 4 (seeded 1..3, sequence at 3)'
from _response_1;
```

- `-- @setup CreateIsolatedDb1` — runs the named step **before this file** (clones the template).
- `-- @connection Isolated1` — runs this file, **including its in-process endpoint calls**, on the
  `Isolated1` connection (the clone). The endpoints were type-checked against the shared test database, and
  the clone has the identical schema, so everything just works.
- `-- @teardown DropIsolatedDb1` — drops the clone **after this file, always** (even on failure), after the
  file's connection is closed.

And since includes behave **as if pasted**, the whole set can live in a shared **profile file** —
`tests/shared/isolated_database.sql` holds exactly those three annotation lines — and a test attaches it
with a single include, which is what `create_user_ids_are_deterministic.test.sql` actually does:

```sql
\ir shared/isolated_database.sql
```

No `begin`/`rollback` in this file — the whole database is disposable, which is the strongest isolation
there is.

**Two clones, proven independent.** A second isolated test, `clones_are_independent.test.sql`, declares its
three annotations inline (both styles work) and uses the *second* clone (`Isolated2` /
`example_21_iso_{rnd5_2}`). Both isolated tests assert the very same generated id — **4** — which can only
hold if each runs against its own fresh clone; on any shared database one of them would observe the other's
sequence consumption. They run in parallel, cloning the same template concurrently.

## Reusing fixture SQL with includes

`tests/get_users_lists_seed_and_fixture.test.sql` splices a shared fixture in place:

```sql
begin;

\ir fixtures/extra_users.sql

/*
GET /api/get-users
*/
select jsonb_array_length(body::jsonb) = 5,
       'three seeded + two fixture users are listed'
from _response;

rollback;
```

`\ir` (relative to the including file; `\i` is cwd-relative — psql semantics) replaces the line with the
included file's statements, executed **on the test's connection, inside its transaction** — so the fixture
rolls back with the test, and there is no copy-paste. Failures inside an included file are reported with
the *included* file's name and line.

## Key ideas

- **Rollback is the default isolation; clones are the escalation.** Use `begin … rollback` (plus `\ir`
  fixtures) for everything transactional; reach for a per-test clone only when non-transactional state
  (sequences, committed side effects) must be exact.
- **Named steps make isolation cheap to express.** Define the clone/drop pair once; any test file can opt
  in with two header lines.
- **Everything is disposable and self-cleaning.** All databases carry per-run random tokens (`{rnd5}` for
  the template and shared test database, the independent `{rnd5_1}`/`{rnd5_2}` for the two clones), created
  in Setup or per-file setup, dropped in teardown — a run leaves nothing behind.
- **Tags ride along with the profile.** The shared-DB tests are tagged `smoke`; the clone tests are tagged
  `isolation, slow` — and the profile-based test carries those tags **through the include** (the profile
  file declares `-- @tag isolation, slow`; includes behave as if pasted). The everyday dev loop skips the
  slower clone tests with `bun run local-test -- --testrunner:excludetag=slow`; run only the isolation
  proofs with `--testrunner:tag=isolation`.

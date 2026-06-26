# Example 20 — SQL test runner with a fresh test database + deferrable fixtures

Builds on [example 19](../19_testing_basic) and adds the pieces you need for real integration tests:

1. **A dedicated test database**, created fresh for the test session and dropped afterwards — so tests never
   touch your development/production database.
2. **Fixtures via deferrable constraints** — a test inserts *only the rows it needs*, in any order, even when
   foreign keys would normally forbid it.
3. **Authorization + user parameters** — endpoints run as an authenticated caller, and a server-filled
   `_user_id` (from a claim, never the client) shapes the result.

```
bun run test           # creates a fresh test DB, runs the tests, drops it
bun run local-test     # same, but builds & runs the local NpgsqlRest build
bun run db:up          # one-time: provision the DB so `bun run dev` can serve it (dev is secondary here)
```

## Project + config layout

```
20_testing_newdb/
├─ config.json          # the application: connections, auth, SqlFileSource (./sql)
├─ test-config.json     # test-only overlay: logging + the TestRunner block (./tests)
├─ sql/                 # ENDPOINTS only — get_users.sql, login.sql
├─ tests/               # TESTS only — one file per test (see below)
└─ migrations_20/       # schema + seed (R__example_20_schema.sql)
```

Unlike [example 19](../19_testing_basic) (which co-locates `foo.sql` + `foo.test.sql`), example 20 keeps
**tests in their own `tests/` tree**, separate from the endpoint files in `sql/`. Two payoffs: the endpoint
glob (`sql/**/*.sql`) can never pick up a test file, so **no `SkipPattern` is needed**; and tests are free to
be named by *scenario* and span several endpoints rather than mapping 1:1 to a file. (Co-location is equally
valid — both are just a `TestRunner.FilePattern` glob; pick whichever fits your project.)

### One test per file (Arrange / Act / Assert)

Each file in `tests/` is exactly **one test with one HTTP call** — the *Act*. Everything before it is
*Arrange* (the fixture); everything after is *Assert*. A file can still contain several `select ..., '...'`
assertion statements about that one call's response — that's normal (one test, several checks on one act) —
but never a second HTTP block. This mirrors ordinary unit-test discipline (one behavior per test) and keeps
each test's name, fixture, and failure self-contained: a failing file tells you exactly which single call and
which single expectation broke, with nothing else to rule out.

The alternative — several HTTP calls (and scenarios) in one file, as [example 19](../19_testing_basic)'s
`create_user.test.sql` does — is also legitimate and reads more like a step-by-step user story. Pick whichever
fits the test; this example deliberately standardizes on one-act-per-file to demonstrate it.

The config is also split so test plumbing never leaks into the application config:

- **`config.json`** — the application: `ConnectionStrings` (`Admin`, `Test`), `RequiresAuthorization: true`,
  `AuthenticationOptions` (claims → parameters), and `SqlFileSource` (`./sql`, no `SkipPattern`).
- **`test-config.json`** — a test-only overlay: quiet logging + the whole `TestRunner` block
  (`ConnectionName`, `FilePattern: ./tests/**/*.test.sql`, Setup/Teardown). Layered on **only** for `--test`
  runs (see `package.json`: `… ./config.json ./20_testing_newdb/config.json ./20_testing_newdb/test-config.json --test`).

## The schema (`migrations_20/R__example_20_schema.sql`)

Four related tables — `countries`, `roles`, `users` (→ roles), `addresses` (→ users, → countries) — plus a
few seed rows. **Every foreign key is `DEFERRABLE INITIALLY IMMEDIATE`.** Normal writes are still checked
immediately; the deferral only matters inside a test that opts into it.

## A fresh test database per run (no DDL in the runner)

The runner performs **no system operations itself**. Creating and dropping the database are ordinary `Sql`
steps in `TestRunner.Setup`/`Teardown` (in `test-config.json`), run on an **`Admin`** maintenance connection
(pointed at the `postgres` database). In test mode the app routes its connection — endpoint type-checking
*and* execution — to `TestRunner.ConnectionName` (`"Test"`):

```jsonc
// test-config.json
"ConnectionStrings": {
  "Admin": "Host={PGHOST};Port={PGPORT};Database=postgres;Username={PGUSER};Password={PGPASSWORD}",
  "Test":  "Host={PGHOST};Port={PGPORT};Database=example_20_test_{rnd5};Username={PGUSER};Password={PGPASSWORD}"
},
"TestRunner": {
  "ConnectionName": "Test",
  "Steps": {
    "CreateDatabase":  { "Sql": "create database example_20_test_{rnd5}", "ConnectionName": "Admin" },
    "ApplyMigrations": { "SqlFile": "./20_testing_newdb/migrations_20/R__example_20_schema.sql" },
    "DropDatabase":    { "Sql": "drop database if exists example_20_test_{rnd5} with (force)", "ConnectionName": "Admin" }
  },
  "Setup":    ["CreateDatabase", "ApplyMigrations"],
  "Teardown": ["DropDatabase"]
}
```

`Steps` defines **named, reusable steps**; `Setup`/`Teardown` reference them by name (inline step objects
still work too). Named steps can also be attached to an *individual* test file with `-- @setup Name` /
`-- @teardown Name` header annotations — [example 21](../21_testing_isolation) uses that for per-test
database isolation.

Why this works (and why the test DB need not exist at startup):

- **`ConnectionName` (per step)** picks which connection a Setup/Teardown step runs on. The `create`/`drop`
  run on `Admin`; the migration (no `ConnectionName`) runs on the `Test` connection.
- **Order is exactly as written.** `create database` is step 1, the migration is step 2.
- The `Test` connection is **never opened until after `Setup`**, so the database it names is created (step 1)
  before anything connects to it. The app's startup validation uses the main connection, not `Test`.
- **`drop … with (force)`** terminates lingering pool connections.

### The unique database name: `{rnd5}`

`{rnd1}`–`{rnd10}` are random lowercase tokens (length = the digit), generated once per run and stable across
the whole config — the same `{rnd5}` value lands in the connection string, the `create`, and the `drop`, so
concurrent suites against a shared server can never collide. Need several *distinct* tokens of the same
length? The indexed instances `{rndN_1}`–`{rndN_9}` are each independent (`{rnd5}`, `{rnd5_1}`, `{rnd5_2}` are
three different values). (Trade-off: a hard crash that skips Teardown orphans that run's uniquely-named DB —
a *static* name with a leading `drop database if exists … with (force);` in the create step is the
self-healing alternative.)

## Authorization + user parameters

`config.json` sets `RequiresAuthorization: true`, so every endpoint needs an authenticated caller unless it
opts out — `get-users` stays authorized, `login` opts out with `@allow_anonymous`.

`get-users` is also `@user_parameters`: its `_user_id` is filled from the caller's `user_id` claim (mapped in
`AuthenticationOptions.ParameterNameClaimsMapping`), **never from the request**, and it filters
`where u.id <> _user_id` to return every *other* user — a client can't widen that to include themselves.

In tests the principal comes from the runner: `# @claim user_id=1` makes the call authenticated as user 1, so
the runner exercises the **real** authorization + claim-to-parameter path in-process (no auth bypass).

## The endpoints

- **`GET /api/get-users`** (authorized, `@user_parameters`) — lists every *other* user with role and a nested
  `addresses` array (each carrying its country), via `LEFT JOIN`s so partial fixtures still show.
- **`POST /api/login`** (`@allow_anonymous`) — verifies credentials with pgcrypto `crypt()`, returns the
  matching user or an empty result.

## The tests (`tests/`)

| File | `begin`/`rollback`? | Arrange (fixture) | Act | Assert |
|---|---|---|---|---|
| `get_users_requires_authentication` | no | — | `GET /get-users`, no claim | 401 |
| `get_users_excludes_authenticated_caller` | no | — (baseline seed) | `GET /get-users` as user 1 (ada) | ada excluded; alan listed; 2 of 3 |
| `get_users_ignores_unknown_caller_id` | no | — (baseline seed) | `GET /get-users` as user 999 (no such row) | nothing excluded; all 3 listed |
| `get_users_returns_empty_addresses_when_user_has_none` | no | — (baseline seed: grace has none) | `GET /get-users` as user 1 | grace's `addresses` is `[]` |
| `get_users_shows_deferred_fixture_with_null_role_and_country` | **yes** | deferred FKs: user + address referencing a role/country that are **never inserted** | `GET /get-users` as user 1 | fixture row has `role: null`, address `country: null` |
| `get_users_shows_non_deferred_fixture_with_full_graph` | **yes** | ordinary (non-deferred) insert: country → role → user → address | `GET /get-users` as user 1 | fixture row has its real role and country |
| `login_succeeds_with_correct_credentials` | **yes** | deferred FK: user before its role | `POST /login` correct credentials | 200, returns the user + role |
| `login_fails_with_wrong_password` | **yes** | deferred FK: user before its role | `POST /login` right email, wrong password | 200, empty body |
| `login_fails_with_unknown_email` | no | — | `POST /login` an email that exists nowhere | 200, empty body |

**Tags.** Every test file carries a `-- @tag` header annotation (`smoke`, `auth`, `fixtures`, `login`), so
subsets can be run without touching the layout:

```
bun run local-test -- --testrunner:tag=smoke                # the fast essentials (4 files)
bun run local-test -- --testrunner:tag=fixtures             # the deferrable-constraint demos
bun run local-test -- --testrunner:tag=auth,login           # any of several tags
bun run local-test -- --testrunner:excludetag=fixtures      # everything except a group
```

Tags compose with `--testrunner:filter=...` (path filtering), and `Setup`/`Teardown` always run, so the
subset executes in the complete environment.

**`begin`/`rollback` only when the Arrange writes something.** A test with no fixture — reading only the
baseline seed, or nothing at all — needs no transaction: there is nothing to discard, so wrapping it would be
pure boilerplate. The four tests that insert fixture rows keep the wrapper so those rows never leak into
the shared test database. (The file still owns its transaction either way — the runner never injects one.)

The last three ideas — **claim-existence is never checked** (`ignores_unknown_caller_id`), **empty vs. missing
JSON arrays** (`returns_empty_addresses_when…`), and **deferred vs. non-deferred fixtures side by side** — are
included purely to demonstrate the pattern; they're not essential coverage for this toy schema.

## Key ideas

- **The file owns its transaction** (`begin … rollback`); the in-process endpoint call runs on the same
  connection, sees the uncommitted fixture rows, and `rollback` discards them.
- **Deferrable constraints = minimal fixtures.** `set constraints all deferred` lets a test insert only what
  its assertion needs, in any order; the deferred checks would run at COMMIT, which a rolled-back test never
  reaches.
- **Tests run the real auth path.** Endpoints execute against the principal the runner injects (`# @claim …`),
  so `@authorize` and claim-filled parameters (`_user_id`) behave exactly as they do in production.
- **The runner never issues DDL.** Creating/dropping the database is your config (`Setup`/`Teardown` SQL on a
  maintenance connection), so you stay in full control of how the test database is provisioned — and the same
  pattern scales to a `TEMPLATE` clone, a Docker container, or an external migrator (EF/Django/Flyway).

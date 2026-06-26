# Example 19 — SQL test runner

Demonstrates the built-in **SQL test runner** (`npgsqlrest --test`): it discovers `*.test.sql` files,
runs each in an isolated connection, can **invoke endpoints in-process** (no network) from an embedded
HTTP request, captures the response into a temp table, and asserts on it from SQL.

> ⚠️ This example exercises the `--test` feature, which is **in development**. The files below are the
> intended usage; `bun run test` works once the runner ships.

## Layout

| Path | What it is |
|------|------------|
| `sql/get_users.sql` | endpoint: `GET /get-users` (anonymous) |
| `sql/get_users.test.sql` | its co-located test |
| `sql/create_user.sql` | endpoint: `POST /create-user` (`@authorize admin`) |
| `sql/create_user.test.sql` | its co-located test (auth + multi-step flow) |
| `sql/normalize_email.test.sql` | standalone test for a DB function (classic `assert` style) |
| `migrations_19/` | schema + seed |

Endpoints and tests live **side by side**. `SqlFileSource` serves the `.sql` files and **skips `*.test.sql`**
(`SkipPattern`); the test runner does the opposite (`FilePattern: **/*.test.sql`).

## Run

```bash
cd examples
bun install            # once
cd 19_testing_basic
bun run db:up          # create schema + seed
bun run test           # runs npgsqlrest --test
```

## What the test files show

- **Embedded HTTP request** — any `/* … */` block whose first line is a request line is invoked in-process
  (the path is the endpoint's full path, including the `UrlPathPrefix` — here `/api`):
  ```
  /*
  GET /api/get-users
  */
  ```
- **Response capture** — each HTTP block's response is captured into its own temp table (`status`, `body`,
  `content_type`, `headers`, `is_success`). A file with **one** HTTP block uses `_response`; a file with
  **several** uses `_response_1`, `_response_2`, … (one per block). Use `# @response <name>` to capture a
  block into a named table instead.
- **Boolean-select assertions** — a `SELECT` whose first column is boolean is an assertion; `false`/`NULL`
  fails, and the second column is the failure message:
  ```sql
  select status = 200, 'expected 200' from _response;   -- single-block test
  ```
  (The classic `do $$ begin assert …; end $$;` style also works — see `normalize_email.test.sql`.)
- **Auth via claims** — `# @claim name=value` runs the request as a principal carrying those claims.
  No claims ⇒ anonymous (401 on protected endpoints); `# @claim roles=admin` satisfies `@authorize admin`:
  ```
  /*
  POST /api/create-user
  # @claim roles=admin

  {"name": "Grace Hopper", "email": "GRACE@Example.com"}
  */
  ```
- **Isolation** — the test file owns its transaction (`begin … rollback`). The in-process call runs on the
  **same connection**, so it sees this transaction's uncommitted rows; `rollback` discards them, leaving the
  seeded baseline for the next test. (Each test gets its own non-pooled connection.)

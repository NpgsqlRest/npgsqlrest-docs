---
outline: [2, 3]
title: "SQL File Endpoints Guide"
titleTemplate: NpgsqlRest
description: "Build REST APIs directly from .sql files - no functions, no procedures, no boilerplate. Multi-command endpoints, automatic parameter inference, TypeScript generation, and full annotation support."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sql file source, sql to rest api, postgresql sql file endpoint, plain sql rest api, sql file api generator, npgsqlrest 3.12, multi-command sql endpoint, sql file typescript generation
  - - meta
    - property: og:title
      content: "NpgsqlRest SQL File Endpoints Guide"
  - - meta
    - property: og:description
      content: "Build REST APIs directly from .sql files. No functions, no procedures, no boilerplate."
  - - meta
    - property: og:type
      content: article
---

# SQL File Endpoints

NpgsqlRest creates REST API endpoints directly from `.sql` files. No `CREATE FUNCTION`, no `RETURNS TABLE`, no `LANGUAGE sql`, no `COMMENT ON FUNCTION` — just the query itself.

> **Source Code**: Every example in this guide comes from the [examples repository](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples). Most function-based examples have a `_sql_file` counterpart.

## How It Works

At startup, for each `.sql` file matched by the configured glob pattern:

1. The file is **parsed** — comments are extracted as annotations, SQL is split into statements on `;` boundaries
2. Each statement is **described** via PostgreSQL's wire protocol (`Parse → Describe → Sync` with `SchemaOnly`) — parameter types and return columns are inferred without executing the query
3. A REST endpoint is created with the **URL path derived from the filename** — `get-users.sql` becomes `/api/get-users`

This gives you **static type checking** — SQL errors are caught at startup, not at runtime. Your SQL files are validated against the actual database schema before the server accepts any requests:

```
SqlFileSource: /path/to/get-posts.sql:
error 42703: column u.id does not exist
  at line 3, column 12
  select u.id, u.name from users u
             ^
```

This is the default behavior (`ErrorMode: "Exit"`). Set `ErrorMode: "Skip"` to log errors and continue startup instead. Individual statements can bypass Describe entirely with [`@returns`](#returns-—-skip-describe), which is necessary when the SQL references objects that don't exist at startup (e.g. temp tables created at runtime).

## Configuration

Enable SQL File Source in `appsettings.json`:

```json
{
  "NpgsqlRest": {
    "SqlFileSource": {
      "Enabled": true,
      "FilePattern": "sql/**/*.sql"
    }
  }
}
```

`FilePattern` uses glob syntax: `**` crosses directories, `*` matches filenames, `?` matches a single character.

By default (`CommentsMode: "OnlyAnnotated"` in the client since 3.17.0 — `"OnlyWithHttpTag"` is an identical-behavior alias), only files containing an `HTTP` annotation (or a plugin annotation that requests an endpoint, such as `@mcp`) become endpoints. This prevents accidental exposure of migration scripts or utility files. Set `CommentsMode: "ParseAll"` to make every matched file an endpoint.

Other settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `SkipPattern` | `*.test.sql` | Glob for files to exclude from endpoint discovery — keeps co-located [test files](/guide/testing) out of the API |
| `ErrorMode` | `Exit` | `Exit` fails fast at startup. `Skip` logs errors and continues |
| `CommentScope` | `All` | `All` parses every comment. `Header` only parses comments before the first statement |
| `UnnamedSingleColumnSet` | `true` | Single-column queries return flat arrays (`["a","b"]`) instead of object arrays |
| `ResultPrefix` | `result` | Prefix for multi-command result keys (`result1`, `result2`, ...) |
| `SkipNonQueryCommands` | `true` | Transaction control (`BEGIN`, `COMMIT`, etc.), `DO` blocks, `SET`/`RESET` are auto-skipped from response |

See [SQL File Source Configuration](/config/sql-file-source) for the complete reference.

## Single-Command Files

A file with one SQL statement produces a standard endpoint:

```sql
-- sql/get-users.sql
-- HTTP GET
select user_id, username, email, active from example_2.users;
```

`GET /api/get-users` returns an array of objects:

```json
[{"userId": 1, "username": "alice", "email": "alice@example.com", "active": true}, ...]
```

Column names are converted to camelCase by the default `NameConverter`. Single-column queries return flat arrays — `select name from users` returns `["Alice","Bob"]` not `[{"name":"Alice"},...]` (configurable via `UnnamedSingleColumnSet`).

### HTTP Verb Detection

Without an explicit `HTTP` annotation, the verb is inferred from the SQL: `SELECT` → GET, `INSERT` → PUT, `UPDATE` → POST, `DELETE` → DELETE, `DO` block → POST. Mixed mutations → most destructive wins (DELETE > POST > PUT). An explicit annotation always overrides: `-- HTTP POST`.

## Parameters

SQL files use **named parameters** (`:name`, since 3.19.0) or PostgreSQL positional parameters (`$1`, `$2`, ...) — one style per file.

### Named Parameters (`:name`)

The placeholder **is** the parameter name — no annotations needed:

```sql
-- sql/get-reports.sql
-- HTTP GET
select id, title, created_at
from reports
where created_at between :from_date and :to_date;
```

`GET /api/get-reports?fromDate=2024-01-01&toDate=2024-12-31`

The API name goes through the same `NameConverter` routine parameters use (`:from_date` → `fromDate` with the default camelCase converter). Under the hood the SQL is rewritten to native `$N` before it is described and executed — PostgreSQL never sees the `:name` form, so type inference and runtime behavior are identical to positional files.

- **Repetition collapses**: the same name used multiple times — including across statements in a multi-command file — is **one** parameter (`where :user_id = author_id or :user_id = editor_id` takes a single `userId` value).
- **Claim mappings hook up by placeholder name**: `select :_user_id` under `@authorize` + `@user_parameters` binds the mapped claim with zero annotations.
- **Annotations match by name** where still needed: `@param from_date default null` (defaults), `@param :from_date timestamptz` (type hint), or the retype-without-rename form `@param from_date type is timestamptz`.
- **The tokenizer knows SQL**: strings, comments, and dollar-quoted bodies are untouched; `::int` casts, `:=` calls, and numeric slice bounds (`a[1:3]`) never match. One caveat: an array slice with a *variable* bound must be written with a space (`a[1 : n]`).
- Mixing `$N` and `:name` in one file is rejected at startup. (JDBC-style `?` is deliberately not supported — `?`, `?|`, `?&`, `@?` are PostgreSQL's own jsonb operators.)

### Positional Parameters (`$N`)

The [`@param`](/annotations/param) annotation gives positional parameters meaningful names and optionally overrides the type:

```sql
-- sql/get-reports.sql
-- HTTP GET
-- @param $1 from_date
-- @param $2 to_date
select id, title, created_at
from reports
where created_at between $1 and $2;
```

`GET /api/get-reports?from_date=2024-01-01&to_date=2024-12-31`

Without `@param`, the raw positional names work: `?$1=2024-01-01&$2=2024-12-31`.

### Type Hints

When PostgreSQL can't infer a parameter's type from context (e.g. `select set_config('key', $1, true)` — `$1` is ambiguous), add a type to `@param`:

```sql
-- @param $1 user_id integer
-- @param $2 active boolean
```

The type is used during the Describe step so PostgreSQL can resolve the parameter.

### Default Values

Positional parameters must always be bound — unlike function parameters, there's no native `DEFAULT` clause. The `@param` annotation fills this gap:

```sql
-- @param $1 status default 'active'
-- @param $2 limit integer = 50
```

When a parameter with a default is not provided in the request, the default value is bound. Parameters with defaults become optional in generated TypeScript (`?` suffix) and OpenAPI (`required: false`).

Value syntax follows SQL conventions: `null` → SQL NULL, `'text'` → string, `42` → number, `true` → boolean.

### Virtual Parameters (`@define_param`)

[`@define_param`](/annotations/define-param) creates HTTP parameters that are **not** bound to the SQL query. They exist for annotation placeholders and claim mapping:

```sql
-- @define_param format text
-- @table_format = {format}
```

The `format` parameter feeds into the `{format}` placeholder without appearing in the SQL. Default type is `text`.

## Multi-Command Files

A file with multiple statements (separated by `;`) becomes one endpoint that executes everything in a **single database round-trip** via `NpgsqlBatch`. From the [first example](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/1_my_first_function_sql_file):

```sql
-- HTTP GET

-- @result first
select * from (
    values ('Hello, World!'), 
    ('This is my first SQL endpoint.'), 
    ('Enjoy coding in SQL!')
) as t(text);

-- @result second
-- @single
select current_query() as query_text, current_user as user, current_timestamp as timestamp;
```

Returns a JSON object with one key per statement:

```json
{
  "first": ["Hello, World!", "This is my first SQL endpoint.", "Enjoy coding in SQL!"],
  "second": {"queryText": "...", "user": "postgres", "timestamp": "..."}
}
```

### Result Rules

- **SELECT queries** → JSON array of objects (or flat array for single-column with `UnnamedSingleColumnSet`)
- **INSERT/UPDATE/DELETE** without `RETURNING` → rows-affected count (integer)
- **Transaction control** (`BEGIN`, `COMMIT`, `SET`, `DO`, etc.) → auto-skipped from response (`SkipNonQueryCommands: true`)
- All statements share the same parameters (`$1`, `$2`, ...) — the user sends each parameter once

### Positional Annotations

These annotations are **positional** — they apply to the next statement below them (or inline after `;` on the same line):

- [`@result name`](/annotations/result-name) — rename result key (default: `result1`, `result2`, ...)
- [`@single`](/annotations/single) — return a single row as an object instead of an array
- [`@skip`](/annotations/skip) — execute the statement but exclude it from the response

```sql
select set_config('app.val', $1, true); -- @skip
-- @result data
-- @single
select current_setting('app.val') as value;
```

### `@void`

[`@void`](/annotations/void) forces the entire endpoint to return **204 No Content**. All statements execute for side effects only — no JSON response, no result keys. This eliminates the need to `@skip` every individual statement.

## `@returns` — Skip Describe

[`@returns`](/annotations/returns) skips the PostgreSQL Describe step entirely for a statement and resolves return columns from a type instead. This is a positional annotation.

**When to use it:** when a statement references objects that don't exist at startup — typically temp tables created inside `DO` blocks.

```sql
-- @returns my_result_type
-- @result data
-- @single
select * from _result;
```

The type must exist in the database at startup. Columns are resolved from `pg_catalog`.

Three forms:
- `@returns composite_type` — resolve columns from the composite type definition
- `@returns scalar_type` (e.g. `@returns integer`, `@returns json`) — single-column result
- `@returns void` — no columns, void result (differs from `@void` which still runs Describe)

## DO Blocks and Limitations

PostgreSQL `DO` blocks **cannot receive `$N` parameters** — this is a PostgreSQL language limitation, not an NpgsqlRest one. `DO` blocks also cannot return values. Multi-command SQL files work around this:

**Passing parameters in:** Use `set_config()` with `true` (transaction-local) to store values, then `current_setting()` inside the `DO` block. Or use a temp table bridge with `@skip`:

```sql
begin;
select set_config('app.user_id', $1, true);
do $$ begin
    insert into logs (user_id) values (current_setting('app.user_id')::int);
end; $$;
end;
```

**Getting results out:** Create a temp table inside the `DO` block with `ON COMMIT DROP`, then `SELECT` from it with `@returns` to declare the return type.

These are workarounds. When you need proper procedural logic with native parameters and return values, use a PostgreSQL function instead — that's what they're for.

## Existing Features Work Unchanged

All NpgsqlRest features that existed before SQL File Source — authentication (`@login`, `@logout`, `@authorize`), file uploads (`@upload`), SSE (`@sse`), proxy (`@proxy`), HTTP custom types, CSV/Excel export (`@raw`, `@table_format`), caching (`@cached`), encryption, custom headers, composite types (`@nested`) — work identically in SQL files. The annotations are the same; only the endpoint source is different.

The [examples repository](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples) has a `_sql_file` counterpart for most examples demonstrating this.

## The Dev Loop: Watch Mode

Run the server under [watch mode](../config/watch) while writing endpoint files:

```sh
npgsqlrest ./config.json --watch
```

Save a `.sql` file and the running API restarts with the change (~1s) — a new endpoint is immediately callable, a broken one prints its error while the rest keep serving (`ErrorMode` is relaxed to `Skip` while watching), and configured code generation (TypeScript/Dart clients, HTTP files, OpenAPI) regenerates on every cycle, so frontend types follow your SQL as you type. Configuration files and database routines are watched too. For testing the same loop, see [`--test --watch`](./testing#watch-mode).

## SQL Files vs Functions

**Use SQL files when:** the query is declarative, involves multi-statement workflows, or the team prefers plain SQL files over DDL.

**Use functions when:**

- **Procedural logic** — functions receive parameters and return results natively. `DO` blocks require `set_config`/temp table workarounds.
- **Testing** — functions support `assert` blocks inside [repeatable migrations](https://flywaydb.org/documentation/concepts/migrations#repeatable-migrations) that run on every build, giving you database-level unit tests with rollback isolation. SQL files have no in-migration equivalent — the [SQL test runner](/guide/testing) covers both sources, but from the outside. See [End-to-End Type Checking](/blog/end-to-end-static-type-checking-postgresql-typescript) for examples.
- **Optimization** — `VOLATILE`/`STABLE`/`IMMUTABLE`, `COST`, `ROWS`, `PARALLEL` hints.
- **Overloading** — multiple function signatures per name.

**Use both together.** Each endpoint source is independently enabled. SQL files can call functions, and HTTP custom types can reference any endpoint regardless of source.

## Related

- [SQL File Source Configuration](/config/sql-file-source) — all configuration options
- [`@param`](/annotations/param) — rename, retype, defaults
- [`@result`](/annotations/result-name) — name multi-command result keys
- [`@returns`](/annotations/returns) — skip Describe for temp tables
- [`@void`](/annotations/void) — force 204 No Content
- [`@define_param`](/annotations/define-param) — virtual parameters
- [Testing Guide](/guide/testing) — test your SQL file endpoints with plain `.sql` test files (`--test`)
- [Changelog v3.12.0](/guide/changelog/v3.12.0) — full release notes; [v3.19.0](/guide/changelog/v3.19.0) — named parameters, `SkipPattern`, test runner
- [Examples](/examples/) — all examples with SQL file variants

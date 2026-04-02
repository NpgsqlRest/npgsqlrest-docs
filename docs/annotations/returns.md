---
outline: [2, 3]
title: "RETURNS Annotation"
titleTemplate: NpgsqlRest
description: "Skip the PostgreSQL Describe step and resolve return columns from a composite type. Enables SQL files that use runtime-created temp tables."
head:
  - - meta
    - name: keywords
      content: npgsqlrest returns annotation, composite type override, skip describe, temp table sql file, do block result
  - - meta
    - property: og:title
      content: "NpgsqlRest RETURNS Annotation"
  - - meta
    - property: og:description
      content: "Skip the PostgreSQL Describe step and resolve return columns from a composite type."
  - - meta
    - property: og:type
      content: article
---

# RETURNS

Skip the PostgreSQL Describe step for a statement and resolve return columns from a composite type instead. This is a positional annotation — it applies to the next statement below it.

Available since version 3.12.0.

## Syntax

```
@returns <composite_type_name>
@returns <scalar_type>
@returns void
```

Supported values:
- **Composite type name** — schema-qualified (e.g., `public.my_type`) or unqualified (e.g., `my_type`). Columns resolved from the type definition.
- **Scalar type** — any built-in PostgreSQL type (e.g., `integer`, `text`, `boolean`, `jsonb`). Declares a single-column result. Only the first column from the query is used at runtime.
- **`void`** — no columns, no results.

**This annotation skips the PostgreSQL Describe step entirely for the annotated statement.** The statement's SQL is never sent to PostgreSQL during startup.

## When to Use

- **Composite types:** when the statement references objects that don't exist at startup (e.g., temp tables created inside DO blocks)
- **Scalar types:** when you want to declare a single typed return value and ignore extra columns
- **`void`:** when the statement returns no results (e.g., `INSERT`, `CREATE TEMP TABLE`, `set_config`)

## Example

```sql
-- HTTP GET
-- @param $1 val1 text
-- @param $2 val2 integer
begin;
select set_config('app.val1', $1, true); -- @skip
select set_config('app.val2', $2::text, true); -- @skip
do $$ begin
    create temp table _result on commit drop as
    select current_setting('app.val1') as val1,
           current_setting('app.val2')::int as val2,
           true as active;
end; $$;
-- @returns my_result_type
-- @result data
-- @single
select * from _result;
end;
```

Where `my_result_type` is defined as:

```sql
create type my_result_type as (
    val1 text,
    val2 integer,
    active boolean
);
```

Without `@returns`, the `select * from _result` statement fails at startup because the temp table doesn't exist yet. With `@returns my_result_type`, the columns are resolved from the composite type definition in `pg_catalog`.

### Scalar Type

Declare a single typed column. Only the first column from the query is used at runtime — extra columns are ignored:

```sql
-- HTTP GET
-- @returns integer
select count(*) from users;
```

Returns: `[42]`

With `@single`, returns a bare scalar value:

```sql
-- HTTP GET
-- @returns integer
-- @single
select count(*) from users;
```

Returns: `42`

Supported scalar types: `integer`, `text`, `boolean`, `jsonb`, `json`, `bigint`, `numeric`, `real`, `double precision`, `date`, `timestamp`, `timestamptz`, `uuid`, `bytea`, and all other built-in PostgreSQL types.

### Void Statements

Use `@returns void` to skip Describe for statements that return no results:

```sql
-- HTTP POST
-- @param $1 key text
-- @param $2 value text
-- @returns void
select set_config($1, $2, false);
-- @result data
select current_setting($1, true) as result;
```

The first statement's Describe is skipped entirely. In multi-command files, it produces a rows-affected count in the response. For single-command files, it makes the endpoint void (returns 204 No Content).

## Behavior

- **The Describe step is skipped entirely** for annotated statements — the SQL is never sent to PostgreSQL during startup
- For composite types: the type must exist in the database at startup. If not found, an error is logged and the file is skipped or exits (depending on `ErrorMode`)
- For `void`: the statement is treated as returning no columns (zero-column result)
- No parameter type inference happens for the skipped statement — other statements in the same multi-command file provide parameter types
- At runtime, the actual query result must match the declared type's column structure — mismatches may produce incorrect output
- Can be combined with other positional annotations like `@result`, `@single`, `@skip`

::: tip @returns void vs @void
For single-command SQL files, `@returns void` has the same runtime effect as [`@void`](./void) — both return 204 No Content. The difference: `@returns void` **skips the Describe step** (the SQL is never sent to PostgreSQL at startup), while `@void` still runs Describe and only changes the runtime response. Use `@returns void` when the statement would fail Describe (e.g., references a temp table). Use `@void` when Describe succeeds but you don't want any response.
:::

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [RESULT_NAME](./result-name) - Rename result keys in multi-command files
- [SINGLE](./single) - Return single records as objects
- [VOID](./void) - Force void response
- [SQL File Source](../config/sql-file-source) - SQL file source configuration

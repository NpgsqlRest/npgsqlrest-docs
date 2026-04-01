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
```

The type name can be schema-qualified (e.g., `public.my_type`) or unqualified (e.g., `my_type`).

## When to Use

The Describe step runs at startup to introspect each SQL statement's return columns. It fails when a statement references objects that don't exist yet — such as temp tables created at runtime inside a `DO` block.

Use `@returns` to tell the system what columns the statement will return, bypassing Describe entirely for that statement.

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

## Behavior

- The composite type must exist in the database at startup
- If the type is not found, an error is logged and the file is skipped or the process exits (depending on `ErrorMode`)
- No parameter type inference happens for the skipped statement — other statements in the same multi-command file provide parameter types
- At runtime, the actual query result must match the declared type's column structure — mismatches may produce incorrect output
- Can be combined with other positional annotations like `@result`, `@single`, `@skip`

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [RESULT_NAME](./result-name) - Rename result keys in multi-command files
- [SINGLE](./single) - Return single records as objects
- [VOID](./void) - Force void response
- [SQL File Source](../config/sql-file-source) - SQL file source configuration

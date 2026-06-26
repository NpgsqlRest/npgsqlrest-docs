---
outline: [2, 3]
title: "DEFINE_PARAM Annotation"
titleTemplate: NpgsqlRest
description: "Define virtual HTTP parameters that are not bound to the PostgreSQL command. Used for custom parameter placeholders, claim mapping, and HTTP request matching in SQL file endpoints."
head:
  - - meta
    - name: keywords
      content: npgsqlrest define_param, virtual parameter, sql file parameter, claim mapping parameter, custom parameter placeholder
  - - meta
    - property: og:title
      content: "NpgsqlRest DEFINE_PARAM Annotation"
  - - meta
    - property: og:description
      content: "Define virtual HTTP parameters that are not bound to the PostgreSQL command."
  - - meta
    - property: og:type
      content: article
---

# DEFINE_PARAM

::: info Also known as
`define_param` (with or without `@` prefix)
:::

Define HTTP parameters that are **not** bound to the PostgreSQL command. These virtual parameters exist in the HTTP request (query string or JSON body) but do not correspond to any `$N` or `:name` placeholder in the SQL query.

This is useful for SQL file endpoints where you need HTTP parameters for:
- **Custom parameter placeholders** — parameters that feed into annotation placeholders like `{format}` without being part of the SQL
- **Claim mapping** — auto-filling parameters from authenticated user claims without referencing them in the query
- **HTTP request matching** — parameters that affect endpoint behavior without participating in the database query

## Syntax

```
@define_param name
@define_param name type
```

- `name` — the HTTP parameter name
- `type` — optional PostgreSQL type (default: `text`)

## Custom Parameter Placeholders

Pass HTTP parameters that control endpoint behavior without referencing them in SQL:

```sql
-- sql/users_report.sql
-- HTTP GET
-- @define_param format text
-- @table_format = {format}
select id, name, email from users where department_id = :department_id;
```

`GET /api/users-report?departmentId=5&format=html`

The `format` parameter feeds into the `@table_format` annotation via the `{format}` placeholder, selecting the output format (`html` or `excel`) without being part of the SQL query. Without `@define_param`, there would be no `format` parameter in the endpoint — the `{format}` placeholder would have nothing to resolve.

## Claim Mapping

Auto-fill a parameter from the authenticated user's claims without including it in the SQL query:

```sql
-- sql/user_dashboard.sql
-- HTTP GET
-- @authorize
-- @user_parameters
-- @define_param _user_id
select * from user_dashboard_data;
```

Here `_user_id` is created as a virtual parameter that maps to the `user_id` claim (via the default `ParameterNameClaimsMapping` — see [User Parameters](/annotations/user-parameters)). The authenticated user's ID is injected automatically — but this parameter doesn't correspond to any placeholder in the SQL. The query itself doesn't filter by user — the virtual parameter exists solely for the claim mapping mechanism.

This is different from referencing the parameter in the SQL itself:

```sql
-- Here :_user_id IS in the SQL query — no @define_param needed
-- HTTP GET
-- @authorize
-- @user_parameters
select * from orders where user_id = :_user_id;
```

Use `@define_param` when the parameter shouldn't appear in the SQL at all. Reference it as a placeholder (`:_user_id`, or `$1` with `@param $1 _user_id`) when you need the value both as a claim-mapped parameter and in the query.

## Default Type

If no type is specified, the parameter defaults to `text`:

```sql
-- These are equivalent:
-- @define_param _user_id
-- @define_param _user_id text
```

Specify a type when needed:

```sql
-- @define_param _user_id integer
```

## Related

- [SQL File Endpoints Guide](../guide/sql-files) — parameters, includes, and multi-command files
- [PARAM](./param) — rename, retype, and configure parameters that are bound to SQL (`$N`)
- [USER_PARAMETERS](./user-parameters) — enable claim-to-parameter mapping
- [Custom Parameters](./custom-parameters) — custom key-value annotation settings with `{param}` placeholders
- [SQL File Source configuration](/config/sql-file-source) — enable and configure SQL file endpoints

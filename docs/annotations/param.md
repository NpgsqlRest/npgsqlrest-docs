---
outline: [2, 3]
title: "PARAM Annotation"
titleTemplate: NpgsqlRest
description: "Rename, retype, set defaults, and configure composite type parameters. Works on all endpoint types — functions, procedures, and SQL file endpoints."
head:
  - - meta
    - name: keywords
      content: npgsqlrest param annotation, rename parameter, retype parameter, default value, composite type parameter, sql file parameters, api parameter names
  - - meta
    - property: og:title
      content: "NpgsqlRest PARAM Annotation"
  - - meta
    - property: og:description
      content: "Rename, retype, set defaults, and configure composite type parameters."
  - - meta
    - property: og:type
      content: article
---

# PARAM

::: info Also known as
`param`, `parameter` (with or without `@` prefix)
:::

Rename and optionally retype individual endpoint parameters. This provides better API ergonomics by replacing positional parameter names (`$1`, `$2`) or internal parameter names (`_old_name`) with cleaner, user-facing names.

Works on **all** endpoint types — functions, procedures, and SQL file endpoints.

::: tip
The `@param` keyword is shared with the [PARAMETER_HASH](./parameter-hash) annotation (`@param X is hash of Y`). Both forms coexist without ambiguity — the parser distinguishes them by the presence of `hash of` in the annotation.
:::

## Syntax

```
@param <old_name> <new_name>
@param <old_name> <new_name> <type>
@param <old_name> is <new_name>
@param <old_name> is <new_name> <type>
@param <old_name> default <value>
@param <old_name> <new_name> default <value>
@param <old_name> <new_name> <type> default <value>
@param <old_name> is <new_name> default <value>
@param <old_name> is <new_name> <type> default <value>
@param <name> type is <type>
@param <name> type is <type> default <value>

# `=` can be used instead of `default` in all forms above:
@param <old_name> = <value>
@param <old_name> <new_name> = <value>
@param <old_name> <new_name> <type> = <value>
@param <old_name> is <new_name> = <value>
@param <old_name> is <new_name> <type> = <value>
```

- `old_name`: The original parameter name (e.g., `$1`, `$2`, or `_old_name`). In SQL files with named `:name` placeholders, use the placeholder's own name (a leading `:` is tolerated).
- `new_name`: The new parameter name for the HTTP API. **Used as-is** — no name conversion is applied. If you write `@param $1 authorId`, the HTTP parameter name is exactly `authorId`, not `author_id` or `author-id`.
- `type`: Optional PostgreSQL type override (e.g., `integer`, `text`, `boolean`). The `type is` form retypes a parameter without renaming it — useful for `:name` placeholders, where the name is already right.

Both `@param` and `@parameter` (long form) are supported.

## Examples

### Rename Positional Parameters (SQL Files)

SQL files using PostgreSQL positional parameters (`$1`, `$2`, ...) get those as HTTP parameter names, which aren't user-friendly. Use `@param` to give them meaningful names (with [named parameters](../guide/sql-files) — `:from_date`, 3.19+ — the placeholder already is the API name and no rename is needed):

```sql
-- sql/get_reports.sql
-- HTTP GET
-- @param $1 from_date
-- @param $2 to_date
select id, title, created_at
from reports
where created_at between $1 and $2;
```

Without rename: `GET /api/get-reports?$1=2024-01-01&$2=2024-12-31`

With rename: `GET /api/get-reports?from_date=2024-01-01&to_date=2024-12-31`

### Rename with Type Override

When parameter types can't be inferred correctly, or when you need to override the inferred type:

```sql
-- @param $1 user_id integer
-- @param $2 active boolean
select * from users where id = $1 and active = $2;
```

### Rename Function Parameters

Works on function and procedure parameters too — useful when internal naming conventions (like `_` prefixes) shouldn't leak into the API:

```sql
create function get_user_profile(_user_id int, _include_stats boolean)
returns json
language sql
begin atomic;
select json_build_object('id', id, 'name', name) from users where id = _user_id;
end;

comment on function get_user_profile(int, boolean) is '
HTTP GET
@param _user_id user_id
@param _include_stats include_stats
';
```

Without rename: `GET /api/get-user-profile?userId=1&includeStats=true`

With rename: `GET /api/get-user-profile?user_id=1&include_stats=true`

### "is" Style Syntax

The `is` keyword is optional and provides consistency with the existing `@param X is hash of Y` style:

```sql
-- These are equivalent:
-- @param $1 user_id
-- @param $1 is user_id

-- With type override:
-- @param $1 user_id integer
-- @param $1 is user_id integer
```

## Claim Mapping with Renamed Parameters

Renamed parameters work with [user_parameters](./user-parameters) claim mapping. When you rename a positional parameter to a claim-mapped name (like `_user_id` or `_user_name`), the parameter is automatically filled from the authenticated user's claims — just like it would be for a native function parameter.

```sql
-- sql/get_my_profile.sql
-- @authorize
-- @user_parameters
-- @param $1 _user_id
-- @param $2 _user_name
select $1 as user_id, $2 as user_name;
```

`GET /api/get-my-profile` (authenticated as user123) → `[{"userId": "user123", "userName": "user"}]`

The parameters are auto-filled from claims — the client doesn't need to send them. This is especially useful for SQL file endpoints where positional parameters (`$1`, `$2`) have no inherent name for claim matching.

## Default Values (SQL File Parameters)

SQL file parameters can have default values via `@param`. When a parameter with a default is not provided in the request, the default value is bound instead of returning 404.

This is essential for SQL files because positional parameters (`$1`, `$2`) must always be bound — unlike PostgreSQL functions where the engine applies its own defaults.

### Syntax

```sql
-- Separate annotations (rename first, then set default):
-- @param $1 user_id
-- @param user_id default null

-- Combined rename + default on a single line:
-- @param $1 user_id default null

-- Default without rename:
-- @param $1 default 'fallback'

-- Various value types:
-- @param $1 status default 'active'     -- text (single-quoted)
-- @param $1 amount default 42           -- number
-- @param $1 enabled default true        -- boolean
-- @param $1 filter default null         -- SQL NULL (unquoted)
-- @param $1 tag default 'null'          -- literal text "null" (quoted)
-- @param $1 val default                 -- no value = NULL
```

Inline comments after the value are ignored. The parser consumes only the value token (or quoted string) and stops.

```sql

-- `=` can be used instead of `default` in all forms:
-- @param $1 user_id = null
-- @param $1 user_id integer = 42
-- @param $1 is greeting = 'hey'
-- @param my_name = 'hello'
```

### Value Parsing Rules (SQL Conventions)

- Unquoted `null` (case-insensitive) → `DBNull.Value`
- Single-quoted `'text value'` → string literal (supports multi-word)
- Unquoted value → raw string (Npgsql handles type conversion via `NpgsqlDbType`)

### Example

User identity endpoint with claim-filled parameters that fall back to NULL:

```sql
/* HTTP GET
@authorize
@user_parameters
@param $1 _user_id default null
@param $2 _username default null
@param $3 _email default null
*/
select $1 as user_id, $2 as username, $3 as email;
```

When authenticated, claims fill the parameters automatically. The defaults ensure the parameters are always bindable.

### Effects on Generated Output

- **TsClient**: Parameters with defaults get `?` suffix in TypeScript interfaces (optional)
- **OpenAPI**: Parameters with defaults are marked `required: false`

## Rename Validation

Parameter names are validated when renaming. Invalid renames are rejected with a warning log instead of silently creating broken endpoints.

**Rules:**
- Must be a valid PostgreSQL identifier: starts with letter or `_`, followed by letters, digits, `_`, or `$`
- Positional parameters (`$1`, `$2`) are allowed

```sql
-- Valid:
-- @param $1 user_id        ✓
-- @param $1 _val$1         ✓

-- Rejected (with warning log):
-- @param $1 1bad           ✗ starts with digit
-- @param $1 my-param       ✗ invalid character (hyphen)
```

## Composite Type Parameters (SQL Files)

When a parameter type is a known composite type, the parameter is treated as a single text value. The SQL is never rewritten — it stays exactly as written.

**HTTP custom types** (auto-filled from HTTP calls):
```sql
-- @param $1 _response example_9.exchange_rate_api
select ($1::example_9.exchange_rate_api).body;
```
The framework makes the HTTP call and passes the response as a composite text value automatically.

**Client-sent composite types:**
```sql
-- @param $1 data my_composite_type
select ($1::my_composite_type).field1, ($1::my_composite_type).field2;
```
The client sends the value as PostgreSQL composite text format: `?data=("val1","val2")`.

If the type in `@param` is not a recognized PostgreSQL type or composite type, a warning is logged and the parameter keeps its original type from Describe.

## Behavior

- The rename applies to HTTP parameter names only — the SQL still uses the original parameter name or positional reference
- Type overrides affect how the HTTP parameter value is parsed and converted before being sent to PostgreSQL
- For multi-command SQL files, parameter types are merged across all statements — use type override to resolve conflicts
- The parameter must exist in the endpoint's parameter list; otherwise a warning is logged and the rename is skipped
- Renamed parameters participate in claim mapping — renaming `$1` to `_user_id` enables automatic `user_parameters` filling from the `name_identifier` claim

## Related

- [SQL File Endpoints Guide](../guide/sql-files) — named and positional parameters
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [PARAMETER_HASH](./parameter-hash) - Hash one parameter using another (also uses `@param`)
- [REQUEST_PARAM_TYPE](./request-param-type) - Control query string vs body parameters

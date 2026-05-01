---
outline: [2, 3]
title: "SQL File Source Configuration"
titleTemplate: NpgsqlRest
description: "Generate REST API endpoints directly from SQL files. Configure file patterns, comment parsing, error handling, and multi-command result naming."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sql file source, sql file endpoint, sql to rest api, sql file configuration, sql file source plugin
  - - meta
    - property: og:title
      content: "NpgsqlRest SQL File Source Configuration"
  - - meta
    - property: og:description
      content: "Generate REST API endpoints directly from SQL files. Configure file patterns, comment parsing, and error handling."
  - - meta
    - property: og:type
      content: article
---

# SQL File Source

Configuration for generating REST API endpoints from `.sql` files.

## Overview

```json
{
  "NpgsqlRest": {
    "SqlFileSource": {
      "Enabled": false,
      "FilePattern": "",
      "CommentsMode": "OnlyWithHttpTag",
      "CommentScope": "All",
      "ErrorMode": "Exit",
      "ResultPrefix": "result",
      "UnnamedSingleColumnSet": true,
      "NestedJsonForCompositeTypes": false
    }
  }
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable or disable SQL file source endpoints. |
| `FilePattern` | string | `""` | Glob pattern for SQL files. Empty string disables the feature. |
| `CommentsMode` | string | `"OnlyWithHttpTag"` | How comment annotations affect endpoint creation. |
| `CommentScope` | string | `"All"` | Which comments in the SQL file to parse as annotations. |
| `ErrorMode` | string | `"Exit"` | Behavior when a SQL file fails to parse or describe. |
| `ResultPrefix` | string | `"result"` | Prefix for result keys in multi-command JSON responses. |
| `UnnamedSingleColumnSet` | bool | `true` | Single-column queries return flat arrays instead of object arrays. |
| `NestedJsonForCompositeTypes` | bool | `false` | When `true`, composite type columns are serialized as nested JSON objects. When `false` (default), composite fields are flattened inline. Can also be enabled per-endpoint with the [`@nested`](../annotations/nested) annotation. |

## Enabled

Enable or disable SQL file source endpoints. Default is `false` — you must explicitly enable this feature.

```json
"SqlFileSource": {
  "Enabled": true
}
```

## FilePattern

Glob pattern for locating SQL files. Supports the following wildcards:

| Pattern | Description |
|---------|-------------|
| `*` | Matches any characters within a single directory level |
| `**` | Matches any characters including `/` (crosses directory boundaries) |
| `?` | Matches a single character |

When `**` is present in the pattern, `*` stops matching `/` (standard glob semantics). When no `**` is present, `*` matches `/` for backward compatibility.

### Examples

```json
// All .sql files in the sql/ directory (non-recursive)
"FilePattern": "sql/*.sql"

// All .sql files in sql/ and all subdirectories (recursive)
"FilePattern": "sql/**/*.sql"

// Any .sql file at any depth
"FilePattern": "**/*.sql"
```

An empty string disables the feature (even if `Enabled` is `true`).

## CommentsMode

Controls how comment annotations affect SQL file endpoint creation.

| Mode | Description |
|------|-------------|
| `ParseAll` | Every SQL file becomes an endpoint. Comments are parsed as annotations to modify endpoint behavior. |
| `OnlyWithHttpTag` | Only files containing an `HTTP` annotation become endpoints. **(default)** |
| `Ignore` | Every SQL file becomes an endpoint. All comments are ignored. |

::: tip
The default `OnlyWithHttpTag` means only SQL files with an explicit `HTTP` annotation (e.g., `-- HTTP GET`) become endpoints. Use `ParseAll` if you want every SQL file in the matched pattern to become an endpoint automatically.
:::

## CommentScope

Controls which comments in the SQL file are parsed as annotations.

| Scope | Description |
|-------|-------------|
| `All` | Parse every comment in the file, regardless of position. **(default)** |
| `Header` | Only parse comments that appear before the first SQL statement. |

### Example

With `CommentScope: "Header"`, only comments before the first statement are parsed:

```sql
-- This IS parsed as an annotation
-- HTTP GET
-- @authorize admin

select * from users;

-- This is NOT parsed (after first statement)
-- @cached
```

With `CommentScope: "All"` (default), all comments are parsed regardless of position.

## ErrorMode

Controls behavior when a SQL file fails to parse or when PostgreSQL reports an error during the describe phase.

| Mode | Description |
|------|-------------|
| `Exit` | Log the error and exit the process. Fail-fast — catches SQL errors at startup. **(default)** |
| `Skip` | Log the error, skip the file, and continue startup. Tolerates partial failures. |

All SQL file errors are logged at `Error` level. In `Exit` mode, a `Critical` log explains the exit and how to switch to `Skip` mode.

A warning is logged when the configured file pattern matches no files.

Errors caught at startup include:
- Parse errors (malformed SQL, unclosed strings/quotes)
- Describe errors (PostgreSQL syntax errors, invalid table/column references)
- Parameter type conflicts in multi-command files

::: tip
Use `Exit` (default) during development to catch SQL errors early. Use `Skip` in production to tolerate partial failures.
:::

## ResultPrefix

Prefix for result keys in multi-command JSON responses. Default keys are `result1`, `result2`, `result3`, etc.

```json
// Default: result1, result2, ...
"ResultPrefix": "result"

// Custom: data1, data2, ...
"ResultPrefix": "data"

// Custom: query1, query2, ...
"ResultPrefix": "query"
```

Individual result keys can be overridden per-file using the [`@result` annotation](../annotations/result-name).

## UnnamedSingleColumnSet

When `true` (default), single-column queries return flat arrays instead of arrays of objects. This matches the behavior of PostgreSQL functions returning `setof` single values.

```sql
-- sql/get_names.sql
select name from users;
```

With `UnnamedSingleColumnSet: true` (default):
```json
["Alice", "Bob", "Charlie"]
```

With `UnnamedSingleColumnSet: false`:
```json
[{"name": "Alice"}, {"name": "Bob"}, {"name": "Charlie"}]
```

This applies to both single-command endpoints and per-result in multi-command files.

## NestedJsonForCompositeTypes

Controls how composite type columns are serialized in SQL file endpoint responses.

**Default (flat):** Composite fields are spliced inline into the JSON row:

```sql
-- sql/get_user_with_address.sql
-- HTTP GET
-- @param $1 user_id
select id, address from users where id = $1;
-- where address is: create type address_type as (street text, city text, zip text)
```

```json
{"id": 1, "street": "123 Main St", "city": "New York", "zip": "10001"}
```

**With `NestedJsonForCompositeTypes: true` or `@nested` annotation:** Composite wrapped under column name:

```json
{"id": 1, "address": {"street": "123 Main St", "city": "New York", "zip": "10001"}}
```

Enable globally for all SQL file endpoints:

```json
"SqlFileSource": {
  "Enabled": true,
  "FilePattern": "sql/**/*.sql",
  "NestedJsonForCompositeTypes": true
}
```

Or per-endpoint with the [`@nested` annotation](../annotations/nested):

```sql
-- sql/get_user_with_address.sql
-- HTTP GET
-- @nested
-- @param $1 user_id
select id, address from users where id = $1;
```

NULL composites are serialized as `null` in nested mode, or as individual `null` fields in flat mode.

::: tip
This setting is also available in [Routine Options](./routine-options#nested-json-for-composite-types) for function/procedure endpoints. Each endpoint source has its own independent setting.
:::

## LogCommandText

Controls whether multi-command SQL file endpoints include the full SQL text in debug command logs.

**Default (`false`):** Only the file path and statement count are logged:

```
[DBG] -- POST http://127.0.0.1:8080/api/send-message
-- $1 text = 'hello'
SQL file: sql/send-message.sql (5 statements)
```

**With `LogCommandText: true`:** The full SQL body of all statements is logged.

```json
{
  "NpgsqlRest": {
    "SqlFileSource": {
      "LogCommandText": true
    }
  }
}
```

Single-command SQL file endpoints always log the SQL text regardless of this setting. This only applies when [`LogCommands`](./npgsqlrest#logcommands) is `true`.

## Quick Start Example

1. Enable the SQL file source in `appsettings.json`:

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

2. Create a SQL file:

```sql
-- sql/get_users.sql
-- HTTP GET
-- @authorize
-- @param $1 active
select id, name, email from users where active = $1;
```

3. The endpoint is available at `GET /api/get-users?active=true`

## Related

- [Changelog v3.12.0](../guide/changelog/v3.12.0) - Release notes for the SQL file source feature
- [PARAM](../annotations/param) - Rename, retype, and configure parameters
- [RESULT_NAME](../annotations/result-name) - Rename multi-command result keys
- [NpgsqlRest Options](./npgsqlrest) - Core API generation settings

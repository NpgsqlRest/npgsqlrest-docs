---
outline: [2, 3]
title: "CRUD Source Configuration"
titleTemplate: NpgsqlRest
description: "Auto-generate REST CRUD endpoints from PostgreSQL tables and views. Configure schemas, naming patterns, URL patterns, and which operations to expose."
head:
  - - meta
    - name: keywords
      content: npgsqlrest crud, postgresql crud api, auto-generate crud, table to rest api, postgresql view api, crud configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest CRUD Source Configuration"
  - - meta
    - property: og:description
      content: "Auto-generate REST CRUD endpoints from PostgreSQL tables and views. Configure schemas, naming, and operations."
  - - meta
    - property: og:type
      content: article
---

# CRUD Source

Configuration for automatic CRUD endpoint generation from PostgreSQL tables and views.

## Overview

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "Enabled": true,
      "SchemaSimilarTo": null,
      "SchemaNotSimilarTo": null,
      "IncludeSchemas": null,
      "ExcludeSchemas": null,
      "NameSimilarTo": null,
      "NameNotSimilarTo": null,
      "IncludeNames": null,
      "ExcludeNames": null,
      "CommentsMode": "OnlyWithHttpTag",
      "ReturningUrlPattern": "{0}/returning",
      "OnConflictDoNothingUrlPattern": "{0}/on-conflict-do-nothing",
      "OnConflictDoNothingReturningUrlPattern": "{0}/on-conflict-do-nothing/returning",
      "OnConflictDoUpdateUrlPattern": "{0}/on-conflict-do-update",
      "OnConflictDoUpdateReturningUrlPattern": "{0}/on-conflict-do-update/returning",
      "CrudTypes": ["All"]
    }
  }
}
```

## General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Enable CRUD endpoint generation for tables and views. |
| `CommentsMode` | string | `"OnlyWithHttpTag"` | How comment annotations affect endpoint creation. |

### Comments Mode

| Mode | Description |
|------|-------------|
| `Ignore` | Create all endpoints, ignore comment annotations. |
| `ParseAll` | Create all endpoints, parse comment annotations to modify them. |
| `OnlyWithHttpTag` | Only create endpoints for tables/views with `HTTP` tag in comments (default). |

When using `ParseAll`, you can use the [DISABLED](../annotations/disabled), [ENABLED](../annotations/enabled), and [TAGS](../annotations/tags) annotations to control which CRUD operations are exposed for each table.

## Schema and Name Filtering

Filter which tables and views are exposed as CRUD endpoints.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `SchemaSimilarTo` | string | `null` | Include schemas matching this SQL SIMILAR TO pattern. |
| `SchemaNotSimilarTo` | string | `null` | Exclude schemas matching this SQL SIMILAR TO pattern. |
| `IncludeSchemas` | array | `null` | List of schema names to include. |
| `ExcludeSchemas` | array | `null` | List of schema names to exclude. |
| `NameSimilarTo` | string | `null` | Include table/view names matching this SQL SIMILAR TO pattern. |
| `NameNotSimilarTo` | string | `null` | Exclude table/view names matching this SQL SIMILAR TO pattern. |
| `IncludeNames` | array | `null` | List of table/view names to include. |
| `ExcludeNames` | array | `null` | List of table/view names to exclude. |

### Filtering Examples

Include only specific schemas:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "IncludeSchemas": ["api", "public"]
    }
  }
}
```

Exclude system tables:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "ExcludeSchemas": ["pg_catalog", "information_schema"],
      "NameNotSimilarTo": "%_audit"
    }
  }
}
```

## URL Patterns

Configure URL patterns for different CRUD operation variants. Use `{0}` as placeholder for the default URL.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ReturningUrlPattern` | string | `"{0}/returning"` | URL pattern for INSERT/UPDATE/DELETE with RETURNING clause. |
| `OnConflictDoNothingUrlPattern` | string | `"{0}/on-conflict-do-nothing"` | URL pattern for INSERT ON CONFLICT DO NOTHING. |
| `OnConflictDoNothingReturningUrlPattern` | string | `"{0}/on-conflict-do-nothing/returning"` | URL pattern for INSERT ON CONFLICT DO NOTHING with RETURNING. |
| `OnConflictDoUpdateUrlPattern` | string | `"{0}/on-conflict-do-update"` | URL pattern for INSERT ON CONFLICT DO UPDATE (upsert). |
| `OnConflictDoUpdateReturningUrlPattern` | string | `"{0}/on-conflict-do-update/returning"` | URL pattern for INSERT ON CONFLICT DO UPDATE with RETURNING. |

### Custom URL Patterns

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "ReturningUrlPattern": "{0}-returning",
      "OnConflictDoUpdateUrlPattern": "{0}-upsert"
    }
  }
}
```

## CRUD Types

Enable or disable specific CRUD operations using the `CrudTypes` array.

| Type | HTTP Method | Description |
|------|-------------|-------------|
| `Select` | GET | Read records from tables/views. |
| `Insert` | POST | Create new records. |
| `InsertReturning` | POST | Create records and return inserted data. |
| `InsertOnConflictDoNothing` | POST | Insert or ignore on conflict. |
| `InsertOnConflictDoNothingReturning` | POST | Insert or ignore with returning. |
| `InsertOnConflictDoUpdate` | POST | Upsert (insert or update on conflict). |
| `InsertOnConflictDoUpdateReturning` | POST | Upsert with returning. |
| `Update` | PUT | Update existing records. |
| `UpdateReturning` | PUT | Update and return modified data. |
| `Delete` | DELETE | Remove records. |
| `DeleteReturning` | DELETE | Remove and return deleted data. |
| `All` | - | Enable all CRUD types. |

### Examples

Enable all operations:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "CrudTypes": ["All"]
    }
  }
}
```

Read-only access:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "CrudTypes": ["Select"]
    }
  }
}
```

Basic CRUD without conflict handling:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "CrudTypes": [
        "Select",
        "Insert",
        "InsertReturning",
        "Update",
        "UpdateReturning",
        "Delete",
        "DeleteReturning"
      ]
    }
  }
}
```

## Complete Example

Production configuration with filtering and specific CRUD types:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "Enabled": true,
      "IncludeSchemas": ["api"],
      "ExcludeNames": ["audit_log", "system_config"],
      "CommentsMode": "OnlyWithHttpTag",
      "ReturningUrlPattern": "{0}/returning",
      "OnConflictDoUpdateUrlPattern": "{0}/upsert",
      "OnConflictDoUpdateReturningUrlPattern": "{0}/upsert/returning",
      "CrudTypes": [
        "Select",
        "Insert",
        "InsertReturning",
        "InsertOnConflictDoUpdate",
        "InsertOnConflictDoUpdateReturning",
        "Update",
        "UpdateReturning",
        "Delete"
      ]
    }
  }
}
```

Minimal read-only configuration:

```json
{
  "NpgsqlRest": {
    "CrudSource": {
      "Enabled": true,
      "CommentsMode": "ParseAll",
      "CrudTypes": ["Select"]
    }
  }
}
```

## Controlling CRUD Operations with Annotations

When using `"CommentsMode": "ParseAll"`, table comments can control which CRUD operations are exposed.

### Example: Read-Only Table

```sql
comment on table audit_log is '
@disabled insert, update, delete
';
```

### Example: Selective Operations

```sql
comment on table users is '
@disabled
@enabled select, delete
';
```

Only SELECT and DELETE are enabled; INSERT and UPDATE return 405.

### Example: Different Settings per Operation

```sql
comment on table products is '
for select
@allow_anonymous
for update
@authorize admin
for returning
@disabled
';
```

See the annotation documentation for complete details on controlling CRUD operations.

## Related

- [HTTP annotation](../annotations/http) - Expose tables/views as endpoints
- [DISABLED annotation](../annotations/disabled) - Disable specific CRUD operations
- [ENABLED annotation](../annotations/enabled) - Enable specific CRUD operations
- [TAGS annotation](../annotations/tags) - Apply annotations conditionally by operation type
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings
- [Authentication Options](./authentication-options) - Configure endpoint authentication

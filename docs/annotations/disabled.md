---
outline: [2, 3]
title: "DISABLED Annotation"
titleTemplate: NpgsqlRest
description: "Disable PostgreSQL REST API endpoints globally or conditionally by tags. Control which CRUD operations are exposed for tables and views."
head:
  - - meta
    - name: keywords
      content: npgsqlrest disabled, disable endpoint, hide api endpoint, conditional disable, crud operation control
  - - meta
    - property: og:title
      content: "NpgsqlRest DISABLED Annotation"
  - - meta
    - property: og:description
      content: "Disable REST API endpoints globally or conditionally by tags for tables and views."
  - - meta
    - property: og:type
      content: article
---

# DISABLED

Disable endpoint globally or conditionally based on tags.

## Overview

This annotation prevents an endpoint from being created. Use it to:
- Completely disable an endpoint
- Conditionally disable an endpoint based on routine volatility or CRUD operation type
- Hide internal functions that shouldn't be exposed as HTTP endpoints
- Control which CRUD operations are exposed for tables and views

Tags are automatically assigned based on routine source (function volatility, CRUD operation type). See [TAGS](./tags) for the complete list of automatic tags.

This annotation is particularly useful with [automatic CRUD endpoint generation](../config/crud) to control which operations are exposed for tables and views.

## Keywords

`@disabled`, `disabled`

## Syntax

```
@disabled
@disabled <tag1>, <tag2>, <tag3>, ...
```

Space-separated lists are also valid: `@disabled insert update delete`

- Without tags: Disables the endpoint unconditionally
- With tags: Disables the endpoint only when it has at least one of the specified tags

## Understanding `disabled` with Tags

When you use `disabled` with tags, it only disables endpoints that have **at least one** of the specified tags:

```sql
-- Disable only INSERT operations (all variants)
@disabled insert

-- Disable only RETURNING variants (insert_returning, update_returning, delete_returning)
@disabled returning

-- Disable only ON CONFLICT variants (upsert operations)
@disabled on_conflict

-- Disable multiple operation types
@disabled insert, update, delete
```

### Tag Hierarchy for CRUD Operations

Tags are hierarchical - broader tags match multiple operations:

| Tag | Matches |
|-----|---------|
| `returning` | insert_returning, update_returning, delete_returning, on_conflict_do_nothing_returning, on_conflict_do_update_returning |
| `on_conflict` | on_conflict_do_nothing, on_conflict_do_update (and their returning variants) |
| `insert` | insert, insert_returning, all on_conflict variants |
| `update` | update, update_returning |
| `delete` | delete, delete_returning |

## Examples

### Disable Globally

```sql
comment on function deprecated_func() is
'HTTP
@disabled';
```

The function will not be exposed as an HTTP endpoint.

### Disable Volatile Functions

```sql
-- Disable endpoint for volatile functions (side effects)
comment on function dangerous_operation() is
'HTTP POST
@disabled volatile';
```

### Disable Write Operations on a Table

```sql
-- Make table read-only via API
comment on table reference_data is
'@disabled insert, update, delete';
```

This disables INSERT, UPDATE, and DELETE endpoints, keeping only SELECT.

### Disable for Production

```sql
comment on function admin_debug() is
'HTTP
@disabled production';
```

Endpoint is disabled when the routine has `production` tag but available in other environments.

### Selective Disable with Re-enable

```sql
comment on function internal_api() is
'HTTP GET
@disabled
@enabled immutable';
```

Disables by default, but re-enables for immutable functions only.

### Disable Returning Variants

```sql
-- Disable all RETURNING variants for simpler API
comment on table orders is
'@disabled returning';
```

This disables all CRUD operations that return data (insert returning, update returning, delete returning).

## CRUD Endpoint Control

When using CRUD source with `"CommentsMode": "ParseAll"`, you can use `disabled` and `enabled` annotations together to precisely control which CRUD operations are exposed.

### Disable All, Enable Specific Operations

```sql
create table crud_select_only (
    id int primary key,
    name text
);

comment on table crud_select_only is '
@disabled
@enabled select, delete
';
```

This table will only have SELECT and DELETE endpoints. All other operations (INSERT, UPDATE, and their variants) return 405 Method Not Allowed.

### Disable Specific Operation Groups Using Tags

```sql
create table crud_commented_table (
    id int primary key,
    name text
);

comment on table crud_commented_table is '
for returning
@disabled
@for insert_on_conflict_do_update, insert_on_conflict_do_nothing
@disabled
';
```

This disables:
- All RETURNING variants (insert returning, update returning, delete returning)
- All ON CONFLICT operations (upsert variants)

### Disable All, Enable Only ON CONFLICT Operations

```sql
create table crud_on_conflict_only (
    id int primary key,
    name text
);

comment on table crud_on_conflict_only is '
HTTP
@disabled
@for on_conflict
@enabled
';
```

This disables all standard CRUD endpoints but enables only the ON CONFLICT variants (upsert operations).

## Real-World Use Cases

### Read-Only API Table

Expose data for reading but prevent any modifications:

```sql
comment on table reference_data is '
@disabled insert, update, delete
';
```

Only `GET /api/reference-data/` works. All write operations return 405 Method Not Allowed.

### Audit Log (Append-Only)

Allow inserting audit records but prevent updates and deletes:

```sql
comment on table audit_log is '
@disabled update, delete
';
```

### Simplified API (No RETURNING Variants)

Keep the API surface small by disabling RETURNING endpoints:

```sql
comment on table orders is '
@disabled returning
';
```

This removes `/api/orders/returning/` endpoints, clients use standard endpoints and fetch data separately if needed.

### Upsert-Only Table (Idempotent API)

For idempotent APIs where clients should only use upsert:

```sql
comment on table sync_state is '
@disabled
@for on_conflict
@enabled
';
```

Only `PUT /api/sync-state/on-conflict-do-update/` works - perfect for sync/state endpoints.

## Behavior

- When used without tags, unconditionally disables the endpoint
- When used with tags, disables only if the endpoint has at least one matching tag
- Can be combined with `enabled` to create complex enable/disable logic
- Tags include automatic tags from routine source (volatility, CRUD type) and custom tags
- Case-insensitive tag matching
- Comma-separated tags work the same as space-separated: `disabled insert, update` equals `disabled insert update`

## Related

- [CRUD Source configuration](../config/crud) - Configure automatic CRUD endpoint generation
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [ENABLED](./enabled) - Enable endpoint globally or by tags
- [TAGS](./tags) - Automatic tags and conditional annotation application

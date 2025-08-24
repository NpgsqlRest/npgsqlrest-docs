---
outline: [2, 3]
title: "TAGS Annotation"
titleTemplate: NpgsqlRest
description: "Apply annotations conditionally based on endpoint tags. Configure different settings for CRUD operations, volatility types, and custom tags."
head:
  - - meta
    - name: keywords
      content: npgsqlrest tags, conditional annotations, crud tags, for keyword, endpoint tags, tag based configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest TAGS Annotation"
  - - meta
    - property: og:description
      content: "Apply annotations conditionally based on endpoint tags for CRUD operations and custom configurations."
  - - meta
    - property: og:type
      content: article
---

# TAGS

::: info Also known as
`for`, `tag` (no `@` prefix for this annotation)
:::

Apply subsequent annotations only when the endpoint has specific tags.

## Overview

Tags are automatically assigned to endpoints by different routine sources (functions, procedures, tables, views). The `for`/`tags` annotation allows you to conditionally apply annotations based on these tags.

This is useful for:
- Applying different configurations based on routine volatility (`volatile`, `stable`, `immutable`)
- Customizing behavior for CRUD operations (`select`, `insert`, `update`, `delete`)
- Environment-specific settings when combined with custom tags

This annotation is essential when using [automatic CRUD endpoint generation](../config/crud) to apply different configurations to different CRUD operations on the same table.

## Syntax

```
for <tag1>, <tag2>, <tag3>, ...
tags <tag1>, <tag2>, <tag3>, ...
```

Space-separated lists are also valid: `for select update delete`

Annotations following the `for`/`tags` line apply only when the endpoint has at least one of the specified tags.

## How `for` Creates Annotation Scopes

The `for` keyword creates a **scope** - all annotations that follow apply only to endpoints matching those tags, until the next `for` line or the end of the comment.

```sql
comment on table orders is '
HTTP
for select                    -- Start scope for SELECT endpoints
@allow_anonymous              -- Applied only to SELECT
@cached                       -- Applied only to SELECT

for insert, update            -- Start new scope for INSERT and UPDATE
@authorize                    -- Applied only to INSERT and UPDATE

for delete                    -- Start new scope for DELETE
@authorize admin              -- Applied only to DELETE
';
```

This creates **different configurations for each CRUD operation** from a single table comment.

## Automatic Tags by Source

### Function or Procedure Source

Tags are assigned based on routine volatility:

| Tag | Description |
|-----|-------------|
| `volatile` | Functions declared as VOLATILE |
| `stable` | Functions declared as STABLE |
| `immutable` | Functions declared as IMMUTABLE |
| `other` | Procedures and other routines |

### Table or View CRUD Source

Different CRUD operations receive different tags:

| Operation | Tags |
|-----------|------|
| **Select** | `select`, `read`, `get` |
| **Insert** | `insert`, `put`, `create` |
| **Insert Returning** | `insert`, `put`, `create`, `insert_returning`, `returning` |
| **Insert On Conflict Do Nothing** | `insert`, `put`, `create`, `insert_on_conflict_do_nothing`, `on_conflict_do_nothing`, `on_conflict` |
| **Insert On Conflict Do Nothing Returning** | `insert`, `put`, `create`, `insert_on_conflict_do_nothing_returning`, `on_conflict_do_nothing`, `on_conflict`, `returning` |
| **Insert On Conflict Do Update** | `insert`, `put`, `create`, `insert_on_conflict_do_update`, `on_conflict`, `on_conflict_do_update` |
| **Insert On Conflict Do Update Returning** | `insert`, `put`, `create`, `insert_on_conflict_do_update_returning`, `on_conflict_do_update`, `on_conflict`, `returning` |
| **Update** | `update`, `post` |
| **Update Returning** | `update`, `post`, `update_returning`, `returning` |
| **Delete** | `delete` |
| **Delete Returning** | `delete`, `delete_returning`, `returning` |

## Examples

### Volatility-Based Configuration

```sql
-- Apply caching only to immutable functions
comment on function calculate_hash(_data text) is
'HTTP GET
for immutable
@cached';
```

### CRUD-Specific Authorization

```sql
-- On a table, require authorization only for write operations
comment on table products is
'for select
@allow_anonymous
for insert, update, delete
@authorize admin';
```

### Environment-Specific Authorization

```sql
comment on function sensitive_data() is
'HTTP GET
for production
@authorize admin
for development
@allow_anonymous';
```

### Tag-Specific Paths

```sql
comment on function get_users() is
'HTTP GET
for v1
@path /api/v1/users
for v2
@path /api/v2/users';
```

### Multiple Tags

```sql
-- Apply rate limiting to all volatile operations
comment on function api_call() is
'HTTP POST
@for volatile, insert, update, delete
@rate_limiter_policy strict';
```

## CRUD Endpoint Control with Tags

When using CRUD source with `"CommentsMode": "ParseAll"`, use tags to apply different configurations to different CRUD operations on the same table.

### Custom Path for SELECT, Authorization for UPDATE

```sql
create table crud_commented_table (
    id int primary key,
    name text
);

comment on table crud_commented_table is 'This is a commented table
for select
HTTP GET /select_commented_table
@for update
@authorize
@for returning
@disabled
@for insert_on_conflict_do_update, insert_on_conflict_do_nothing  -- CSV format
@disabled
';
```

This configuration:
- Custom path `/select_commented_table` for SELECT (instead of default `/api/crud-commented-table/`)
- Requires authorization for UPDATE operations
- Disables all RETURNING variants
- Disables all ON CONFLICT operations

Results:
- `GET /api/crud-commented-table/` → 405 Method Not Allowed (default path disabled)
- `GET /select_commented_table/` → 200 OK (custom path)
- `POST /api/crud-commented-table/` → 401 Unauthorized (requires auth)
- `DELETE /api/crud-commented-table/returning/` → 404 Not Found (returning disabled)
- `PUT /api/crud-commented-table/on-conflict-do-update/` → 404 Not Found (on conflict disabled)

### Enable Only ON CONFLICT Operations

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

The `on_conflict` tag matches all ON CONFLICT operations, enabling only upsert endpoints while keeping standard CRUD disabled.

## Two Approaches: `for` Scopes vs Inline Tags

There are two ways to apply tag-based annotations:

### Approach 1: Using `for` Scopes

Use `for` to create a scope where multiple annotations apply:

```sql
comment on table products is '
@for select
@allow_anonymous
@cached
@timeout 5000

for insert, update, delete
@authorize
';
```

### Approach 2: Using Inline Tags with `disabled`/`enabled`

Use tags directly with `disabled` or `enabled` for simpler cases:

```sql
comment on table products is '
@disabled returning              -- Disable all RETURNING endpoints
@disabled on_conflict            -- Disable all ON CONFLICT endpoints
';
```

Both approaches can be combined:

```sql
comment on table products is '
@disabled                        -- Disable everything first
@enabled select, delete          -- Re-enable only SELECT and DELETE

for select                      -- Then customize SELECT
@cached
';
```

## Behavior

- Annotations after `for`/`tags` apply until the next `for`/`tags` line or end of comment
- If an endpoint matches any of the specified tags, the annotations are applied
- Tags are case-insensitive
- Multiple `for`/`tags` blocks can be used in the same comment
- Custom tags can be defined in addition to automatic tags
- Comma-separated tags work the same as space-separated: `for select, update` equals `for select update`

## Related

- [CRUD Source configuration](../config/crud) - Configure automatic CRUD endpoint generation
- [OpenAPI configuration](../config/openapi) - Tags are used in OpenAPI grouping
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [ENABLED](./enabled) - Enable for specific tags
- [DISABLED](./disabled) - Disable for specific tags

---
outline: [2, 3]
title: "ENABLED Annotation"
titleTemplate: NpgsqlRest
description: "Enable PostgreSQL REST API endpoints globally or conditionally by tags. Create whitelist patterns for secure API exposure."
head:
  - - meta
    - name: keywords
      content: npgsqlrest enabled, enable endpoint, whitelist pattern, conditional enable, api whitelist
  - - meta
    - property: og:title
      content: "NpgsqlRest ENABLED Annotation"
  - - meta
    - property: og:description
      content: "Enable REST API endpoints globally or by tags. Create whitelist patterns for secure exposure."
  - - meta
    - property: og:type
      content: article
---

# ENABLED

Enable endpoint globally or conditionally based on tags.

## Overview

By default, endpoints are enabled. This annotation is used to:
- Explicitly enable an endpoint that was previously disabled
- Conditionally enable an endpoint only when it has specific tags
- Create a "whitelist" pattern: disable everything, then enable only what you need

Tags are automatically assigned based on routine source (function volatility, CRUD operation type). See [TAGS](./tags) for the complete list of automatic tags.

This annotation is particularly useful with [automatic CRUD endpoint generation](../config/crud) to selectively re-enable operations after using `disabled`.

## Keywords

`@enabled`, `enabled`

## Syntax

```
@enabled
@enabled <tag1>, <tag2>, <tag3>, ...
```

Space-separated lists are also valid: `@enabled select update delete`

- Without tags: Enables the endpoint unconditionally
- With tags: Enables the endpoint only when it has at least one of the specified tags

## The Whitelist Pattern

The most common use of `enabled` is the **whitelist pattern** - disable everything first, then explicitly enable only the operations you want:

```sql
comment on table contacts is '
@disabled                        -- Disable all CRUD endpoints
@enabled select, insert_returning, update, delete
';
```

This is clearer and safer than trying to disable individual operations you don't want.

### Why Use Whitelist?

1. **Explicit is better than implicit** - You know exactly what's exposed
2. **Safer defaults** - New CRUD types added in future won't be auto-enabled
3. **Cleaner API surface** - Only expose what clients actually need
4. **Easier auditing** - Security reviewers see exactly what's enabled

## Examples

### Enable Globally

```sql
comment on function my_func() is
'HTTP
@enabled';
```

### Enable Only for Immutable Functions

```sql
-- Enable endpoint only when the function is immutable
comment on function calculate_total(_items json) is
'HTTP GET
@enabled immutable';
```

### Enable for Specific CRUD Operations

```sql
-- On a table, only enable read operations
comment on table audit_log is
'@enabled select, read, get';
```

This enables the SELECT endpoint but not INSERT, UPDATE, or DELETE.

### Enable for Beta Features

```sql
comment on function beta_feature() is
'HTTP
@enabled beta, testing';
```

Endpoint is only available when the routine has `beta` or `testing` tags.

### Combine with Other Annotations

```sql
comment on function stable_api() is
'HTTP GET
@disabled
@enabled stable, immutable
@cached';
```

First disables the endpoint globally, then re-enables it only for stable and immutable functions.

## CRUD Endpoint Control

When using CRUD source with `"CommentsMode": "ParseAll"`, combine `disabled` and `enabled` to precisely control which CRUD operations are exposed.

### Enable Only SELECT and DELETE

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

Results:
- `GET /api/crud-select-only/` → 200 OK (SELECT enabled)
- `DELETE /api/crud-select-only/` → 204 No Content (DELETE enabled)
- `POST /api/crud-select-only/` → 405 Method Not Allowed (UPDATE disabled)
- `PUT /api/crud-select-only/` → 405 Method Not Allowed (INSERT disabled)

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

This disables all standard CRUD operations but enables only upsert endpoints:
- `PUT /api/crud-on-conflict-only/on-conflict-do-nothing/` → 204 No Content
- `PUT /api/crud-on-conflict-only/on-conflict-do-update/` → 204 No Content
- All other endpoints → 404 Not Found

## Real-World Use Cases

### Contacts Manager API

A typical CRUD app needs select, insert (with returning for the new ID), update, and delete:

```sql
comment on table contacts is '
@disabled
@enabled select, insert_returning, update, delete
';
```

This creates exactly 4 endpoints:
- `GET /api/contacts/` - List/filter contacts
- `PUT /api/contacts/returning/` - Create contact, returns created record
- `POST /api/contacts/` - Update contact
- `DELETE /api/contacts/` - Delete contact

### Public Read, Authenticated Write

Allow anyone to read, but require authentication for modifications:

```sql
comment on table products is '
@disabled
@enabled select

for insert update delete
@enabled
@authorize
';
```

### Soft-Delete Pattern

Only allow select, insert, and update - no hard deletes:

```sql
comment on table documents is '
@disabled
@enabled select, insert_returning, update
';
```

Documents are "deleted" by setting a `deleted_at` timestamp via update.

### Event Sourcing / Append-Only

Only select and insert - no updates or deletes:

```sql
comment on table events is '
@disabled
@enabled select, insert_returning
';
```

### Lookup Tables (Read-Only)

Reference data that should never change via API:

```sql
comment on table countries is '
@disabled
@enabled select
';
```

## Behavior

- When used without tags, unconditionally enables the endpoint
- When used with tags, enables only if the endpoint has at least one matching tag
- Multiple `enabled` annotations can be used in the same comment
- Tags include automatic tags from routine source (volatility, CRUD type) and custom tags
- Case-insensitive tag matching
- Comma-separated tags work the same as space-separated: `enabled select, update` equals `enabled select update`

## Related

- [CRUD Source configuration](../config/crud) - Configure automatic CRUD endpoint generation
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [DISABLED](./disabled) - Disable endpoint globally or by tags
- [TAGS](./tags) - Automatic tags and conditional annotation application

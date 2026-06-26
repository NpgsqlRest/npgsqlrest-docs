---
outline: [2, 3]
title: "SSE_EVENTS_SCOPE Annotation"
titleTemplate: NpgsqlRest
description: "Control Server-Sent Events broadcast scope. Configure SSE message delivery to individual connections or all listeners."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sse scope, server sent events broadcast, sse message scope, event broadcasting, real-time scope
  - - meta
    - property: og:title
      content: "NpgsqlRest SSE_EVENTS_SCOPE Annotation"
  - - meta
    - property: og:description
      content: "Control Server-Sent Events broadcast scope for message delivery."
  - - meta
    - property: og:type
      content: article
---

# SSE_EVENTS_SCOPE

::: info Also known as
`sse_scope` (with or without `@` prefix)
:::

Control who receives Server-Sent Events from this endpoint.

::: info Why scope matters
Every event flows through the [single global broadcaster](./sse#how-events-flow), and every connected `EventSource` reads from the same stream. Scope is the per-event filter that decides which subscribers actually have the event written to their response. Without scope (or with `all`), every subscriber sees every event from this endpoint.
:::

## Syntax

```
@sse_scope <scope>
@sse_scope authorize <value1>, <value2>, ...
```

Space-separated lists are also valid: `@sse_scope authorize admin manager supervisor`

Or using custom parameter syntax:

```
@sse_scope = <scope>
@sse_events_scope = <scope>
```

## Values

| Value | Description |
|-------|-------------|
| `matching` | Clients with matching security context receive events (checks roles, user names, and user IDs) |
| `authorize` | Only authorized clients receive events. Optionally filter by role names, user names, or user IDs |
| `all` | All connected clients receive events |

## Request Correlation

Events are filtered by execution ID when both conditions are met:
- The request includes an execution ID header (configured via `ExecutionIdHeaderName`)
- The SSE event source includes the same execution ID as a query parameter

When execution IDs are provided but don't match, the event is skipped regardless of scope.

## Examples

### Matching Scope

```sql
comment on function team_task() is
'HTTP POST
@sse /team-events
@sse_scope matching';
```

**Equivalent as a SQL file endpoint** (`sql/team-task.sql`):

```sql
/*
HTTP POST
@sse /team-events
@sse_scope matching
*/
do $$ begin
    raise info 'team task progress...';
end $$;
```

Events are sent to clients with matching security context:
- If the endpoint requires authorization, all authorized sessions receive events
- If the endpoint requires specific roles, user names, or user IDs, only sessions matching those values receive events (checks `DefaultRoleClaimType`, `DefaultNameClaimType`, and `DefaultUserIdClaimType`)

### Authorize Scope with Roles

```sql
comment on function admin_broadcast() is
'HTTP POST
@sse /admin-events
@sse_scope authorize admin';
```

Only clients with `admin` role receive events.

### Authorize with User Names or IDs

```sql
comment on function specific_users_notification() is
'HTTP POST
@sse /user-events
@sse_scope authorize john.doe, jane.smith, user123';
```

Events are sent to clients matching any of the specified role names, user names, or user IDs.

### Multiple Values

```sql
comment on function staff_notification() is
'HTTP POST
@sse /staff-events
@sse_scope authorize admin, manager, supervisor';
```

Clients matching any of the specified values receive events.

### Broadcast to All

```sql
comment on function system_announcement() is
'HTTP POST
@sse /announcements
@sse_scope all';
```

All connected SSE clients receive events regardless of security context.

## Dynamic Scope via RAISE HINT

The scope can also be set dynamically at runtime using the `HINT` parameter of PostgreSQL `RAISE` statements. This allows different events within the same function to have different scopes:

```sql
create function process_with_notifications()
returns void
language plpgsql
as $$
begin
  -- This event goes to all clients
  raise notice 'System maintenance starting...' using hint = 'all';

  -- This event only goes to admins
  raise notice 'Admin: detailed system stats...' using hint = 'authorize admin';

  -- This event goes to specific users
  raise notice 'Your task is complete' using hint = 'authorize john.doe, jane.smith';

  -- This event uses the default scope from annotation
  raise notice 'General progress update...';
end;
$$;

comment on function process_with_notifications() is
'HTTP POST
@sse /process-events
@sse_scope matching';
```

The `HINT` value is parsed as: `<scope> [value1] [value2] ...`

When a hint is provided, it overrides the annotation scope for that specific event. When no hint is provided, the annotation scope is used.

## Related

- [Server-Sent Events Guide](../guide/sse) — the full walkthrough
- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure SSE options
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [SSE](./sse) - Enable Server-Sent Events
- [SSE_EVENTS_LEVEL](./sse-events-level) - Set notice level
- [AUTHORIZE](./authorize) - Endpoint authorization

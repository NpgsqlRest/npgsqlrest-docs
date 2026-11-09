---
outline: [2, 3]
title: "USER_CONTEXT Annotation"
titleTemplate: NpgsqlRest
description: "Pass authenticated user claims to PostgreSQL context variables. Access user info in SQL functions via current_setting()."
head:
  - - meta
    - name: keywords
      content: npgsqlrest user context, postgresql session context, user claims sql, current_setting user, session variables
  - - meta
    - property: og:title
      content: "NpgsqlRest USER_CONTEXT Annotation"
  - - meta
    - property: og:description
      content: "Pass user claims to PostgreSQL session context variables for SQL access."
  - - meta
    - property: og:type
      content: article
---

# USER_CONTEXT

Enable setting user claims into PostgreSQL session context variables for the endpoint.

## Keywords

`@user_context`, `user_context`

## Syntax

```
@user_context
```

## Examples

### Enable User Context

```sql
comment on function personalized_data() is
'HTTP GET
@authorize
@user_context';
```

### Access User Claims in Function

```sql
create function get_user_context()
returns table (
    user_id int,
    user_name text,
    user_roles text[]
)
language sql
begin atomic;
select
    current_setting('request.user_id', true)::int,
    current_setting('request.user_name', true)::text,
    (current_setting('request.user_roles', true))::text[];
end;

comment on function get_user_context() is '
@authorize
@user_context
';
```

**Equivalent as a SQL file endpoint** (`sql/get-user-context.sql`):

```sql
/*
HTTP GET
@authorize
@user_context
*/
select
    current_setting('request.user_id', true)::int as user_id,
    current_setting('request.user_name', true)::text as user_name,
    (current_setting('request.user_roles', true))::text[] as user_roles;
```

### Access All Claims as JSON

When `ClaimsJsonContextKey` is configured (e.g., `"request.user_claims"`):

```sql
create function get_full_claims()
returns table (claims text)
language sql
begin atomic;
select current_setting('request.user_claims', true)::text;
end;

comment on function get_full_claims() is '
@authorize
@user_context
';
```

### Access Client IP Address

```sql
create function get_client_info()
returns table (ip_address text)
language sql
begin atomic;
select current_setting('request.ip_address', true)::text;
end;

comment on function get_client_info() is '
@authorize
@user_context
';
```

### Combined with Request Headers

```sql
create function get_user_context_and_headers()
returns table (
    user_id int,
    user_name text,
    headers jsonb
)
language sql
begin atomic;
select
    current_setting('request.user_id', true)::int,
    current_setting('request.user_name', true)::text,
    current_setting('request.headers', true)::jsonb;
end;

comment on function get_user_context_and_headers() is '
@authorize
@user_context
@request_headers context
';
```

## Behavior

- Sets authenticated user claims into PostgreSQL context variables (settings) for the function to read
- Claims are accessible via `current_setting('context_key', true)` in PostgreSQL
- The second parameter `true` prevents errors when the setting doesn't exist
- Default behavior for all endpoints can be configured via [UseUserContext](../config/claims-mapping#user-context-postgresql-context-variables)
- Claim-to-context key mapping is configured via [ContextKeyClaimsMapping](../config/claims-mapping#user-context-postgresql-context-variables)

### Default Context Keys

| Context Key | Claim | Description |
|-------------|-------|-------------|
| `request.user_id` | `user_id` | User identifier |
| `request.user_name` | `user_name` | Username |
| `request.user_roles` | `user_roles` | User roles (array) |
| `request.ip_address` | - | Client IP address |

### Additional Context Keys (when configured)

| Context Key | Config Option | Description |
|-------------|---------------|-------------|
| *(configurable)* | `ClaimsJsonContextKey` | All claims serialized as JSON |

## How the Context Reaches PostgreSQL

The context keys are PostgreSQL settings: NpgsqlRest sets them with `set_config()` and your SQL reads them with `current_setting()`. How they are set depends on the endpoint.

### Together with the routine

*Since 4.0.0.* For **functions, tables and views, and SQL files with a single query or data-changing statement**, the context is sent to PostgreSQL together with the routine, in the same round trip:

```sql
select set_config($1, $2, true) is null, set_config($3, $4, true) is null;  -- the request context
select public.personalized_data($1);                                        -- the routine
```

Both statements run in one transaction, and the settings are local to it (`is_local = true`): the routine sees them, and they are gone when the request ends. Setting the context costs no extra round trip, and nothing is left on the pooled connection.

### Before the routine, at session level

The other endpoints set the context with a separate command before the routine runs, as *session-level* settings:

- **procedures**: a procedure can `COMMIT`, which would end transaction-local settings while it is still running
- **SQL files with several statements**, or with a statement that is not a query or a data change (`CALL`, `DO`, ...)
- **upload**, **login** and **logout** endpoints
- routines that return a single `bytea` value
- every endpoint, when [`BeforeRoutineCommands`](/config/npgsqlrest#beforeroutinecommands) are configured

Session-level settings stay on the connection after the request. When an application has such endpoints, the `npgsqlrest` client resets its connections between requests so that the next request cannot read them; see [Connection Reset Between Requests](/config/connection#connection-reset-between-requests). With [`WrapInTransaction`](/config/npgsqlrest#wrapintransaction) every request runs in one explicit transaction and the context is always local to it.

::: tip
[`UseUserContext: true`](../config/claims-mapping#user-context-postgresql-context-variables) turns the context on for *every* endpoint, including login and logout endpoints, so such an application keeps the connection reset. Putting `@user_context` only on the endpoints that read the context avoids that.
:::

### In both cases

- **Anonymous requests** set every user key to NULL (the IP address key is still set), so a `user_context` endpoint never sees a previous caller's identity.
- Once a database session has used a setting, PostgreSQL returns an **empty string**, not NULL, for it when it is not set. If your SQL casts the value, write `nullif(current_setting('request.user_id', true), '')::int` rather than `current_setting('request.user_id', true)::int`; the plain cast fails for anonymous requests.

## Related

- [Claims Mapping configuration](../config/claims-mapping) - Configure user context mapping
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [USER_PARAMETERS](./user-parameters) - Pass user claims as function parameters instead of context
- [AUTHORIZE](./authorize) - Require authentication
- [REQUEST_HEADERS_MODE](./request-headers-mode) - Access HTTP request headers in context

## See Also

- [Claims Mapping](/config/claims-mapping) - Configure user context mapping

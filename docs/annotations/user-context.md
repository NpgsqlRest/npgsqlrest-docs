---
outline: [2, 3]
title: "USER_CONTEXT Annotation"
titleTemplate: NpgsqlRest
description: "Pass authenticated user claims to PostgreSQL session context variables. Access user info in SQL functions via current_setting()."
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

- Sets authenticated user claims into PostgreSQL session context variables before executing the function
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

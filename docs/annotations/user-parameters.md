---
outline: [2, 3]
title: "USER_PARAMETERS Annotation"
titleTemplate: NpgsqlRest
description: "Pass authenticated user claims as PostgreSQL function parameters. Inject user ID, roles, and custom claims into SQL functions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest user parameters, user claims parameters, inject user id, function user parameter, authenticated user sql
  - - meta
    - property: og:title
      content: "NpgsqlRest USER_PARAMETERS Annotation"
  - - meta
    - property: og:description
      content: "Pass user claims as function parameters for authenticated endpoints."
  - - meta
    - property: og:type
      content: article
---

# USER_PARAMETERS

::: info Also known as
`user_params` (with or without `@` prefix)
:::

Enable passing user claims as function parameters for the endpoint.

## Syntax

```
@user_parameters
@user_params
```

## Examples

### Basic User Parameters

```sql
create function get_user_params(
    _user_id text,
    _user_name text,
    _user_roles text[]
)
returns table (
    user_id int,
    user_name text,
    user_roles text[]
)
language sql
begin atomic;
select
    _user_id::int,
    _user_name,
    _user_roles;
end;

comment on function get_user_params(text, text, text[]) is '
@authorize
@user_params
';
```

### With Default Values (for unauthenticated access)

```sql
create function get_user_params_optional(
    _user_id text = null,
    _user_name text = 'anonymous',
    _user_roles text[] = array[]::text[]
)
returns table (
    user_id int,
    user_name text,
    user_roles text[]
)
language sql
begin atomic;
select
    _user_id::int,
    _user_name,
    _user_roles;
end;

comment on function get_user_params_optional(text, text, text[]) is '
@user_params
';
```

### Access All Claims as JSON

```sql
create function get_user_ip_and_full_claims(
    _ip_address text,
    _user_claims json
)
returns table (
    ip_address text,
    user_claims json
)
language sql
begin atomic;
select
    _ip_address,
    _user_claims;
end;

comment on function get_user_ip_and_full_claims(text, json) is '
@authorize
@user_params
';
```

### Combined with User Context

```sql
comment on function user_profile() is
'HTTP GET
@authorize
@user_context
@user_parameters';
```

## Behavior

- Automatically injects user claim values into matching function parameters before execution
- Parameters are matched by name according to [ParameterNameClaimsMapping](../config/claims-mapping#user-parameters) configuration
- Default behavior for all endpoints can be configured via [UseUserParameters](../config/claims-mapping#user-parameters)
- Parameters with default values work without authentication; claim values override defaults when authenticated
- Parameters not found in claims use their default values or `null`
- **Claim values are always passed as `text` type.** For multi-value claims (like roles), values are passed as `text[]`. PostgreSQL handles type coercion to your parameter types.

### Default Parameter Mapping

| Parameter Name | Claim | Description |
|----------------|-------|-------------|
| `_user_id` | `user_id` | User identifier |
| `_user_name` | `user_name` | Username |
| `_user_roles` | `user_roles` | User roles (array) |
| `_ip_address` | - | Client IP address |
| `_user_claims` | - | All claims serialized as JSON |

### Differences from USER_CONTEXT

| Feature | USER_PARAMETERS | USER_CONTEXT |
|---------|-----------------|--------------|
| Access method | Function parameters | `current_setting()` |
| Works without auth | Yes (with defaults) | Yes (returns empty) |
| Type safety | PostgreSQL enforced | Manual casting required |
| Performance | Slightly faster | Slightly slower |

## Related

- [Claims Mapping configuration](../config/claims-mapping) - Configure user parameter mapping
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [USER_CONTEXT](./user-context) - Access user claims via PostgreSQL session context variables
- [AUTHORIZE](./authorize) - Require authentication

## See Also

- [Claims Mapping](/config/claims-mapping) - Configure user parameter mapping

---
outline: [2, 3]
title: "AUTHORIZE Annotation"
titleTemplate: NpgsqlRest
description: "Require authentication for PostgreSQL REST API endpoints. Configure role-based access control with single or multiple required roles."
head:
  - - meta
    - name: keywords
      content: npgsqlrest authorize, postgresql api authentication, role based access, require authentication, api authorization
  - - meta
    - property: og:title
      content: "NpgsqlRest AUTHORIZE Annotation"
  - - meta
    - property: og:description
      content: "Require authentication and configure role-based access for PostgreSQL REST API endpoints."
  - - meta
    - property: og:type
      content: article
---

# AUTHORIZE

::: info Also known as
`authorized`, `requires_authorization` (with or without `@` prefix)
:::

Require authentication for the endpoint. Optionally restrict access by roles, user names, or user IDs.

## Syntax

```
@authorize
@authorize <value1>, <value2>, <value3>, ...
```

Values can be role names, user names, or user IDs. Space-separated lists are also valid: `@authorize admin editor john`

## Examples

### Require Any Authenticated User

```sql
create function get_my_profile()
returns json
language sql
begin atomic;
select row_to_json(u) from users u where u.id = current_user_id();
end;

comment on function get_my_profile() is
'HTTP GET
@authorize';
```

**Equivalent as a SQL file endpoint** (`sql/get-my-profile.sql`):

```sql
-- HTTP GET
-- @authorize
select row_to_json(u) from users u where u.id = current_user_id();
```

Unauthenticated requests receive `401 Unauthorized`.

### Alternative Keywords

```sql
-- All of these are equivalent
comment on function func1() is 'HTTP
@authorize';

comment on function func2() is 'HTTP
@authorized';

comment on function func3() is 'HTTP
@requires_authorization';
```

### Require Specific Role

```sql
create function delete_user(_id int)
returns void
language sql
begin atomic;
delete from users where id = _id;
end;

comment on function delete_user(int) is
'HTTP DELETE
@authorize admin';
```

Only users with the `admin` role can access this endpoint.

### Authorize by User Name

::: tip Available since version 3.11.1
:::

```sql
create function get_my_profile()
returns json
language sql
begin atomic;
select row_to_json(u) from users u where u.id = current_user_id();
end;

comment on function get_my_profile() is
'HTTP GET
@authorize john';
```

Only the user with user name `john` can access this endpoint. Matches against the `DefaultNameClaimType` claim.

### Authorize by User ID

::: tip Available since version 3.11.1
:::

```sql
create function get_account()
returns json
language sql
begin atomic;
select row_to_json(a) from accounts a where a.user_id = current_user_id();
end;

comment on function get_account() is
'HTTP GET
@authorize user123';
```

Only the user with user ID `user123` can access this endpoint. Matches against the `DefaultUserIdClaimType` claim.

### Multiple Roles

```sql
create function manage_content(_action text, _id int)
returns json
language sql
begin atomic;
...;
end;

comment on function manage_content(text, int) is
'HTTP POST
@authorize admin, editor, moderator';
```

Users must have at least one of the specified roles.

### Mix of Roles and User Identifiers

::: tip Available since version 3.11.1
:::

```sql
comment on function get_data() is
'HTTP GET
@authorize admin, user123, jane';
```

Access is granted if the user matches any of the specified values — whether it's a role name, user name, or user ID. Each value is checked against all three claim types (`DefaultRoleClaimType`, `DefaultNameClaimType`, `DefaultUserIdClaimType`).

### Authorize Before HTTP

The order of annotations doesn't matter:

```sql
comment on function protected_func() is
'@authorize admin
HTTP GET';
```

### Authorize on Separate Line

```sql
comment on function another_protected() is
'HTTP

@authorize';
```

## Behavior

- Returns `401 Unauthorized` for unauthenticated requests
- Returns `403 Forbidden` when values are specified and user lacks a matching role, user name, or user ID
- Works with all configured authentication providers (JWT, Cookie, Basic, etc.)

## Related

- [Authentication configuration](../config/auth) - Configure authentication providers
- [Authentication Options configuration](../config/authentication-options) - Configure authentication behavior
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [ALLOW_ANONYMOUS](./allow-anonymous) - Override to allow unauthenticated access
- [LOGIN](./login) - Mark as authentication endpoint
- [LOGOUT](./logout) - Mark as sign-out endpoint

## See Also

- [Authentication](/config/auth) - Configure authentication providers
- [Authentication Options](/config/authentication-options) - Configure authentication behavior

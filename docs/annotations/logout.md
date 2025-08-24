---
outline: [2, 3]
title: "LOGOUT Annotation"
titleTemplate: NpgsqlRest
description: "Create sign-out endpoints for PostgreSQL REST APIs. Handle user logout by clearing cookies and invalidating sessions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest logout, signout endpoint, user logout api, session invalidation, clear authentication
  - - meta
    - property: og:title
      content: "NpgsqlRest LOGOUT Annotation"
  - - meta
    - property: og:description
      content: "Create sign-out endpoints that clear cookies and invalidate sessions."
  - - meta
    - property: og:type
      content: article
---

# LOGOUT

::: info Also known as
`signout` (with or without `@` prefix)
:::

Mark endpoint as a sign-out endpoint.

## Syntax

```
@logout
```

## Logout Endpoint Behavior

When an endpoint is marked with `logout`, NpgsqlRest executes the sign-out operation after running the function.

### Void Functions

If the function returns `void`, NpgsqlRest simply:
1. Executes the function
2. Calls sign-out on all authentication schemes
3. Completes the response

### Functions with Return Values

If the function returns values, **all returned values are interpreted as authentication scheme names** to sign out from. This allows selective logout from specific schemes.

- Single values are added as scheme names
- Arrays are expanded - each element becomes a scheme name
- NULL values are ignored
- If no schemes are returned (empty result), signs out from all schemes

This is useful when using multiple authentication schemes (e.g., Cookie and Bearer Token) and you want to sign out from only specific ones.

## Examples

### Basic Logout (Void)

```sql
create function signout()
returns void
language sql
begin atomic;
  -- Optionally perform cleanup
  delete from sessions where user_id = current_user_id();
end;

comment on function signout() is
'HTTP POST
@logout
@authorize';
```

Signs out from all authentication schemes.

### Logout from Specific Scheme

```sql
create function logout_cookie()
returns text
language sql
begin atomic;
  select 'Cookies'::text;
end;

comment on function logout_cookie() is
'HTTP POST /auth/logout/cookie
@logout
@authorize';
```

Signs out only from the "Cookies" authentication scheme.

### Logout from Multiple Schemes

```sql
create function logout_web()
returns text[]
language sql
begin atomic;
  select array['Cookies', 'Bearer']::text[];
end;

comment on function logout_web() is
'HTTP POST /auth/logout/web
@logout
@authorize';
```

Signs out from both "Cookies" and "Bearer" schemes.

### Conditional Scheme Logout

```sql
create function smart_logout(_scheme text default null)
returns text
language sql
begin atomic;
  select _scheme;  -- Returns NULL to logout from all, or specific scheme
end;

comment on function smart_logout(text) is
'HTTP POST /auth/logout
@logout
@authorize';
```

- `POST /auth/logout` → Signs out from all schemes
- `POST /auth/logout?_scheme=Cookies` → Signs out only from Cookies

### Logout with Cleanup

```sql
create function full_logout()
returns void
language plpgsql
as $$
begin
  -- Revoke all refresh tokens for this user
  delete from refresh_tokens where user_id = current_user_id();

  -- Log the logout event
  insert into audit_log(user_id, action)
  values (current_user_id(), 'logout');
end;
$$;

comment on function full_logout() is
'HTTP POST
@logout
@authorize';
```

## Related

- [Authentication configuration](../config/auth) - Configure authentication schemes
- [Authentication Options configuration](../config/authentication-options) - Configure logout behavior
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [LOGIN](./login) - Mark as sign-in endpoint
- [AUTHORIZE](./authorize) - Require authentication

## See Also

- [Authentication](/config/auth) - Configure authentication providers
- [Authentication Options](/config/authentication-options) - Configure authentication behavior

---
outline: [2, 3]
title: "BASIC_AUTH_REALM Annotation"
titleTemplate: NpgsqlRest
description: "Set HTTP Basic Authentication realm name for PostgreSQL REST API endpoints. Customize the authentication prompt."
head:
  - - meta
    - name: keywords
      content: npgsqlrest basic auth realm, authentication realm, www-authenticate header, basic auth prompt
  - - meta
    - property: og:title
      content: "NpgsqlRest BASIC_AUTH_REALM Annotation"
  - - meta
    - property: og:description
      content: "Set HTTP Basic Authentication realm name for the authentication prompt."
  - - meta
    - property: og:type
      content: article
---

# BASIC_AUTH_REALM

::: info Also known as
`basic_authentication_realm`, `realm` (with or without `@` prefix)
:::

Set the HTTP Basic Authentication realm name.

## Syntax

```
@realm = <realm-name>
@basic_auth_realm = <realm-name>
```

- `realm-name`: The realm name displayed in the browser's authentication dialog and included in the `WWW-Authenticate` response header.

## Default Value

If not specified, the default realm is `NpgsqlRest`.

## Examples

### Set Realm Name

```sql
create function protected_api()
returns json
language sql
begin atomic;
select '{"data": "secret"}'::json;
end;

comment on function protected_api() is '
HTTP GET
@basic_auth admin_user hashed_password_here
@realm = MyApplication
';
```

**Equivalent as a SQL file endpoint** (`sql/protected-api.sql`):

```sql
/*
HTTP GET
@basic_auth admin_user hashed_password_here
@realm = MyApplication
*/
select '{"data": "secret"}'::json;
```

When authentication fails, the response header will be:
```
WWW-Authenticate: Basic realm="MyApplication"
```

### Alternative Keyword

```sql
comment on function admin_area() is '
HTTP GET
@basic_auth admin hashed_password_here
@basic_auth_realm = Admin Area
';
```

### With Challenge Command

```sql
create function secure_endpoint(
    _user_claims json
)
returns text
language sql
begin atomic;
select _user_claims;
end;

comment on function secure_endpoint(json) is '
@basic_auth
@challenge_command = select * from validate_user($1, $2, $3, $4, $5)
@realm = SecureZone
@user_params
';
```

The realm value (`SecureZone`) is passed as the 4th parameter (`$4`) to the challenge command.

## Behavior

- Sets the `realm` parameter in the `WWW-Authenticate` response header when authentication fails.
- The realm helps browsers identify which set of credentials to use for a given protected resource.
- Different realms can have different sets of valid credentials.
- The realm name is displayed in browser authentication dialogs, helping users identify which credentials to enter.
- When using `challenge_command`, the realm value is passed as the 4th parameter to the validation function.

## Realm Resolution Order

The realm is determined in the following order:

1. Endpoint-specific `realm` annotation (highest priority)
2. Global `BasicAuth.Realm` configuration option
3. Default value: `NpgsqlRest`

## Related

- [Authentication Options configuration](../config/authentication-options) - Configure global Basic Auth realm
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [BASIC_AUTH](./basic-auth) - Enable Basic Authentication
- [BASIC_AUTH_COMMAND](./basic-auth-command) - Set validation function for custom authentication logic

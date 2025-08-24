---
outline: [2, 3]
title: "BASIC_AUTH_COMMAND Annotation"
titleTemplate: NpgsqlRest
description: "Configure PostgreSQL command for Basic Authentication credential validation. Custom user lookup and claim generation."
head:
  - - meta
    - name: keywords
      content: npgsqlrest basic auth command, credential validation, user lookup postgresql, authentication command
  - - meta
    - property: og:title
      content: "NpgsqlRest BASIC_AUTH_COMMAND Annotation"
  - - meta
    - property: og:description
      content: "Configure PostgreSQL command for Basic Authentication credential validation."
  - - meta
    - property: og:type
      content: article
---

# BASIC_AUTH_COMMAND

::: info Also known as
`basic_authentication_command`, `challenge_command` (with or without `@` prefix)
:::

Set the PostgreSQL command used to validate Basic Authentication credentials and return user claims.

## Syntax

```
@challenge_command = <sql-command>
@basic_auth_command = <sql-command>
```

- `sql-command`: A SQL SELECT statement that validates credentials and returns user claims.

## Command Parameters

The challenge command receives up to 5 parameters in the following order:

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | `text` | Username from the Authorization header |
| `$2` | `text` | Password from the Authorization header (plain text) |
| `$3` | `boolean` | Pre-validation result: `true` if password matched annotation credentials, `false` if not, `null` if no credentials were configured in the annotation |
| `$4` | `text` | Realm name (from annotation or default `NpgsqlRest`) |
| `$5` | `text` | Request path (e.g., `/api/my-endpoint`) |

## Return Value

The challenge command result set is interpreted **exactly the same as the [LOGIN](./login) endpoint**. This includes support for special columns and claim mapping.

### Special Columns

Four special column names control authentication behavior (configurable in `AuthenticationOptions`):

| Column | Default Name | Type | Purpose |
|--------|--------------|------|---------|
| Status | `status` | `boolean` or `int` | Controls success/failure. `true` or `200` = success, `false` or other status code = failure |
| Scheme | `scheme` | `text` | Authentication scheme name for sign-in |
| Body | `body` | `text` | Response body message (for schemes that don't write body) |
| Hash | `hash` | `text` | Password hash for verification by NpgsqlRest |

### Authentication Success

Return a row with claim columns. Column names become claim types, values become claim values:

```sql
-- Successful authentication returns claims
select
    1 as name_identifier,        -- becomes ClaimTypes.NameIdentifier
    'john_doe' as name,          -- becomes ClaimTypes.Name
    'admin' as role;             -- becomes ClaimTypes.Role
```

### Authentication Failure

Return either:
- No rows (empty result set), OR
- A row with a `status` column set to `false` (boolean) or a non-200 status code (integer)

```sql
-- Method 1: Return no rows
select * from users where false;

-- Method 2: Return status = false (boolean)
select false as status, null as name;

-- Method 3: Return status code (integer)
select 401 as status, 'Invalid credentials' as body;
```

For complete details on result set interpretation, see [LOGIN - Special Columns](./login#special-columns).

## Examples

### Basic Challenge Command

```sql
-- Validation function that checks credentials in the database
create function auth_challenge_command(
    _user text,
    _password text,
    _valid boolean,
    _realm text,
    _path text
)
returns table (
    name_identifier int,
    name text,
    role text
)
language sql
begin atomic;
select
    u.id,
    u.username,
    u.role
from users u
where u.username = _user
  and u.password_hash = crypt(_password, u.password_hash);
end;

-- Endpoint using the challenge command
create function protected_resource(
    _user_claims json
)
returns text
language sql
begin atomic;
select _user_claims;
end;

comment on function protected_resource(json) is '
@basic_auth
@challenge_command = select * from auth_challenge_command($1, $2, $3, $4, $5)
@user_params
';
```

### Challenge Command with Pre-Validated Password

When `basic_auth` includes credentials, the `$3` parameter indicates if the password already matched:

```sql
create function auth_with_preval(
    _user text,
    _password text,
    _valid boolean,     -- true if password matched annotation credentials
    _realm text,
    _path text
)
returns table (
    name_identifier int,
    name text,
    password text,
    valid boolean,
    realm text,
    path text
)
language sql
begin atomic;
select 1, _user, _password, _valid, _realm, _path;
end;

-- Generate hash: ./npgsqlrest --hash my_password
-- Output: Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t

create function get_basic_auth_challenge_command_pass(
    _user_claims json
)
returns text
language sql
begin atomic;
select _user_claims;
end;

comment on function get_basic_auth_challenge_command_pass(json) is '
@basic_auth my_name Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t
@challenge_command = select * from auth_with_preval($1, $2, $3, $4, $5)
@user_params
';
```

Test with:
```bash
# Generate header: ./npgsqlrest --basic_auth my_name my_password
curl -H "Authorization: Basic bXlfbmFtZTpteV9wYXNzd29yZA==" \
     http://localhost:5000/api/get-basic-auth-challenge-command-pass

# Returns: {"name_identifier":"1","name":"my_name","password":"my_password","valid":"True","realm":"NpgsqlRest","path":"/api/get-basic-auth-challenge-command-pass"}
```

### Challenge Command That Denies Access

```sql
create function auth_challenge_command_failed(
    _user text,
    _password text,
    _valid boolean,
    _realm text,
    _path text
)
returns table (
    status boolean,          -- First column named 'status' controls auth
    name_identifier int,
    name text
)
language sql
begin atomic;
select false, 1, _user;      -- status = false means denied
end;

create function denied_endpoint(
    _user_claims json
)
returns text
language sql
begin atomic;
select _user_claims;
end;

comment on function denied_endpoint(json) is '
@basic_auth
@challenge_command = select * from auth_challenge_command_failed($1, $2, $3, $4, $5)
@user_params
';
```

This will always return `401 Unauthorized` because the `status` column is `false`.

### Challenge Command Without Annotation Credentials

When `basic_auth` is used without credentials, `$3` will be `null`:

```sql
create function get_basic_auth_challenge_command(
    _user_claims json
)
returns text
language sql
begin atomic;
select _user_claims;
end;

comment on function get_basic_auth_challenge_command(json) is '
@basic_auth
@challenge_command = select * from auth_challenge_command($1, $2, $3, $4, $5)
@user_params
';
```

Test with:
```bash
# Any username/password combination will be passed to the challenge command
curl -H "Authorization: Basic eHh4Onl5eQ==" \  # xxx:yyy
     http://localhost:5000/api/get-basic-auth-challenge-command

# Returns: {"name_identifier":"1","name":"xxx","password":"yyy","valid":null,"realm":"NpgsqlRest","path":"/api/get-basic-auth-challenge-command"}
```

## Behavior

- The challenge command is executed for every request to the protected endpoint.
- If both annotation credentials and a challenge command are configured, the password is first verified against annotation credentials, and the result is passed as `$3`.
- The challenge command can implement custom logic such as:
  - Database-backed user authentication
  - Rate limiting based on failed attempts
  - IP-based access control using the path parameter
  - Audit logging of authentication attempts
  - Multi-factor authentication flows
- If the challenge command returns a row (without `status = false`), the column names become claim types and values become claim values for the authenticated user.
- Claims are accessible in the endpoint function via the `user_params` annotation.

## Related

- [Authentication Options configuration](../config/authentication-options) - Configure global challenge command
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [BASIC_AUTH](./basic-auth) - Enable Basic Authentication
- [BASIC_AUTH_REALM](./basic-auth-realm) - Set authentication realm
- [LOGIN](./login) - Login endpoint (uses same result set interpretation)
- [USER_PARAMETERS](./user-parameters) - Map authenticated user claims to function parameters

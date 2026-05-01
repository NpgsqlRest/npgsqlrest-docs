---
outline: [2, 3]
title: "BASIC_AUTH Annotation"
titleTemplate: NpgsqlRest
description: "Enable HTTP Basic Authentication for PostgreSQL REST API endpoints. Require username and password in Authorization header."
head:
  - - meta
    - name: keywords
      content: npgsqlrest basic auth, http basic authentication, authorization header, password authentication api
  - - meta
    - property: og:title
      content: "NpgsqlRest BASIC_AUTH Annotation"
  - - meta
    - property: og:description
      content: "Enable HTTP Basic Authentication requiring username and password."
  - - meta
    - property: og:type
      content: article
---

# BASIC_AUTH

::: info Also known as
`basic_authentication` (with or without `@` prefix)
:::

Enable HTTP Basic Authentication for the endpoint.

## Syntax

```
@basic_auth
@basic_auth <username> <password_hash>
```

- `username`: The expected username for authentication.
- `password_hash`: The hashed password generated using the NpgsqlRest CLI `--hash` command.

## Generating Password Hashes

Use the NpgsqlRest CLI to generate password hashes:

```bash
# Generate a hash for a password
./npgsqlrest --hash my_password

# Output example:
# Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t
```

## Generating Authorization Headers

Use the NpgsqlRest CLI to generate Base64-encoded Basic Auth headers for testing:

```bash
# Generate Authorization header value
./npgsqlrest --basic_auth my_name my_password

# Output example:
# Authorization: Basic bXlfbmFtZTpteV9wYXNzd29yZA==
```

## Examples

### Basic Auth Without Credentials (Requires Challenge Command)

When `basic_auth` is used without credentials, a `challenge_command` must be configured to validate the user:

```sql
create function get_basic_auth_no_creds(
    _user_name text = null -- mapped to name claim
)
returns text
language sql
begin atomic;
select _user_name;
end;

comment on function get_basic_auth_no_creds(text) is '
@basic_auth
@user_params
';
```

> **Note**: Without credentials and without a `challenge_command`, all requests will return `401 Unauthorized`.

### Basic Auth With Credentials

```sql
create function get_basic_auth_user(
    _user_name text = null -- mapped to name claim
)
returns text
language sql
begin atomic;
select _user_name;
end;

-- Generate hash: ./npgsqlrest --hash my_password
-- Output: Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t

comment on function get_basic_auth_user(text) is '
@basic_auth my_name Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t
@user_params
';
```

**Equivalent as a SQL file endpoint** (`sql/get-basic-auth-user.sql`):

```sql
/*
HTTP GET
@basic_auth my_name Myb55+6lW6iiUOI3opLkysOaS8J0NNIuQ+qE2SGaKs3r62ngDJROrhX75+zmLC7t
@user_params
@param $1 user_name
*/
select $1;
```

Test with:
```bash
# Generate header: ./npgsqlrest --basic_auth my_name my_password
curl -H "Authorization: Basic bXlfbmFtZTpteV9wYXNzd29yZA==" \
     http://localhost:5000/api/get-basic-auth-user
# Returns: my_name
```

### Multiple Users

You can define multiple users by adding multiple `basic_auth` annotations:

```sql
create function get_basic_auth_multiple_users(
    _user_name text = null -- mapped to name claim
)
returns text
language sql
begin atomic;
select _user_name;
end;

-- Generate hashes:
-- ./npgsqlrest --hash pass1  =>  um4K594nL6pBQx2el0lcbKKLADof1k9atRYKy+G14f6BQPtSCkwO6qz1wJ1d9Tx/
-- ./npgsqlrest --hash pass2  =>  TIDVxenk9gSqApyI82XDuqUaigQ5OdBIecfRtq7wFWtHT3Ffx2s+noIjvFCAw90z

comment on function get_basic_auth_multiple_users(text) is '
@basic_auth user1 um4K594nL6pBQx2el0lcbKKLADof1k9atRYKy+G14f6BQPtSCkwO6qz1wJ1d9Tx/
@basic_auth user2 TIDVxenk9gSqApyI82XDuqUaigQ5OdBIecfRtq7wFWtHT3Ffx2s+noIjvFCAw90z
@user_params
';
```

Test with:
```bash
# ./npgsqlrest --basic_auth user1 pass1
curl -H "Authorization: Basic dXNlcjE6cGFzczE=" \
     http://localhost:5000/api/get-basic-auth-multiple-users
# Returns: user1

# ./npgsqlrest --basic_auth user2 pass2
curl -H "Authorization: Basic dXNlcjI6cGFzczI=" \
     http://localhost:5000/api/get-basic-auth-multiple-users
# Returns: user2
```

## Behavior

- Requires HTTP Basic Authentication header in the format `Authorization: Basic <base64(username:password)>`.
- Returns `401 Unauthorized` with `WWW-Authenticate: Basic realm="..."` header if:
  - No `Authorization` header is provided.
  - The header is malformed or cannot be decoded.
  - Username or password is missing.
  - Username is not found in configured users.
  - Password verification fails.
- When credentials are specified in the annotation, passwords are verified using the configured password hasher.
- When no credentials are specified, a `challenge_command` must be configured to handle authentication.
- The authenticated username is available via the `user_params` annotation as the `name` claim.

## SSL Requirements

Basic Authentication transmits credentials encoded (not encrypted). The behavior when SSL is disabled is controlled by the `SslRequirement` configuration:

- `Required`: Rejects all non-SSL requests with `401 Unauthorized`.
- `Warning`: Allows requests but logs a warning.
- `Ignore`: Allows requests with only a debug-level log.

## Related

- [Authentication Options configuration](../config/authentication-options) - Configure Basic Auth globally
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [BASIC_AUTH_REALM](./basic-auth-realm) - Set authentication realm
- [BASIC_AUTH_COMMAND](./basic-auth-command) - Set validation function for custom authentication logic
- [USER_PARAMETERS](./user-parameters) - Map authenticated user claims to function parameters
- [AUTHORIZE](./authorize) - Token-based authorization

## See Also

- [Basic Auth Config](/config/basic-auth-config) - Configure Basic Authentication

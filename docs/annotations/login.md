---
outline: [2, 3]
title: "LOGIN Annotation"
titleTemplate: NpgsqlRest
description: "Create authentication endpoints for PostgreSQL REST APIs. Handle user sign-in with cookies, JWT tokens, or bearer tokens."
head:
  - - meta
    - name: keywords
      content: npgsqlrest login, authentication endpoint, signin api, user login postgresql, jwt login endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest LOGIN Annotation"
  - - meta
    - property: og:description
      content: "Create authentication endpoints for user sign-in with various token types."
  - - meta
    - property: og:type
      content: article
---

# LOGIN

::: info Also known as
`signin` (with or without `@` prefix)
:::

Mark endpoint as an authentication/sign-in endpoint.

## Syntax

```
@login
```

## Login Endpoint Conventions

Login endpoints have specific requirements and conventions for how they must be structured and what they return.

### Configuration

The login path can be set in configuration via `NpgsqlRest.AuthenticationOptions.LoginPath`. The default is `null`.

### Return Type Requirements

Login-enabled endpoints **must return a named record (table)**.

If the return type is:
- `void` type
- A simple value like `int` or `text`
- An unnamed record

The endpoint will return **401 Unauthorized**.

If the endpoint returns an empty record, it will also return **401 Unauthorized**.

If the endpoint returns multiple records, **only the first record is read and parsed** - the rest is discarded.

### Column Name Parsing

Returned columns are parsed by column name. The column name can be:
- The original column name from PostgreSQL
- Parsed by the default name converter (camelCase by default)

## Special Columns

Four special column names have specific meanings and are not converted to claims. Their names can be configured in `NpgsqlRest.AuthenticationOptions`:

| Column | Config Option | Default | Purpose |
|--------|---------------|---------|---------|
| Status | `StatusColumnName` | `status` | Controls login success/failure |
| Scheme | `SchemeColumnName` | `scheme` | Sets authentication scheme |
| Body | `BodyColumnName` | `body` | Response body message |
| Hash | `HashColumnName` | `hash` | Password hash for verification |

### Status Column

The `status` column controls whether login succeeds or fails.

**Boolean type:**
- `true` → Login continues with security claims (usually ends in 200 OK)
- `false` → Returns **401 Unauthorized**, login attempt stops

**Numeric type (int, smallint, bigint):**
- `200` → Login continues with security claims
- Any other value → Returns that HTTP status code, login attempt stops

If the column is neither boolean nor numeric, the endpoint returns **500 Internal Server Error**.

### Scheme Column

The `scheme` column sets the authentication scheme name for the sign-in operation.

This is useful when using multiple authentication schemes (e.g., Cookie and Bearer Token). You can handle them separately for login and logout operations.

### Body Column

The `body` column provides a textual message returned in the response body.

**Note:** This message is only returned when the configured authentication scheme doesn't write anything to the response body on sign-in:
- **Cookie authentication** - doesn't write to body, so `body` column value is used
- **Bearer Token schemes** - always write the response body, so `body` column is ignored

## Password Verification

NpgsqlRest can handle password verification automatically using a built-in password hasher. This allows you to return the password hash from the database and let NpgsqlRest verify it against the provided password.

### Hash Column

| Config Option | Default | Description |
|---------------|---------|-------------|
| `HashColumnName` | `hash` | Column name containing the password hash |

If the login endpoint returns a column with this name, NpgsqlRest will:
1. Read the hash value from this column
2. Identify the password parameter (first parameter containing `PasswordParameterNameContains`)
3. Verify the provided password against the hash
4. If verification fails, return **404 Not Found**

### Password Parameter Detection

| Config Option | Default | Description |
|---------------|---------|-------------|
| `PasswordParameterNameContains` | `pass` | Substring to identify the password parameter |

The first parameter whose name contains this value is used as the password parameter for verification.

### Built-in Password Hasher

The default password hasher uses **PBKDF2** (Password-Based Key Derivation Function 2) with:
- **SHA-256** algorithm
- **128-bit salt**
- **600,000 iterations** (OWASP-recommended as of 2025)

This provides secure password hashing out of the box. A custom `IPasswordHasher` implementation can be injected in source code if needed.

### Example with Hash Column

```sql
create function login(_username text, _password text)
returns table(hash text, id int, name text, email text)
language sql
begin atomic;
  select
    u.password_hash as hash,  -- Return hash for verification
    u.id,
    u.name,
    u.email
  from users u
  where u.username = _username;
end;

comment on function login(text, text) is
'HTTP POST
@login
@sensitive';
```

In this example:
1. The function returns the `hash` column with the stored password hash
2. NpgsqlRest identifies `_password` as the password parameter (contains "pass")
3. NpgsqlRest verifies `_password` against the returned hash
4. If verification succeeds, login continues with the returned claims
5. If verification fails, returns 404 Not Found

### Verification Callbacks

When using the built-in password hasher (returning a `hash` column), you can execute commands when password verification succeeds or fails. This is the only way to know whether password validation passed or failed.

| Config Option | Default | Description |
|---------------|---------|-------------|
| `PasswordVerificationFailedCommand` | `null` | Command to execute on failed verification |
| `PasswordVerificationSucceededCommand` | `null` | Command to execute on successful verification |

Both commands receive up to three positional parameters. All parameters are **optional** - you can define your procedure with 0, 1, 2, or all 3 parameters:

| Position | Type | Description |
|----------|------|-------------|
| `$1` | `text` | Authentication scheme used for the login |
| `$2` | `text` | User ID (value from `name_identifier` or `id` claim) |
| `$3` | `text` | Username (value from `name` claim) |

Configuration example:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "PasswordVerificationFailedCommand": "call password_verification_failed($1, $2, $3)",
      "PasswordVerificationSucceededCommand": "call password_verification_succeeded($1, $2, $3)"
    }
  }
}
```

#### Failed Verification Callback

Use this to implement account lockout after too many failed attempts:

```sql
create procedure password_verification_failed(
    _scheme text,
    _user_id text,
    _user_name text
)
language plpgsql as $$
declare
    _id int = _user_id::int;
    _attempts int;
begin
    -- Increment failed attempt counter
    update users
    set password_attempts = password_attempts + 1
    where id = _id
    returning password_attempts into _attempts;

    -- Lock account after 5 failed attempts
    if _attempts >= 5 then
        update users
        set locked_until = now() + interval '15 minutes'
        where id = _id;
    end if;
end;
$$;
```

#### Successful Verification Callback

Use this to reset failed attempt counters and log successful logins:

```sql
create procedure password_verification_succeeded(
    _scheme text,
    _user_id text,
    _user_name text
)
language plpgsql as $$
declare
    _id int = _user_id::int;
begin
    -- Reset failed attempts on successful login
    update users
    set password_attempts = 0
    where id = _id and password_attempts > 0;

    -- Log the login
    insert into login_history (user_id, logged_in_at)
    values (_id, now());
end;
$$;
```

#### Complete Example with Verification Callbacks

```sql
-- Login function that returns hash for verification
create function login(_email text, _password text)
returns table(
    hash text,
    name_identifier int,
    name text,
    email text,
    role text
)
language sql
begin atomic;
    select
        u.password_hash as hash,
        u.id as name_identifier,
        u.username as name,
        u.email,
        u.role
    from users u
    where u.email = _email
      and u.locked_until is null or u.locked_until < now();
end;

comment on function login(text, text) is
'HTTP POST /auth/login
@login
@sensitive';
```

With configuration:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "PasswordVerificationFailedCommand": "call password_verification_failed($1, $2, $3)",
      "PasswordVerificationSucceededCommand": "call password_verification_succeeded($1, $2, $3)"
    }
  }
}
```

Flow:
1. User calls `POST /auth/login` with email and password
2. Function returns user data including `hash` column
3. NpgsqlRest verifies `_password` against the hash
4. If verification **fails**: `password_verification_failed` is called, then 404 is returned
5. If verification **succeeds**: `password_verification_succeeded` is called, claims are created, user is signed in

## Claim Types

All other columns (not `status`, `scheme`, `body`, or `hash`) are interpreted as security claims:
- Column name → Claim type
- Column value → Claim value

Column names are converted directly to claim types without transformation.

Common claim types:

| Column | Purpose |
|--------|---------|
| `id` | User identification |
| `name` | User display name |
| `email` | User email address |
| `roles` | User roles (can be an array) |

## Examples

### Basic Login Endpoint

```sql
create function authenticate(_username text, _password text)
returns table(status boolean, id int, name text, email text, roles text[])
language sql
begin atomic;
  select
    true as status,
    u.id,
    u.name,
    u.email,
    u.roles
  from users u
  where u.username = _username
    and u.password_hash = crypt(_password, u.password_hash);
end;

comment on function authenticate(text, text) is
'HTTP POST
@login
@sensitive';
```

**Equivalent as a SQL file endpoint** (`sql/authenticate.sql`):

```sql
/*
HTTP POST
@login
@sensitive
@param $1 username
@param $2 password
*/
select
    true as status,
    u.id,
    u.name,
    u.email,
    u.roles
from users u
where u.username = $1
  and u.password_hash = crypt($2, u.password_hash);
```

### Login with Status Code Control

```sql
create function login(_email text, _password text)
returns table(status int, body text, id int, name text)
language plpgsql
as $$
begin
  -- Check if user exists and password matches
  if exists(select 1 from users where email = _email and password_hash = crypt(_password, password_hash)) then
    return query
      select 200, 'Login successful'::text, u.id, u.name
      from users u where u.email = _email;
  else
    -- Return 401 with error message
    return query select 401, 'Invalid credentials'::text, null::int, null::text;
  end if;
end;
$$;

comment on function login(text, text) is
'HTTP POST /auth/login
@login
@sensitive';
```

### Login with Multiple Schemes

```sql
create function api_login(_token text)
returns table(status boolean, scheme text, id int, name text)
language sql
begin atomic;
  select
    true,
    'Bearer'::text,  -- Use Bearer token scheme
    u.id,
    u.name
  from users u
  join api_tokens t on t.user_id = u.id
  where t.token = _token and t.expires_at > now();
end;

comment on function api_login(text) is
'HTTP POST /auth/token
@login';
```

### Failed Login Returns Empty

```sql
create function signin(_username text, _password text)
returns table(status boolean, id int, name text)
language sql
begin atomic;
  select true, u.id, u.name
  from users u
  where u.username = _username
    and u.password_hash = crypt(_password, u.password_hash);
  -- If no match, returns empty result → 401 Unauthorized
end;

comment on function signin(text, text) is
'HTTP POST
@login
@sensitive';
```

## Related

- [Authentication configuration](../config/auth) - Configure authentication schemes
- [Authentication Options configuration](../config/authentication-options) - Configure login behavior
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [LOGOUT](./logout) - Mark as sign-out endpoint
- [PARAMETER_HASH](./parameter-hash) - Hash passwords during user registration using the same built-in hasher
- [SECURITY_SENSITIVE](./security-sensitive) - Obfuscate credentials in logs
- [ALLOW_ANONYMOUS](./allow-anonymous) - Login endpoints typically need this
- [AUTHORIZE](./authorize) - Protect other endpoints

## See Also

- [Authentication](/config/auth) - Configure authentication providers
- [Authentication Options](/config/authentication-options) - Configure authentication behavior

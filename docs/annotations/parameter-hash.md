---
outline: [2, 3]
title: "PARAMETER_HASH Annotation"
titleTemplate: NpgsqlRest
description: "Hash password parameters for secure user registration. Automatically hash passwords before storing in PostgreSQL database."
head:
  - - meta
    - name: keywords
      content: npgsqlrest parameter hash, password hashing, secure registration, hash password api, user registration postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest PARAMETER_HASH Annotation"
  - - meta
    - property: og:description
      content: "Hash password parameters for secure user registration endpoints."
  - - meta
    - property: og:type
      content: article
---

# PARAMETER_HASH

::: info Also known as
`param` (with or without `@` prefix)
:::

Hash one parameter value using another parameter as the hash input. This annotation is commonly used to create user registration endpoints that securely store hashed passwords in the database.

## Syntax

```
@param <target_param> is hash of <source_param>
@parameter <target_param> is hash of <source_param>
```

- `target_param`: The parameter that will receive the hashed value.
- `source_param`: The parameter whose value will be hashed.

## Examples

### Simple User Registration

```sql
create function register(_email text, _password text, _hash text)
returns int
language sql
begin atomic;
insert into users (email, password_hash) values (_email, _hash) returning id;
end;

comment on function register(text, text, text) is '
@param _hash is hash of _password
';
```

**Equivalent as a SQL file endpoint** (`sql/register.sql`):

```sql
/*
HTTP POST
@param $1 email
@param $2 password
@param $3 hash is hash of password
*/
insert into users (email, password_hash) values ($1, $3) returning id;
```

### User Registration with Response

```sql
create function create_user(
    _username text,
    _password text,
    _password_hash text
)
returns json
language sql
begin atomic;
insert into users (username, password_hash)
values (_username, _password_hash)
returning json_build_object('id', id, 'username', username);
end;

comment on function create_user(text, text, text) is '
HTTP POST
@param _password_hash is hash of _password
';
```

When called with `{"username": "john", "password": "secret123"}`:
- `_password` receives the plain text `"secret123"`
- `_password_hash` receives the hashed value of `"secret123"`

## Behavior

- The hash is computed using the built-in password hasher.
- The source parameter value remains unchanged and can still be used in the function.
- The target parameter receives the hashed value before the function is executed.
- Both parameters must exist in the function signature.
- This is typically used for securely storing passwords without exposing them in plain text in the database.

## Built-in Password Hasher

The default password hasher uses **PBKDF2** (Password-Based Key Derivation Function 2) with:

- **SHA-256** algorithm
- **128-bit salt**
- **600,000 iterations** (OWASP-recommended as of 2025)

This provides secure password hashing out of the box. A custom `IPasswordHasher` implementation can be injected in source code if needed.

## Complete Registration and Login Flow

The `param is hash of` annotation works together with the [LOGIN](./login) annotation to provide a complete authentication flow using the same built-in password hasher:

1. **Registration**: Use `param <target> is hash of <source>` to hash passwords before storing them
2. **Login**: Return the stored hash in a `hash` column and NpgsqlRest verifies it automatically

### Registration Function

```sql
create function register(_email text, _password text, _hash text)
returns int
language sql
begin atomic;
insert into users (email, password_hash) values (_email, _hash) returning id;
end;

comment on function register(text, text, text) is '
HTTP POST /auth/register
@param _hash is hash of _password
@sensitive
';
```

### Login Function

```sql
create function login(_email text, _password text)
returns table(hash text, id int, name text, email text)
language sql
begin atomic;
select u.password_hash as hash, u.id, u.name, u.email
from users u where u.email = _email;
end;

comment on function login(text, text) is '
HTTP POST /auth/login
@login
@sensitive
';
```

Both functions use the same PBKDF2 hasher, ensuring passwords hashed during registration can be verified during login.

## Related

- [Authentication Options configuration](../config/authentication-options) - Configure password hasher
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [LOGIN](./login) - Authentication endpoint that verifies hashed passwords
- [BASIC_AUTH](./basic-auth) - Basic authentication with hashed passwords
- [SECURITY_SENSITIVE](./security-sensitive) - Obfuscate parameter values in logs

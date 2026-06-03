---
layout: doc
outline: [2, 3]
title: "Multiple Auth Schemes, RBAC, and External OAuth Providers"
titleTemplate: NpgsqlRest
description: "Implement multiple authentication schemes, role-based access control, Google/GitHub OAuth integration, and JWT tokens with PostgreSQL. Complete auth system guide."
head:
  - - meta
    - name: keywords
      content: postgresql oauth, postgresql rbac, multiple auth schemes, google oauth postgresql, github oauth api, jwt postgresql, role based access control api, npgsqlrest authentication
  - - meta
    - property: og:title
      content: "Multiple Auth Schemes, RBAC, and External OAuth Providers"
  - - meta
    - property: og:description
      content: "Implement multiple auth schemes, RBAC, and Google/GitHub OAuth with PostgreSQL."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Multiple Auth Schemes, RBAC & OAuth with PostgreSQL"
  - - meta
    - name: twitter:description
      content: "Multiple auth schemes, RBAC, Google/GitHub OAuth integration with PostgreSQL."
---

# Multiple Authentication Schemes, Role-Based Access Control, and External Providers

<p class="blog-meta">
  <span>January 2026</span> ·
  <span class="tag">Security</span>
  <span class="tag">Authentication</span>
  <span class="tag">OAuth</span>
  <span class="tag">NpgsqlRest</span>
</p>

In the [previous post](/blog/database-level-security-postgresql-authentication), we built a secure authentication system using PostgreSQL's pgcrypto extension for password hashing. That approach works well, but NpgsqlRest can go further: a built-in password verification system, multiple authentication schemes, role-based access control, and integration with external OAuth providers.

This post walks through an authentication example that combines four pieces:

1. **Built-in Password Hasher** - NpgsqlRest's pluggable password verification with verification callbacks
2. **Multiple Authentication Schemes** - Cookies, Bearer tokens, and JWT all working together
3. **Role-Based Access Control (RBAC)** - Restricting endpoints to specific roles
4. **External OAuth Providers** - Google login with zero password management

> **Source Code**: The complete working example is available at [github.com/NpgsqlRest/npgsqlrest-docs/examples/4_passwords_tokens_roles](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/4_passwords_tokens_roles)

## Why NpgsqlRest's Built-in Password Hasher?

The pgcrypto approach from the previous post hashes passwords in SQL, on the database server. The built-in hasher moves that work into NpgsqlRest, and the differences add up:

| pgcrypto Approach | NpgsqlRest Built-in Hasher |
|-------------------|---------------------------|
| Hashing logic in SQL | Hashing handled by NpgsqlRest |
| Requires pgcrypto extension | No extension needed |
| Must return hash for comparison | Returns hash, NpgsqlRest verifies automatically |
| Custom verification requires manual implementation | Built-in verification callbacks via config |
| bcrypt with 72-byte limit (needs workaround) | PBKDF2-SHA256 with no length limit |
| bcrypt only | Pluggable - can use Argon2 or any .NET algorithm |
| Runs on database server | Runs on application server |
| Generate hashes with SQL functions | Generate hashes with CLI or auto-hash parameters |

**Why process passwords on the application server?** When your database and application servers are separate (as they should be in production), every CPU cycle on the database server counts. Password hashing is intentionally CPU-intensive - offloading it to the application server keeps your database responsive for queries.

**Pluggable algorithms**: The default is PBKDF2, but since NpgsqlRest runs on .NET, you can plug in any password hasher available in the .NET ecosystem - including Argon2, scrypt, or custom implementations. This requires a custom build but gives you flexibility as security standards evolve.

The default built-in hasher uses **PBKDF2** (Password-Based Key Derivation Function 2) with:
- **SHA-256** algorithm
- **128-bit salt**
- **600,000 iterations** (OWASP-recommended as of 2025)

## Schema Design

The schema is straightforward - a users table with optional password hash:

```sql
-- V1__example_4_schema.sql

create table example_4.users (
    user_id int primary key generated always as identity,
    username text not null,
    email text not null,
    roles text[] not null,
    password_hash text null,  -- null when using external auth only
    last_login timestamp with time zone null,
    last_login_provider text null
);
```

Note that `password_hash` is nullable - users authenticating only via external providers (like Google) don't need a password.

### Generating Password Hashes

Use the NpgsqlRest CLI to generate hashes:

```bash
❯ npgsqlrest --hash password123
RfpqB6nKcoT2lL/w4ItB24mvxg8R9rC906C0/+7DAI62PQayBWjqihU96XPzmzYu

❯ npgsqlrest --hash password456
X+e/OsZkNL4j/9a7WIy/2bkQDk4rHHwlFwLXx7MNpclUUPdtQlI1JiDqyqMnJbgu
```

Insert users with pre-generated hashes:

```sql
insert into example_4.users (username, email, roles, password_hash) values
-- alice is a normal user
('alice', 'alice@example.com', array['user'],
    'RfpqB6nKcoT2lL/w4ItB24mvxg8R9rC906C0/+7DAI62PQayBWjqihU96XPzmzYu'),
-- bob is an admin
('bob', 'bob@example.com', array['user', 'admin'],
    'X+e/OsZkNL4j/9a7WIy/2bkQDk4rHHwlFwLXx7MNpclUUPdtQlI1JiDqyqMnJbgu'),
-- carol has no roles
('carol', 'carol@example.com', array[]::text[],
    '3XBVW23Yn6j8b8sRQMoerOvSYlFosXuRrY0G/nkquuquDNdSnbn8bacvCQlCQKhs');
```

### Automatic Parameter Hashing for Registration

For user registration endpoints, NpgsqlRest can automatically hash password parameters before they reach your function. Configure [`PasswordParameterNameContains`](/config/authentication-options#password-hashing-settings) to specify which parameters should be hashed:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "PasswordParameterNameContains": "password"
    }
  }
}
```

Any parameter containing "password" in its name will be automatically hashed using the same built-in hasher. Your registration function receives the hash directly - no hashing logic needed in SQL.

## Multiple Authentication Schemes

NpgsqlRest supports multiple authentication schemes simultaneously. This example configures three:

```json
{
  "Auth": {
    // Scheme 1: Cookie-based authentication
    "CookieAuth": true,
    "CookieAuthScheme": "cookies",
    "CookieValidDays": 1,
    "CookieName": "example_4_auth",

    // Scheme 2: Microsoft Bearer Token
    "BearerTokenAuth": true,
    "BearerTokenAuthScheme": "token",
    "BearerTokenExpireHours": 1,
    "BearerTokenRefreshPath": "/api/token/refresh",

    // Scheme 3: JWT
    "JwtAuth": true,
    "JwtAuthScheme": "jwt",
    "JwtSecret": "your-secret-key-at-least-32-characters-long",
    "JwtIssuer": "example_4",
    "JwtAudience": "example_4",
    "JwtExpireMinutes": 60,
    "JwtRefreshExpireDays": 7,
    "JwtRefreshPath": "/api/jwt/refresh"
  }
}
```

Each scheme has a unique name (`cookies`, `token`, `jwt`) that the login function returns to indicate which scheme to use.

### A Note on Data Protection and Encryption

Both **Cookies** and **Microsoft Bearer Tokens** are **encrypted by default** using ASP.NET Core's [Data Protection](/config/data-protection) system. Unlike JWT (which is signed but readable), both cookies and Bearer tokens are fully encrypted - the client cannot inspect their contents.

The Microsoft Bearer Token is a proprietary format, while the cookie encryption uses standard Data Protection mechanisms. Both rely on the same key management infrastructure. For production deployments, you should store these keys in the database so they persist across application restarts:

```json
{
  "DataProtection": {
    "Enabled": true,
    "DefaultKeyLifetimeDays": 90,
    "Storage": "Database",
    "GetAllElementsCommand": "select example_4.get_data_protection_keys()",
    "StoreElementCommand": "call example_4.store_data_protection_keys($1,$2)"
  }
}
```

With supporting SQL:

```sql
create table example_4.auth_data_protection_keys (
    name text not null primary key,
    data text not null
);

create function example_4.get_data_protection_keys()
returns setof text
language sql
begin atomic;
select data from example_4.auth_data_protection_keys;
end;

create procedure example_4.store_data_protection_keys(
    _name text,
    _data text
)
language sql
begin atomic;
insert into example_4.auth_data_protection_keys (name, data)
values (_name, _data)
on conflict (name) do update set data = excluded.data;
end;
```

Without database storage, keys are stored in memory and lost on restart - invalidating all existing cookies and tokens, forcing users to log in again. With database storage, encrypted authentication keeps working across application restarts.

For full details on authentication configuration, see:
- [Cookie Authentication](/config/auth#cookie-authentication)
- [Bearer Token Authentication](/config/auth#microsoft-bearer-token-authentication)
- [JWT Authentication](/config/auth#jwt-authentication)

## The Login Function with Built-in Password Verification

The login function returns the `password_hash` column - NpgsqlRest automatically verifies it:

```sql
-- R__example_4_login.sql

create or replace function example_4.login(
    _scheme text,
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    username text,
    roles text[],
    email text,
    password_hash text  -- NpgsqlRest verifies this automatically
)
language sql
set search_path = pg_catalog, pg_temp
begin atomic;
select
    _scheme,  -- Can be 'cookies', 'token', or 'jwt'
    user_id,
    username,
    roles,
    email,
    password_hash
from example_4.users
where
    username = _username;
end;

comment on function example_4.login(text, text, text) is '
HTTP POST
@login
@anonymous';
```

Key points:
1. The `_scheme` parameter lets clients choose which authentication method to use
2. The function returns `password_hash` - NpgsqlRest verifies it against `_password`
3. If verification fails, NpgsqlRest returns 404 Not Found (not 401, to avoid leaking whether users exist)

See the [login annotation documentation](/annotations/login) for full details on the built-in password hasher.

### Password Verification Callbacks

Configure callbacks for successful and failed password verification:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "HashColumnName": "password_hash",
      "PasswordVerificationFailedCommand": "call example_4.password_verification_failed($1, $2, $3)",
      "PasswordVerificationSucceededCommand": "call example_4.password_verification_succeeded($1, $2, $3)"
    }
  }
}
```

The callbacks receive the scheme, user ID, and username:

```sql
-- R__example_4_password_verification_succeeded.sql

create or replace procedure example_4.password_verification_succeeded(
    _scheme text,
    _user_id text,
    _user_name text
)
language plpgsql
set search_path = pg_catalog, pg_temp
as
$$
begin
    -- Update last login timestamp
    update example_4.users
    set
        last_login = now(),
        last_login_provider = _scheme
    where user_id = _user_id::int;

    raise notice 'Password verification succeeded for user % (ID: %) using scheme %',
        _user_name, _user_id, _scheme;
end;
$$;
```

```sql
-- R__example_4_password_verification_failed.sql

create or replace procedure example_4.password_verification_failed(
    _scheme text,
    _user_id text,
    _user_name text
)
language plpgsql
set search_path = pg_catalog, pg_temp
as
$$
begin
    -- Log failed attempt, increment counters, implement lockout, etc.
    raise warning 'Password verification failed for user % (ID: %) using scheme %',
        _user_name, _user_id, _scheme;
end;
$$;
```

These callbacks are the **only way to know** whether NpgsqlRest's built-in password verification succeeded or failed - use them for account lockout, audit logging, or failed-attempt counting.

## Role-Based Access Control

RBAC is implemented through the `authorize` annotation with role names:

```sql
-- R__example_4_get_users.sql

create or replace function example_4.get_users()
returns table (
    users example_4.users,
    is_this_me boolean
)
set search_path = pg_catalog, pg_temp
language sql
begin atomic;
select
    (u.*)::example_4.users,
    (u.user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int) is true
from example_4.users u;
end;

comment on function example_4.get_users() is '
HTTP GET
@authorize admin';  -- Only admin role can access
```

The `authorize admin` annotation restricts this endpoint to users with the `admin` role. Users without this role receive 403 Forbidden.

Compare these authorization levels:
- `authorize` - Any authenticated user
- `authorize admin` - Only users with `admin` role
- `authorize admin, manager` - Users with `admin` OR `manager` role

### User Context with current_setting

Instead of user parameters, this example uses PostgreSQL's `current_setting` to access user claims:

```sql
create function example_4.who_am_i()
returns example_4.who_am_i_response
set search_path = pg_catalog, pg_temp
language sql
begin atomic;
select
    nullif(pg_catalog.current_setting('request.user_id', true), '')::int as user_id,
    nullif(pg_catalog.current_setting('request.username', true), '') as username,
    nullif(pg_catalog.current_setting('request.email', true), '') as email,
    nullif(pg_catalog.current_setting('request.roles', true), '')::text[] as roles,
    last_login,
    last_login_provider
from example_4.users
where user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int;
end;
```

Configuration maps claims to settings:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "UseUserContext": true,
      "ContextKeyClaimsMapping": {
        "request.user_id": "user_id",
        "request.username": "username",
        "request.email": "email",
        "request.roles": "roles"
      }
    }
  }
}
```

See [User Context Settings](/config/authentication-options#user-context-settings) for details on this approach vs. user parameters.

## External OAuth Providers

Who needs passwords at all? An external OAuth provider takes a dozen lines of config:

```json
{
  "Auth": {
    "External": {
      "Enabled": true,
      "SigninUrl": "/signin-{0}",
      "LoginCommand": "select * from example_4.external_login($1,$2,$3,$4,$5)",
      "Google": {
        "Enabled": true,
        "ClientId": "{GOOGLE_CLIENT_ID}",
        "ClientSecret": "{GOOGLE_CLIENT_SECRET}"
      }
    }
  }
}
```

That's it. Users can now visit `/signin-google` to authenticate via Google.

### The External Login Function

When OAuth completes, NpgsqlRest calls your login command with the provider info:

```sql
-- R__example_4_external_login.sql

create or replace function example_4.external_login(
    _provider text,      -- e.g., "google"
    _email text,         -- User's email from provider
    _name text,          -- User's display name
    _provider_data json, -- Raw data from OAuth provider
    _analytics_data json -- Browser analytics (screen size, timezone, etc.)
)
returns table (
    scheme text,
    user_id int,
    username text,
    roles text[],
    email text
)
language plpgsql
set search_path = public, pg_catalog
as
$$
declare
    _user_id int;
begin
    return query
    select
        'cookies' as scheme,  -- External logins use cookies by default
        u.user_id,
        u.username,
        u.roles,
        u.email
    from example_4.users u
    where u.username = _email;  -- Match by email

    if not found then
        raise warning 'Could not find user with email % for provider %',
            _email, _provider;
    else
        _user_id = (
            select u.user_id
            from example_4.users u
            where u.username = _email
        );

        update example_4.users
        set
            last_login = now(),
            last_login_provider = _provider
        where example_4.users.user_id = _user_id;
    end if;
end
$$;
```

The function uses the same conventions as the regular [login annotation](/annotations/login) - return a named record with `scheme` and claim columns.

For full details on external authentication, see the [External OAuth Authentication](/config/external-auth) documentation. NpgsqlRest supports Google, GitHub, LinkedIn, Microsoft, Facebook, and custom OAuth providers.

## The Demo Application

The example includes a web interface demonstrating all authentication methods:

```html
<div id="login-form">
    <h2>Login</h2>
    <input type="text" id="username" placeholder="Username" />
    <input type="password" id="password" placeholder="Password" />

    <div style="margin: 8px 0;">
        <label><strong>Auth Scheme:</strong></label>
        <label><input type="radio" name="scheme" value="cookies" checked /> Cookies</label>
        <label><input type="radio" name="scheme" value="token" /> Bearer Token</label>
        <label><input type="radio" name="scheme" value="jwt" /> JWT</label>
    </div>

    <button id="login-btn">Login</button>

    <a href="/signin-google">Login with Google (Cookies)</a>
</div>

<div id="actions">
    <button id="whoami-btn">Who Am I?</button>
    <button id="getusers-btn">Get Users (Admin)</button>
    <button id="logout-btn">Logout</button>
</div>
```

Test users:
- **alice** (password: `password123`) - has `user` role
- **bob** (password: `password456`) - has `user` and `admin` roles
- **carol** (password: `password789`) - has no roles

Try logging in as alice and clicking "Get Users (Admin)" - you'll get 403 Forbidden. Log in as bob and it works.

## Configuration Summary

The complete configuration enables all features:

```json
{
  "ApplicationName": "4_passwords_tokens_roles",

  "Auth": {
    "CookieAuth": true,
    "CookieAuthScheme": "cookies",
    "CookieValidDays": 1,

    "BearerTokenAuth": true,
    "BearerTokenAuthScheme": "token",
    "BearerTokenExpireHours": 1,
    "BearerTokenRefreshPath": "/api/token/refresh",

    "JwtAuth": true,
    "JwtAuthScheme": "jwt",
    "JwtSecret": "your-secret-key-at-least-32-characters-long",
    "JwtExpireMinutes": 60,
    "JwtRefreshPath": "/api/jwt/refresh",

    "External": {
      "Enabled": true,
      "LoginCommand": "select * from example_4.external_login($1,$2,$3,$4,$5)",
      "Google": {
        "Enabled": true,
        "ClientId": "{GOOGLE_CLIENT_ID}",
        "ClientSecret": "{GOOGLE_CLIENT_SECRET}"
      }
    }
  },

  "NpgsqlRest": {
    "IncludeSchemas": [ "example_4" ],
    "RequiresAuthorization": true,

    "AuthenticationOptions": {
      "DefaultUserIdClaimType": "user_id",
      "DefaultNameClaimType": "username",
      "DefaultRoleClaimType": "roles",

      "HashColumnName": "password_hash",
      "PasswordVerificationFailedCommand": "call example_4.password_verification_failed($1, $2, $3)",
      "PasswordVerificationSucceededCommand": "call example_4.password_verification_succeeded($1, $2, $3)",

      "UseUserContext": true,
      "ContextKeyClaimsMapping": {
        "request.user_id": "user_id",
        "request.username": "username",
        "request.email": "email",
        "request.roles": "roles"
      }
    },

    "ClientCodeGen": {
      "FilePath": "./4_passwords_tokens_roles/src/{0}Api.ts",
      "IncludeParseRequestParam": true
    }
  }
}
```

### Generated Client with Token Support

The `IncludeParseRequestParam: true` option generates API functions that accept an optional `parseRequest` callback. This allows you to inject authorization headers for Bearer token or JWT authentication:

```typescript
// Add Authorization header for token-based auth
function parseRequest(request: RequestInit): RequestInit {
    if (!authToken) return request;

    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${authToken}`);
    return { ...request, headers };
}

// Pass the callback to any API call
const response = await whoAmI(parseRequest);
const users = await getUsers(parseRequest);
```

For cookie authentication, no callback is needed - cookies are sent automatically by the browser. But for Bearer tokens or JWT, you need to add the `Authorization` header manually, and `IncludeParseRequestParam` makes this trivial.

## Conclusion: Enterprise Auth Made Simple

Modern authentication and authorization is notoriously complex. A production-ready system typically requires:

- Multiple authentication schemes (cookies for web, tokens for APIs, JWT for microservices)
- Secure password storage with modern algorithms
- Role-based access control with claim management
- OAuth integration with external providers
- Account lockout and audit logging
- Token refresh mechanisms
- Session management

Implementing all of this traditionally takes multiple libraries and deep security expertise - and getting it wrong means vulnerabilities.

**With NpgsqlRest, all of this is configuration and a few SQL functions.**

What this example actually required:

| Component | Lines of Code |
|-----------|---------------|
| Schema + users table | ~15 lines SQL |
| Login function | ~15 lines SQL |
| Logout function | ~8 lines SQL |
| Who Am I function | ~15 lines SQL |
| Role-restricted endpoint | ~10 lines SQL |
| External login function | ~25 lines SQL |
| Verification callbacks | ~20 lines SQL |
| **Configuration** | ~50 lines JSON |
| **Total** | **~160 lines** |

That's it. Under 200 lines for a complete authentication system with:

- Three authentication schemes (cookies, Bearer tokens, JWT)
- Built-in password verification with OWASP-compliant hashing
- Role-based access control
- Google OAuth integration
- Verification callbacks for security features
- Token refresh endpoints
- User context in every request

Compare this to a typical Node.js/Express or Spring Boot implementation - you'd be looking at thousands of lines of code, multiple dependencies, and weeks of development time.

### This Blog Post is Your Recipe

Use this example as a template:

1. **Copy the schema** - Adapt the users table to your needs
2. **Copy the configuration** - Enable the schemes you need, add your OAuth credentials
3. **Write your login function** - Return the scheme and claims you want
4. **Add role annotations** - `authorize admin` on endpoints that need it
5. **Done** - You have production-ready authentication

The code you don't write has no bugs, and authentication is exactly where you want fewer of them.

Combined with [database-level security](/blog/database-level-security-postgresql-authentication) (Principle of Least Privilege, SECURITY DEFINER, search path protection) and [end-to-end type safety](/blog/end-to-end-static-type-checking-postgresql-typescript), you get a complete, secure, performant application stack that would take months to build from scratch.

::: tip SQL File Source
Everything in this post also works with [SQL file endpoints](/guide/sql-files) — no functions needed. See the [SQL file version of this example](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/4_passwords_tokens_roles_sql_file).
:::

<BlogNav
  source-code="https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/4_passwords_tokens_roles"
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Authentication Config', href: '/config/auth' },
    { text: 'External OAuth', href: '/config/external-auth' },
    { text: 'Login Annotation', href: '/annotations/login' }
  ]"
/>

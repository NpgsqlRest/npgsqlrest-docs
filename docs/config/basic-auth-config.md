---
outline: [2, 3]
title: "Basic Auth Configuration"
titleTemplate: NpgsqlRest
description: "Configure HTTP Basic Authentication in NpgsqlRest. Username/password validation, password hashing, SSL requirements, and PostgreSQL-backed authentication."
head:
  - - meta
    - name: keywords
      content: npgsqlrest basic auth, http basic authentication, authorization header api, password authentication postgresql, basic auth ssl
  - - meta
    - property: og:title
      content: "NpgsqlRest Basic Auth Configuration"
  - - meta
    - property: og:description
      content: "Configure HTTP Basic Authentication with password hashing and SSL requirements."
  - - meta
    - property: og:type
      content: article
---

# Basic Auth Configuration

HTTP Basic Authentication support with `Authorization: Basic base64(username:password)` header.

## Overview

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "BasicAuth": {
        "Enabled": false,
        "Realm": null,
        "Users": {},
        "SslRequirement": "Required",
        "UseDefaultPasswordHasher": true,
        "ChallengeCommand": null
      }
    }
  }
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable Basic Authentication support. |
| `Realm` | string | `null` | Authentication realm. Uses `"NpgsqlRest"` if `null`. |
| `Users` | object | `{}` | Username/password dictionary. Value is password or hash depending on `UseDefaultPasswordHasher`. |
| `SslRequirement` | string | `"Required"` | SSL requirement: `"Ignore"`, `"Warning"`, or `"Required"`. |
| `UseDefaultPasswordHasher` | bool | `true` | Expect hashed passwords in configuration. |
| `ChallengeCommand` | string | `null` | PostgreSQL command for authentication challenge. |

## SSL Requirement Values

| Value | Description |
|-------|-------------|
| `Ignore` | Allow Basic Auth without SSL (debug log warning). |
| `Warning` | Issue log warning when connection is not secure. |
| `Required` | Enforce SSL/TLS connection. |

## Challenge Command Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | text | Username from Basic Auth header. |
| `$2` | text | Password from Basic Auth header. |
| `$3` | bool | Password validation result (`true`/`false`/`null` if no password defined). |
| `$4` | text | Basic Auth realm. |
| `$5` | text | Endpoint path. |

## Static Users Example

Configure users directly in the configuration file:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "BasicAuth": {
        "Enabled": true,
        "Realm": "MyAPI",
        "SslRequirement": "Required",
        "UseDefaultPasswordHasher": false,
        "Users": {
          "admin": "secret123",
          "user1": "password456"
        }
      }
    }
  }
}
```

::: warning
When `UseDefaultPasswordHasher` is `false`, passwords are stored in plain text. Use hashed passwords in production.
:::

## Database Authentication Example

Use a PostgreSQL function for authentication challenge:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "BasicAuth": {
        "Enabled": true,
        "Realm": "MyAPI",
        "SslRequirement": "Required",
        "UseDefaultPasswordHasher": true,
        "ChallengeCommand": "select * from basic_auth_login($1, $2, $3)"
      }
    }
  }
}
```

### Challenge Function Example

```sql
create function basic_auth_login(
    _username text,
    _password text,
    _validated bool
)
returns table (
    status bool,
    user_id int,
    user_name text,
    user_roles text[]
)
language plpgsql as $$
begin
    -- Check if password was validated by static users
    if _validated = true then
        return query
        select true, 1, _username, array['admin']::text[];
        return;
    end if;

    -- Validate against database
    return query
    select
        u.password_hash = crypt(_password, u.password_hash),
        u.id,
        u.username,
        array_agg(r.role_name)
    from users u
    left join user_roles r on r.user_id = u.id
    where u.username = _username
    group by u.id, u.username, u.password_hash;
end;
$$;
```

**Equivalent as inline SQL:**

`ChallengeCommand` is executed directly, so it does not have to call a function — any statement using `$1`–`$5` works:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "BasicAuth": {
        "Enabled": true,
        "ChallengeCommand": "select u.password_hash = crypt($2, u.password_hash) as status, u.id as user_id, u.username as user_name, array_agg(r.role_name) as user_roles from users u left join user_roles r on r.user_id = u.id where u.username = $1 group by u.id, u.username, u.password_hash"
      }
    }
  }
}
```

## Complete Example

Production configuration with Basic Authentication:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "BasicAuth": {
        "Enabled": true,
        "Realm": "MyAPI",
        "SslRequirement": "Required",
        "UseDefaultPasswordHasher": true,
        "ChallengeCommand": "select * from basic_auth_login($1, $2, $3)"
      }
    }
  }
}
```

## Related

- [Authentication Guide](../guide/authentication) — the full walkthrough
- [Authentication Options](./authentication-options) - Core authentication options (login/logout, password handling)
- [Claims Mapping](./claims-mapping) - Configure user context and parameters mapping
- [basic_auth annotation](../annotations/basic-auth) - Enable Basic Authentication per endpoint
- [basic_auth_realm annotation](../annotations/basic-auth-realm) - Set realm per endpoint
- [basic_auth_command annotation](../annotations/basic-auth-command) - Set challenge command per endpoint
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication Options](./authentication-options) - Configure login/logout and password handling
- [Claims Mapping](./claims-mapping) - Configure claims to context and parameters
- [Authentication](./auth) - Configure authentication methods (Cookie, Bearer Token, OAuth)

## See Also

- [BASIC_AUTH](/annotations/basic-auth) - Enable Basic Auth per endpoint
- [BASIC_AUTH_REALM](/annotations/basic-auth-realm) - Set realm per endpoint
- [BASIC_AUTH_COMMAND](/annotations/basic-auth-command) - Set challenge command per endpoint

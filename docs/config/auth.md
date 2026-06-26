---
outline: [2, 3]
title: "Authentication Configuration"
titleTemplate: NpgsqlRest
description: "Configure authentication in NpgsqlRest: Cookie sessions, Bearer tokens, JWT tokens, and OAuth providers. Secure your PostgreSQL REST API with multiple auth methods."
head:
  - - meta
    - name: keywords
      content: npgsqlrest authentication, postgresql api auth, jwt postgresql, cookie auth rest api, bearer token postgresql, oauth postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest Authentication Configuration"
  - - meta
    - property: og:description
      content: "Configure Cookie, Bearer Token, JWT, and OAuth authentication for your PostgreSQL REST API."
  - - meta
    - property: og:type
      content: article
---

# Authentication

This page covers Cookie, Bearer Token, and JWT authentication settings in NpgsqlRest.

## Overview

NpgsqlRest supports multiple authentication methods that can be used together:

- **Cookie Authentication** - Traditional session-based authentication
- **Microsoft Bearer Token Authentication** - Proprietary encrypted token authentication (ASP.NET Core specific)
- **JWT Authentication** - Industry-standard JSON Web Token authentication (RFC 7519)
- **Passkey Authentication** - WebAuthn passwordless authentication (see [Passkey Authentication](./passkey-auth))
- **External OAuth Providers** - Google, LinkedIn, GitHub, Microsoft, Facebook (see [External OAuth](./external-auth))

```json
{
  "Auth": {
    "CookieAuth": false,
    "CookieAuthScheme": "Cookies",
    "CookieValid": "14 days",
    "CookieName": null,
    "CookiePath": null,
    "CookieDomain": null,
    "CookieMultiSessions": true,
    "CookieHttpOnly": true,
    "CookieSameSite": null,
    "CookieSecure": null,
    "BearerTokenAuth": false,
    "BearerTokenAuthScheme": "BearerToken",
    "BearerTokenExpire": "1 hour",
    "BearerTokenRefreshPath": "/api/token/refresh",
    "JwtAuth": false,
    "JwtAuthScheme": "Bearer",
    "JwtSecret": null,
    "JwtIssuer": null,
    "JwtAudience": null,
    "JwtExpire": "60 minutes",
    "JwtRefreshExpire": "7 days",
    "JwtValidateIssuer": false,
    "JwtValidateAudience": false,
    "JwtValidateLifetime": true,
    "JwtValidateIssuerSigningKey": true,
    "JwtClockSkew": "5 minutes",
    "JwtRefreshPath": "/api/jwt/refresh",
    "Schemes": {
      "short_session": {
        "Type": "Cookies",
        "Enabled": false,
        "CookieValid": "1 hour",
        "CookieMultiSessions": false
      },
      "api_token": {
        "Type": "BearerToken",
        "Enabled": false,
        "BearerTokenExpire": "30 minutes",
        "BearerTokenRefreshPath": "/api/api-token/refresh"
      },
      "admin_jwt": {
        "Type": "Jwt",
        "Enabled": false,
        "JwtSecret": null,
        "JwtIssuer": null,
        "JwtAudience": null,
        "JwtExpire": "5 minutes",
        "JwtRefreshExpire": "1 hour",
        "JwtRefreshPath": "/api/admin-jwt/refresh"
      }
    },
    "External": { ... },
    "PasskeyAuth": { ... }
  }
}
```

The `External` and `PasskeyAuth` subsections are documented on their own pages: [External OAuth](./external-auth) and [Passkey Authentication](./passkey-auth).

## Cookie Authentication

Cookie authentication provides session-based authentication using HTTP cookies.

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieAuthScheme": "Cookies",
    "CookieValid": "14 days",
    "CookieName": null,
    "CookiePath": null,
    "CookieDomain": null,
    "CookieMultiSessions": true,
    "CookieHttpOnly": true,
    "CookieSameSite": null,
    "CookieSecure": null
  }
}
```

### Cookie Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `CookieAuth` | bool | `false` | Enable cookie authentication. |
| `CookieAuthScheme` | string | `"Cookies"` | Authentication scheme name. `null` also resolves to `"Cookies"` (`CookieAuthenticationDefaults.AuthenticationScheme`). |
| `CookieValid` | string | `"14 days"` | Cookie validity duration in PostgreSQL [interval format](../annotations/interval-format) (e.g., `"14 days"`, `"12 hours"`, `"30 minutes"`). Set to `null` to fall back to the framework default (14 days). |
| `CookieName` | string | `null` | Custom name for the authentication cookie. Uses default if null. |
| `CookiePath` | string | `null` | Path scope for the cookie. Uses default if null. |
| `CookieDomain` | string | `null` | Domain scope for the cookie. Uses default if null. |
| `CookieMultiSessions` | bool | `true` | Allow multiple concurrent sessions for the same user. |
| `CookieHttpOnly` | bool | `true` | Make cookie accessible only via HTTP (not JavaScript). |
| `CookieSameSite` | string | `null` | `SameSite` attribute on the cookie: `"Strict"` / `"Lax"` / `"None"` / `"Unspecified"`. `null` uses ASP.NET's default (typically `Lax`). Use `"None"` for cross-origin SPA / mobile clients. |
| `CookieSecure` | string | `null` | When the cookie's `Secure` attribute is set: `"SameAsRequest"` / `"Always"` / `"None"`. `null` uses ASP.NET's default (`SameAsRequest`). **Required `"Always"` when `CookieSameSite` is `"None"`** — browsers drop non-Secure `SameSite=None` cookies. |

### Cookie Security

When `CookieHttpOnly` is `true` (recommended), the cookie cannot be accessed by client-side JavaScript, protecting against XSS attacks.

::: tip
For production, always use HTTPS and consider setting `CookieDomain` to your specific domain.
:::

### Cross-Origin Cookies (New in 3.15.0)

`CookieSameSite` and `CookieSecure` make cookie auth work across origins — e.g. an SPA on `app.example.com` calling an API on `api.example.com`. Without them, browsers silently drop the session cookie on cross-site requests.

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": ["https://app.example.com"],
    "AllowCredentials": true
  },
  "Auth": {
    "CookieAuth": true,
    "CookieSameSite": "None",
    "CookieSecure":   "Always",
    "CookieHttpOnly": true,
    "CookieDomain":   ".example.com"
  }
}
```

**Validation:** unknown `CookieSameSite` / `CookieSecure` values fail fast at startup with the offending config path. Setting `CookieSameSite=None` without `CookieSecure=Always` logs a startup warning — the cookie would be silently dropped by modern browsers.

## Microsoft Bearer Token Authentication

Microsoft Bearer Token authentication provides stateless token-based authentication using ASP.NET Core's proprietary encrypted token format. This is suitable for single ASP.NET Core applications.

```json
{
  "Auth": {
    "BearerTokenAuth": true,
    "BearerTokenAuthScheme": "BearerToken",
    "BearerTokenExpire": "1 hour",
    "BearerTokenRefreshPath": "/api/token/refresh"
  }
}
```

### Bearer Token Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `BearerTokenAuth` | bool | `false` | Enable Microsoft bearer token authentication. |
| `BearerTokenAuthScheme` | string | `"BearerToken"` | Authentication scheme name. `null` also resolves to `"BearerToken"` (`BearerTokenDefaults.AuthenticationScheme`). |
| `BearerTokenExpire` | string | `"1 hour"` | Bearer token expiration in PostgreSQL [interval format](../annotations/interval-format) (e.g., `"1 hour"`, `"30 minutes"`, `"2 days"`). Set to `null` to fall back to the framework default (1 hour). |
| `BearerTokenRefreshPath` | string | `"/api/token/refresh"` | Endpoint path for refreshing tokens. |

### Token Refresh

To refresh a Microsoft bearer token, POST to the configured refresh path:

```http
POST /api/token/refresh
Content-Type: application/json

{
  "refresh": "{{refreshToken}}"
}
```

## JWT Authentication

::: tip New in 3.2.1
JWT authentication was added in version 3.2.1.
:::

JWT (JSON Web Token) authentication provides industry-standard token-based authentication (RFC 7519). Unlike Microsoft Bearer Token authentication, JWT tokens are interoperable and can be used with any system that supports JWT.

```json
{
  "Auth": {
    "JwtAuth": true,
    "JwtSecret": "your-secret-key-at-least-32-characters-long",
    "JwtIssuer": "your-app",
    "JwtAudience": "your-api",
    "JwtExpire": "60 minutes",
    "JwtRefreshExpire": "7 days",
    "JwtValidateIssuer": true,
    "JwtValidateAudience": true,
    "JwtValidateLifetime": true,
    "JwtValidateIssuerSigningKey": true,
    "JwtClockSkew": "5 minutes",
    "JwtRefreshPath": "/api/jwt/refresh"
  }
}
```

### JWT Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `JwtAuth` | bool | `false` | Enable JWT authentication. |
| `JwtAuthScheme` | string | `"Bearer"` | Authentication scheme name. `null` also resolves to `"Bearer"` (`JwtBearerDefaults.AuthenticationScheme`). |
| `JwtSecret` | string | `null` | Secret key for signing tokens. **Must be at least 32 characters for HS256.** |
| `JwtIssuer` | string | `null` | Token issuer (iss claim). |
| `JwtAudience` | string | `null` | Token audience (aud claim). |
| `JwtExpire` | string | `"60 minutes"` | Access token expiration in PostgreSQL [interval format](../annotations/interval-format) (e.g., `"60 minutes"`, `"1 hour"`, `"30 seconds"`). Set to `null` to fall back to the framework default (60 minutes). |
| `JwtRefreshExpire` | string | `"7 days"` | Refresh token expiration in PostgreSQL [interval format](../annotations/interval-format) (e.g., `"7 days"`, `"168 hours"`). Set to `null` to fall back to the framework default (7 days). |
| `JwtValidateIssuer` | bool | `false` | Validate the issuer claim. Set to true if `JwtIssuer` is configured. |
| `JwtValidateAudience` | bool | `false` | Validate the audience claim. Set to true if `JwtAudience` is configured. |
| `JwtValidateLifetime` | bool | `true` | Validate token expiration. |
| `JwtValidateIssuerSigningKey` | bool | `true` | Validate the signing key. |
| `JwtClockSkew` | string | `"5 minutes"` | Clock tolerance for expiration validation. Uses PostgreSQL [interval format](../annotations/interval-format). |
| `JwtRefreshPath` | string | `"/api/jwt/refresh"` | Endpoint path for refreshing JWT tokens. |

### Login Response

When JWT authentication is enabled and a login endpoint returns successfully, the response includes:

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshExpiresIn": 604800
}
```

### Token Refresh

To refresh a JWT token, POST to the configured refresh path (default: `/api/jwt/refresh`):

```http
POST /api/jwt/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

The response returns a new access token and refresh token pair.

### JWT vs Microsoft Bearer Token

| Feature | Microsoft Bearer Token | JWT |
|---------|----------------------|-----|
| Token Format | Proprietary, encrypted | Industry-standard (RFC 7519) |
| Interoperability | ASP.NET Core only | Any system supporting JWT |
| Token Inspection | Opaque | Can be decoded at [jwt.io](https://jwt.io) |
| Use Case | Single ASP.NET app | Cross-service, microservices |

::: warning Security
Store your `JwtSecret` securely. Use environment variables in production:
```json
{
  "Auth": {
    "JwtSecret": "{JWT_SECRET}"
  }
}
```
:::

## Additional Authentication Schemes

::: tip New in 3.13.0
Named additional authentication schemes registered alongside the main one.
:::

`Auth:Schemes` is a named-dict section that registers additional ASP.NET Core authentication schemes alongside the main one. Each entry is a fully-fledged scheme of any of the three supported types — `Cookies`, `BearerToken`, or `Jwt` — with its own options. A login function selects which scheme to use by returning the scheme's name in its `scheme` column.

**What this enables:**

- Short-lived sensitive sessions for admin or payment flows (Cookies scheme with shorter `CookieValid` + `CookieMultiSessions: false`).
- Per-scope JWT signing keys so a key leak has limited blast radius (separate `JwtSecret` per Jwt scheme).
- Multiple bearer-token APIs with different expirations and refresh paths.
- Single-session cookies for areas where parallel logins must be disallowed, alongside a normal long-lived session.

```jsonc
{
  "Auth": {
    "CookieAuth": true,
    "CookieValid": "14 days",
    "JwtAuth": true,
    "JwtSecret": "...root-secret-32+chars...",
    "Schemes": {
      "short_session": {
        "Type": "Cookies",
        "Enabled": true,
        "CookieValid": "1 hour",
        "CookieMultiSessions": false
      },
      "api_token": {
        "Type": "BearerToken",
        "Enabled": true,
        "BearerTokenExpire": "30 minutes",
        "BearerTokenRefreshPath": "/api/api-token/refresh"
      },
      "admin_jwt": {
        "Type": "Jwt",
        "Enabled": true,
        "JwtSecret": "...separate-admin-secret-32+chars...",
        "JwtExpire": "5 minutes",
        "JwtRefreshPath": "/api/admin-jwt/refresh"
      }
    }
  }
}
```

A login endpoint selects the scheme by returning its name in the `scheme` column.

**As a SQL file endpoint** (`sql/login.sql`):

```sql
/*
HTTP POST
@login
@allow_anonymous
@param $1 user
@param $2 pass
*/
select 'Cookies' as scheme, user_id::text as name_identifier, username as name
from users where username = $1 and password_hash = crypt($2, password_hash);
```

**As database functions:**

```sql
-- Standard login: returns 'Cookies' → 14-day persistent cookie
create function login(_user text, _pass text)
returns table (scheme text, name_identifier text, name text)
language sql security definer as $$
  select 'Cookies' as scheme, user_id::text, username from users where ...
$$;

-- Sensitive-area login: returns 'short_session' → 1-hour session-only cookie
create function admin_login(_user text, _pass text)
returns table (scheme text, name_identifier text, name text)
language sql security definer as $$
  select 'short_session' as scheme, user_id::text, username from users where ...
$$;

-- Admin JWT login: returns 'admin_jwt' → 5-minute JWT signed with the admin-only secret
create function admin_jwt_login(_user text, _pass text)
returns table (scheme text, name_identifier text, name text)
language sql security definer as $$
  select 'admin_jwt' as scheme, user_id::text, username from users where ...
$$;
```

### Per-Type Override Fields

| Type | Override fields |
| --- | --- |
| `Cookies` | `CookieValid`, `CookieName`, `CookiePath`, `CookieDomain`, `CookieMultiSessions`, `CookieHttpOnly`, `CookieSameSite`, `CookieSecure` |
| `BearerToken` | `BearerTokenExpire`, `BearerTokenRefreshPath` |
| `Jwt` | `JwtExpire`, `JwtRefreshExpire`, `JwtSecret`, `JwtIssuer`, `JwtAudience`, `JwtClockSkew`, `JwtRefreshPath`, `JwtValidateIssuer`, `JwtValidateAudience`, `JwtValidateLifetime`, `JwtValidateIssuerSigningKey` |

Common fields: `Type` (required, case-insensitive), `Enabled` (default `true`).

**Inheritance.** A scheme that overrides only one or two fields reuses everything else from the root `Auth` section, so blocks stay small. Setting `CookieMultiSessions: false` is the typical "single-session" override — the cookie's `Max-Age` becomes null (browser-session-only) while `ExpireTimeSpan` still bounds server-side validity. JWT schemes inherit `JwtSecret` from the root section if not set explicitly, so a per-scheme block can be just a shorter expiration. Refresh paths are the exception: `BearerTokenRefreshPath` / `JwtRefreshPath` are never inherited — a scheme gets a refresh endpoint only if it declares its own.

### Validation at Startup (Fail-Fast)

- Scheme name must not collide with the main scheme names (`CookieAuthScheme`, `BearerTokenAuthScheme`, `JwtAuthScheme`).
- `Type` must be one of `Cookies`, `BearerToken`, `Jwt` (case-insensitive). Missing or unsupported types throw with a clear message.
- Explicit `CookieName` values must be distinct across all cookie schemes. When unset, ASP.NET's per-scheme `.AspNetCore.<scheme>` default automatically differs and is excluded from collision tracking.
- Refresh paths (`BearerTokenRefreshPath` / `JwtRefreshPath`) must be unique across the main scheme and every scheme that defines one.
- Jwt schemes require a secret either on the scheme or on the root section; `JwtSecret` must be ≥32 chars for HS256.
- Invalid interval strings throw with the offending path and value.

**Refresh middleware per scheme.** Each `BearerToken`/`Jwt` scheme that declares a refresh path gets its own middleware listening on that path, with that scheme's tokens validated under that scheme's options.

**Logout.** The existing logout pipeline accepts a list of scheme names from the logout function's result columns and signs out each — additional schemes work without changes. To clear both main and additional cookies in one logout, return both scheme names from the function.

## Complete Examples

### Cookie Authentication

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieValid": "30 days",
    "CookieHttpOnly": true,
    "CookieMultiSessions": false
  }
}
```

### JWT Authentication

```json
{
  "Auth": {
    "JwtAuth": true,
    "JwtSecret": "{JWT_SECRET}",
    "JwtIssuer": "my-app",
    "JwtAudience": "my-api",
    "JwtExpire": "60 minutes",
    "JwtRefreshExpire": "7 days",
    "JwtValidateIssuer": true,
    "JwtValidateAudience": true
  }
}
```

### Combined Authentication

All three authentication schemes can be used together:

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieValid": "14 days",
    "CookieHttpOnly": true,

    "BearerTokenAuth": true,
    "BearerTokenExpire": "1 hour",

    "JwtAuth": true,
    "JwtSecret": "{JWT_SECRET}",
    "JwtExpire": "60 minutes"
  }
}
```

::: warning Breaking change in 3.13.0
The legacy integer-based time fields under `Auth` were removed. If you upgrade with any of the four removed fields still in your config, **startup will fail** with a clear migration message.

| Removed (3.12 and earlier) | Use instead (3.13.0+) |
| --- | --- |
| `Auth:CookieValidDays: 14` | `Auth:CookieValid: "14 days"` |
| `Auth:BearerTokenExpireHours: 1` | `Auth:BearerTokenExpire: "1 hour"` |
| `Auth:JwtExpireMinutes: 60` | `Auth:JwtExpire: "60 minutes"` |
| `Auth:JwtRefreshExpireDays: 7` | `Auth:JwtRefreshExpire: "7 days"` |

The new fields accept Postgres-interval syntax (`"14 days"`, `"12 hours"`, `"30 minutes"`, `"45 seconds"`, etc.) — finer-grained durations than the legacy integers permitted. Setting any of these to `null` falls back to the framework default.
:::

## Related

- [Authentication Guide](../guide/authentication) — the full walkthrough
- [External OAuth](./external-auth) - Configure Google, LinkedIn, GitHub, Microsoft, Facebook OAuth
- [Passkey Authentication](./passkey-auth) - Configure WebAuthn passwordless authentication
- [authorize annotation](../annotations/authorize) - Require authentication on endpoints
- [allow_anonymous annotation](../annotations/allow-anonymous) - Allow unauthenticated access
- [login annotation](../annotations/login) - Mark endpoint as sign-in
- [logout annotation](../annotations/logout) - Mark endpoint as sign-out
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Passkey Authentication](./passkey-auth) - Configure WebAuthn passwordless authentication
- [External OAuth](./external-auth) - Configure external OAuth providers
- [Authentication Options](./authentication-options) - Configure login/logout and password handling
- [Connection Settings](./connection) - Configure database connections
- [Server & SSL](./server) - Configure HTTPS and Kestrel web server

## See Also

- [AUTHORIZE](/annotations/authorize) - Require authentication on endpoints
- [LOGIN](/annotations/login) - Mark endpoint as sign-in
- [LOGOUT](/annotations/logout) - Mark endpoint as sign-out

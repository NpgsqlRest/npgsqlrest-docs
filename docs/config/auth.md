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
    "BearerTokenAuth": false,
    "JwtAuth": false,
    "External": {
      "Enabled": false
    }
  }
}
```

## Cookie Authentication

Cookie authentication provides session-based authentication using HTTP cookies.

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieAuthScheme": null,
    "CookieValidDays": 14,
    "CookieName": null,
    "CookiePath": null,
    "CookieDomain": null,
    "CookieMultiSessions": true,
    "CookieHttpOnly": true
  }
}
```

### Cookie Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `CookieAuth` | bool | `false` | Enable cookie authentication. |
| `CookieAuthScheme` | string | `null` | Authentication scheme name. Uses `"Cookies"` if null (from `CookieAuthenticationDefaults.AuthenticationScheme`). |
| `CookieValidDays` | int | `14` | Number of days the cookie remains valid. |
| `CookieName` | string | `null` | Custom name for the authentication cookie. Uses default if null. |
| `CookiePath` | string | `null` | Path scope for the cookie. Uses default if null. |
| `CookieDomain` | string | `null` | Domain scope for the cookie. Uses default if null. |
| `CookieMultiSessions` | bool | `true` | Allow multiple concurrent sessions for the same user. |
| `CookieHttpOnly` | bool | `true` | Make cookie accessible only via HTTP (not JavaScript). |

### Cookie Security

When `CookieHttpOnly` is `true` (recommended), the cookie cannot be accessed by client-side JavaScript, protecting against XSS attacks.

::: tip
For production, always use HTTPS and consider setting `CookieDomain` to your specific domain.
:::

## Microsoft Bearer Token Authentication

Microsoft Bearer Token authentication provides stateless token-based authentication using ASP.NET Core's proprietary encrypted token format. This is suitable for single ASP.NET Core applications.

```json
{
  "Auth": {
    "BearerTokenAuth": true,
    "BearerTokenAuthScheme": null,
    "BearerTokenExpireHours": 1,
    "BearerTokenRefreshPath": "/api/token/refresh"
  }
}
```

### Bearer Token Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `BearerTokenAuth` | bool | `false` | Enable Microsoft bearer token authentication. |
| `BearerTokenAuthScheme` | string | `null` | Authentication scheme name. Uses `"BearerToken"` if null (from `BearerTokenDefaults.AuthenticationScheme`). |
| `BearerTokenExpireHours` | int | `1` | Number of hours before the token expires. |
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
    "JwtExpireMinutes": 60,
    "JwtRefreshExpireDays": 7,
    "JwtValidateIssuer": true,
    "JwtValidateAudience": true,
    "JwtValidateLifetime": true,
    "JwtValidateIssuerSigningKey": true,
    "JwtClockSkew": "5m",
    "JwtRefreshPath": "/api/jwt/refresh"
  }
}
```

### JWT Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `JwtAuth` | bool | `false` | Enable JWT authentication. |
| `JwtAuthScheme` | string | `null` | Authentication scheme name. Uses `"Bearer"` if null (from `JwtBearerDefaults.AuthenticationScheme`). |
| `JwtSecret` | string | `null` | Secret key for signing tokens. **Must be at least 32 characters for HS256.** |
| `JwtIssuer` | string | `null` | Token issuer (iss claim). |
| `JwtAudience` | string | `null` | Token audience (aud claim). |
| `JwtExpireMinutes` | int | `60` | Access token expiration in minutes. |
| `JwtRefreshExpireDays` | int | `7` | Refresh token expiration in days. |
| `JwtValidateIssuer` | bool | `false` | Validate the issuer claim. Set to true if `JwtIssuer` is configured. |
| `JwtValidateAudience` | bool | `false` | Validate the audience claim. Set to true if `JwtAudience` is configured. |
| `JwtValidateLifetime` | bool | `true` | Validate token expiration. |
| `JwtValidateIssuerSigningKey` | bool | `true` | Validate the signing key. |
| `JwtClockSkew` | string | `"5m"` | Clock tolerance for expiration validation. Uses [interval format](../annotations/interval-format). |
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

## Complete Examples

### Cookie Authentication

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieValidDays": 30,
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
    "JwtExpireMinutes": 60,
    "JwtRefreshExpireDays": 7,
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
    "CookieValidDays": 14,
    "CookieHttpOnly": true,

    "BearerTokenAuth": true,
    "BearerTokenExpireHours": 1,

    "JwtAuth": true,
    "JwtSecret": "{JWT_SECRET}",
    "JwtExpireMinutes": 60
  }
}
```

## Related

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

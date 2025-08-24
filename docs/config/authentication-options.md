---
outline: [2, 3]
title: "Authentication Options"
titleTemplate: NpgsqlRest
description: "Configure login/logout handling in NpgsqlRest. Password hashing, session management, claim types, and authentication response formatting."
head:
  - - meta
    - name: keywords
      content: npgsqlrest authentication options, login logout api, password hashing postgresql, session management api, claim types configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Authentication Options"
  - - meta
    - property: og:description
      content: "Configure login/logout, password hashing, and authentication response handling."
  - - meta
    - property: og:type
      content: article
---

# Authentication Options

Basic authentication configuration for NpgsqlRest endpoints including login/logout handling and password settings.

## Overview

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "DefaultAuthenticationType": null,
      "StatusColumnName": "status",
      "SchemeColumnName": "scheme",
      "BodyColumnName": "body",
      "ResponseTypeColumnName": "application/json",
      "HashColumnName": "hash",
      "PasswordParameterNameContains": "pass",
      "DefaultUserIdClaimType": "user_id",
      "DefaultNameClaimType": "user_name",
      "DefaultRoleClaimType": "user_roles",
      "SerializeAuthEndpointsResponse": false,
      "ObfuscateAuthParameterLogValues": true,
      "PasswordVerificationFailedCommand": null,
      "PasswordVerificationSucceededCommand": null,
      "UseUserContext": false,
      "ContextKeyClaimsMapping": {
        "request.user_id": "user_id",
        "request.user_name": "user_name",
        "request.user_roles": "user_roles"
      },
      "ClaimsJsonContextKey": null,
      "IpAddressContextKey": "request.ip_address",
      "UseUserParameters": false,
      "ParameterNameClaimsMapping": {
        "_user_id": "user_id",
        "_user_name": "user_name",
        "_user_roles": "user_roles"
      },
      "ClaimsJsonParameterName": "_user_claims",
      "IpAddressParameterName": "_ip_address",
      "LoginPath": null,
      "LogoutPath": null,
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

## General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DefaultAuthenticationType` | string | `null` | Authentication type for `ClaimsIdentity`. Auto-detected from database name if `null` and login endpoint exists. |
| `SerializeAuthEndpointsResponse` | bool | `false` | When `true`, login endpoint returns all columns from the login routine as JSON in the response body (ignored for bearer token auth or when `BodyColumnName` is present). |
| `ObfuscateAuthParameterLogValues` | bool | `true` | Obfuscate parameter values in logs for auth endpoints to protect credentials. |

## Login Response Columns

Column names used to read values from the login routine response.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `StatusColumnName` | string | `"status"` | Column for success/failure. Boolean or numeric HTTP status code (200 = success). |
| `SchemeColumnName` | string | `"scheme"` | Column for authentication scheme override. |
| `BodyColumnName` | string | `"body"` | Column for response body message. |
| `ResponseTypeColumnName` | string | `"application/json"` | Column for response content type. |
| `HashColumnName` | string | `"hash"` | Column for password hash verification. See [Password Verification](../annotations/login#password-verification). |

## Password Handling

These settings are part of the **built-in password verification system**. For detailed information on how password verification works, including examples and the built-in password hasher, see [Password Verification](../annotations/login#password-verification) in the login annotation documentation.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `PasswordParameterNameContains` | string | `"pass"` | Identifies password parameter (first param containing this string). See [Password Parameter Detection](../annotations/login#password-parameter-detection). |
| `PasswordVerificationFailedCommand` | string | `null` | Command executed on password verification failure. |
| `PasswordVerificationSucceededCommand` | string | `null` | Command executed on password verification success. |

### Password Verification Command Parameters

Both `PasswordVerificationFailedCommand` and `PasswordVerificationSucceededCommand` receive:

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | text | Authentication scheme used for login. |
| `$2` | text | User ID. |
| `$3` | text | Username. |

## Default Claim Types

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DefaultUserIdClaimType` | string | `"user_id"` | Claim type for user ID. |
| `DefaultNameClaimType` | string | `"user_name"` | Claim type for username. |
| `DefaultRoleClaimType` | string | `"user_roles"` | Claim type for user roles. |

## User Context Settings

Settings for automatically passing authenticated user claims to PostgreSQL via context variables.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `UseUserContext` | bool | `false` | Enable setting authenticated user claims to context variables automatically. For proxy endpoints, when enabled, these values are also forwarded as HTTP headers to the upstream proxy. |
| `ContextKeyClaimsMapping` | object | See below | Mapping of context keys to user claim names. Keys are context variable names, values are user claim names. |
| `ClaimsJsonContextKey` | string | `null` | Context key for all available user claims as JSON. When not null and user is authenticated, all claims are serialized to JSON and set to this context variable. |
| `IpAddressContextKey` | string | `"request.ip_address"` | Context key for IP address. When not null, IP address is set to this context variable when `UseUserContext` is enabled (even for unauthenticated users). |

### Default ContextKeyClaimsMapping

```json
{
  "request.user_id": "user_id",
  "request.user_name": "user_name",
  "request.user_roles": "user_roles"
}
```

## User Parameters Settings

Settings for automatically mapping authenticated user claims to function parameters.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `UseUserParameters` | bool | `false` | Enable mapping authenticated user claims to parameters by name automatically. For proxy endpoints, when enabled, these values are also forwarded as query string parameters. |
| `ParameterNameClaimsMapping` | object | See below | Mapping of parameter names to user claim names. Keys are parameter names, values are user claim names. |
| `ClaimsJsonParameterName` | string | `"_user_claims"` | Parameter name for all available user claims. When not null and user is authenticated, all claims are serialized to JSON and set to this parameter. |
| `IpAddressParameterName` | string | `"_ip_address"` | Parameter name for IP address. When not null, IP address is set to this parameter when `UseUserParameters` is enabled (even for unauthenticated users). |

**Note:** Claim values are always passed as `text` type. For multi-value claims (like roles), values are passed as `text[]`. PostgreSQL handles type coercion to your parameter types.

### Default ParameterNameClaimsMapping

```json
{
  "_user_id": "user_id",
  "_user_name": "user_name",
  "_user_roles": "user_roles"
}
```

## Login and Logout Paths

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `LoginPath` | string | `null` | URL path for login endpoint. `null` disables login endpoint. |
| `LogoutPath` | string | `null` | URL path for logout endpoint. `null` disables logout endpoint. |

### Login Command Convention

The login command must follow these conventions:

- Return at least one record for successful authentication
- No records returned = 401 Unauthorized
- All columns become user claims (column name = claim type, value = claim value)

Special columns:

| Column | Type | Description |
|--------|------|-------------|
| `status` | bool/int | Success indicator. Boolean or HTTP status code (200 = success). |
| `scheme` | text | Authentication scheme override. |
| `body` | text | Response body message. |
| `hash` | text | Password hash for verification. |

### Logout Command Convention

- No return data = sign out default scheme
- Returned values = scheme names to sign out (converted to string)

## Basic Authentication

HTTP Basic Authentication settings. Expects `Authorization: Basic base64(username:password)` header.

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

For detailed configuration options, examples, and challenge command parameters, see [Basic Auth Configuration](./basic-auth-config).

## Complete Example

Production configuration with login endpoint and user context:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
      "DefaultAuthenticationType": "MyApp",
      "StatusColumnName": "status",
      "SchemeColumnName": "scheme",
      "HashColumnName": "hash",
      "PasswordParameterNameContains": "password",
      "DefaultUserIdClaimType": "user_id",
      "DefaultNameClaimType": "user_name",
      "DefaultRoleClaimType": "user_roles",
      "ObfuscateAuthParameterLogValues": true,
      "UseUserContext": true,
      "ContextKeyClaimsMapping": {
        "request.user_id": "user_id",
        "request.user_name": "user_name",
        "request.user_roles": "user_roles"
      },
      "IpAddressContextKey": "request.ip_address",
      "UseUserParameters": true,
      "ParameterNameClaimsMapping": {
        "_user_id": "user_id",
        "_user_name": "user_name",
        "_user_roles": "user_roles"
      },
      "ClaimsJsonParameterName": "_user_claims",
      "IpAddressParameterName": "_ip_address",
      "LoginPath": "/api/auth/login",
      "LogoutPath": "/api/auth/logout"
    }
  }
}
```

## Related

- [Claims Mapping](./claims-mapping) - Configure user context and parameters mapping
- [Basic Auth Configuration](./basic-auth-config) - Configure HTTP Basic Authentication
- [login annotation](../annotations/login) - Mark endpoint as sign-in
- [logout annotation](../annotations/logout) - Mark endpoint as sign-out
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Claims Mapping](./claims-mapping) - Configure claims to context and parameters
- [Basic Auth Configuration](./basic-auth-config) - Configure Basic Authentication
- [Authentication](./auth) - Configure authentication methods (Cookie, Bearer Token, OAuth)
- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings

## See Also

- [AUTHORIZE](/annotations/authorize) - Require authentication on endpoints
- [LOGIN](/annotations/login) - Mark endpoint as sign-in
- [BASIC_AUTH](/annotations/basic-auth) - Enable Basic Auth per endpoint

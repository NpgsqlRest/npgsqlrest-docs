---
outline: [2, 3]
title: "Claims Mapping Configuration"
titleTemplate: NpgsqlRest
description: "Map authenticated user claims to PostgreSQL context variables and function parameters. Pass user ID, roles, and custom claims to SQL functions automatically."
head:
  - - meta
    - name: keywords
      content: npgsqlrest claims mapping, postgresql user context, jwt claims postgresql, user id parameter, role based access postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest Claims Mapping Configuration"
  - - meta
    - property: og:description
      content: "Map user claims to PostgreSQL context variables and function parameters automatically."
  - - meta
    - property: og:type
      content: article
---

# Claims Mapping

Configure how authenticated user claims are mapped to PostgreSQL context variables and function parameters.

## Overview

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
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
      "IpAddressParameterName": "_ip_address"
    }
  }
}
```

## User Context (PostgreSQL Context Variables)

Map authenticated user claims to PostgreSQL session context variables. Enable for specific endpoints using the [user_context](../annotations/user-context) annotation, or enable globally with `UseUserContext`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `UseUserContext` | bool | `false` | Enable automatic claim-to-context mapping for all endpoints. Override per-endpoint with [user_context](../annotations/user-context) annotation. |
| `ContextKeyClaimsMapping` | object | *(see below)* | Map of PostgreSQL context keys to claim names. Key is the context variable name, value is the claim type. |
| `ClaimsJsonContextKey` | string | `null` | Context key for all claims serialized as JSON. Set to `"request.user_claims"` to enable. |
| `IpAddressContextKey` | string | `"request.ip_address"` | Context key for client IP address. |

### Default Context Mapping

```json
{
  "ContextKeyClaimsMapping": {
    "request.user_id": "user_id",
    "request.user_name": "user_name",
    "request.user_roles": "user_roles"
  }
}
```

### Custom Context Mapping Example

Map additional claims to custom context keys:

```json
{
  "ContextKeyClaimsMapping": {
    "request.user_id": "user_id",
    "request.user_name": "user_name",
    "request.user_roles": "user_roles",
    "request.user_email": "email",
    "request.tenant_id": "tenant_id"
  },
  "ClaimsJsonContextKey": "request.user_claims"
}
```

### Access in PostgreSQL

```sql
-- Access individual claims
select current_setting('request.user_id', true);
select current_setting('request.user_name', true);
select current_setting('request.user_roles', true);

-- Access client IP address
select current_setting('request.ip_address', true);

-- Access all claims as JSON (when ClaimsJsonContextKey is configured)
select current_setting('request.user_claims', true)::jsonb;
```

::: tip
Always use `true` as the second parameter to `current_setting()` to avoid errors when the setting doesn't exist.
:::

## User Parameters

Map authenticated user claims to function parameters. Enable for specific endpoints using the [user_parameters](../annotations/user-parameters) annotation, or enable globally with `UseUserParameters`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `UseUserParameters` | bool | `false` | Enable automatic claim-to-parameter mapping for all endpoints. Override per-endpoint with [user_parameters](../annotations/user-parameters) annotation. |
| `ParameterNameClaimsMapping` | object | *(see below)* | Map of function parameter names to claim names. Key is the parameter name, value is the claim type. |
| `ClaimsJsonParameterName` | string | `"_user_claims"` | Parameter name that receives all claims serialized as JSON. |
| `IpAddressParameterName` | string | `"_ip_address"` | Parameter name that receives the client IP address. |

### Default Parameter Mapping

```json
{
  "ParameterNameClaimsMapping": {
    "_user_id": "user_id",
    "_user_name": "user_name",
    "_user_roles": "user_roles"
  }
}
```

### Custom Parameter Mapping Example

Map additional claims to custom parameter names:

```json
{
  "ParameterNameClaimsMapping": {
    "_user_id": "user_id",
    "_user_name": "user_name",
    "_user_roles": "user_roles",
    "_email": "email",
    "_tenant": "tenant_id"
  },
  "ClaimsJsonParameterName": "_user_claims",
  "IpAddressParameterName": "_ip_address"
}
```

### Example Function Using Parameters

```sql
create function get_user_data(
    _user_id text,
    _user_name text,
    _user_roles text[],
    _ip_address text,
    _user_claims json
)
returns table (
    user_id int,
    user_name text,
    roles text[],
    ip text,
    all_claims json
)
language sql
begin atomic;
select
    _user_id::int,
    _user_name,
    _user_roles,
    _ip_address,
    _user_claims;
end;

comment on function get_user_data(text, text, text[], text, json) is '
@authorize
@user_params
';
```

**Equivalent as a SQL file endpoint** (`sql/get-user-data.sql`):

```sql
/*
HTTP GET
@authorize
@user_params
@param $1 user_id text
@param $2 user_name text
@param $3 user_roles text[]
@param $4 ip_address text
@param $5 user_claims json
*/
select
    $1::int as user_id,
    $2 as user_name,
    $3 as roles,
    $4 as ip,
    $5 as all_claims;
```

::: tip
Parameters with default values can be used without authentication. When the user is authenticated, claim values override the defaults.
:::

## Complete Example

Configuration with user context and parameters enabled:

```json
{
  "NpgsqlRest": {
    "AuthenticationOptions": {
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
      "IpAddressParameterName": "_ip_address"
    }
  }
}
```

## Related

- [Authentication Options](./authentication-options) - Basic authentication configuration
- [Basic Auth Configuration](./basic-auth-config) - Configure HTTP Basic Authentication
- [user_context annotation](../annotations/user-context) - Enable user context mapping per endpoint
- [user_parameters annotation](../annotations/user-parameters) - Enable user parameters mapping per endpoint
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication Options](./authentication-options) - Configure login/logout and password handling
- [Basic Auth Configuration](./basic-auth-config) - Configure Basic Authentication
- [Authentication](./auth) - Configure authentication methods (Cookie, Bearer Token, OAuth)

## See Also

- [USER_CONTEXT](/annotations/user-context) - Map claims to context variables
- [USER_PARAMETERS](/annotations/user-parameters) - Map claims to function parameters

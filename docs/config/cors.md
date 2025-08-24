---
outline: [2, 3]
title: "CORS Configuration"
titleTemplate: NpgsqlRest
description: "Configure Cross-Origin Resource Sharing (CORS) for NpgsqlRest. Control allowed origins, methods, headers, and credentials for cross-domain API access."
head:
  - - meta
    - name: keywords
      content: npgsqlrest cors, postgresql api cors, cross-origin resource sharing, rest api cors config, allowed origins api
  - - meta
    - property: og:title
      content: "NpgsqlRest CORS Configuration"
  - - meta
    - property: og:description
      content: "Configure CORS for cross-domain API access. Control allowed origins, methods, headers, and credentials."
  - - meta
    - property: og:type
      content: article
---

# CORS

Cross-Origin Resource Sharing (CORS) configuration for controlling access from different origins.

## Overview

```json
{
  "Cors": {
    "Enabled": false,
    "AllowedOrigins": [],
    "AllowedMethods": ["*"],
    "AllowedHeaders": ["*"],
    "AllowCredentials": true,
    "PreflightMaxAgeSeconds": 600
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable Cross-Origin Resource Sharing (CORS) support. |
| `AllowedOrigins` | array | `[]` | List of allowed origins for CORS requests. Empty array allows no origins. |
| `AllowedMethods` | array | `["*"]` | List of allowed HTTP methods for CORS requests. |
| `AllowedHeaders` | array | `["*"]` | List of allowed headers for CORS requests. |
| `AllowCredentials` | bool | `true` | Allow credentials (cookies, authorization headers) in CORS requests. |
| `PreflightMaxAgeSeconds` | int | `600` | Maximum age in seconds for preflight request caching (10 minutes). |

## Allowed Origins

Specify which origins can make cross-origin requests:

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": [
      "https://example.com",
      "https://app.example.com"
    ]
  }
}
```

::: warning
An empty `AllowedOrigins` array allows no origins. You must specify at least one origin when CORS is enabled.
:::

### Allow All Origins

To allow requests from any origin (not recommended for production with credentials):

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": ["*"],
    "AllowCredentials": false
  }
}
```

::: danger
Using `"*"` for origins with `AllowCredentials: true` is not allowed by browsers and will cause CORS errors.
:::

## Allowed Methods

Specify which HTTP methods are permitted:

```json
{
  "Cors": {
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"]
  }
}
```

Use `["*"]` to allow all methods.

## Allowed Headers

Specify which request headers are permitted:

```json
{
  "Cors": {
    "AllowedHeaders": ["Content-Type", "Authorization", "X-Requested-With"]
  }
}
```

Use `["*"]` to allow all headers.

## Credentials

When `AllowCredentials` is `true`, the browser includes cookies and authorization headers in cross-origin requests. This requires specific origins (not `"*"`).

## Preflight Caching

The `PreflightMaxAgeSeconds` setting controls how long browsers cache preflight (OPTIONS) request responses. Higher values reduce preflight requests but delay CORS policy changes from taking effect.

## Example Configuration

Production configuration with specific origins:

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": [
      "https://myapp.com",
      "https://admin.myapp.com"
    ],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "AllowCredentials": true,
    "PreflightMaxAgeSeconds": 3600
  }
}
```

Development configuration allowing all origins:

```json
{
  "Cors": {
    "Enabled": true,
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["*"],
    "AllowedHeaders": ["*"],
    "AllowCredentials": false,
    "PreflightMaxAgeSeconds": 600
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [Authentication](./auth) - Configure authentication methods

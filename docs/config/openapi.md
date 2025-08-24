---
outline: [2, 3]
title: "OpenAPI Configuration"
titleTemplate: NpgsqlRest
description: "Generate OpenAPI/Swagger specifications for your PostgreSQL REST API. Configure document title, version, servers, and security schemes for API documentation."
head:
  - - meta
    - name: keywords
      content: npgsqlrest openapi, postgresql swagger, api documentation, openapi specification, rest api docs, swagger postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest OpenAPI Configuration"
  - - meta
    - property: og:description
      content: "Generate OpenAPI/Swagger specifications for your PostgreSQL REST API with customizable documentation."
  - - meta
    - property: og:type
      content: article
---

# OpenAPI Options

Configuration for generating OpenAPI specification files and endpoints for NpgsqlRest APIs.

## Overview

```json
{
  "NpgsqlRest": {
    "OpenApiOptions": {
      "Enabled": false,
      "FileName": "npgsqlrest_openapi.json",
      "UrlPath": "/openapi.json",
      "FileOverwrite": true,
      "DocumentTitle": null,
      "DocumentVersion": "1.0.0",
      "DocumentDescription": null,
      "AddCurrentServer": true,
      "Servers": [],
      "SecuritySchemes": []
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable OpenAPI generation. |
| `FileName` | string | `"npgsqlrest_openapi.json"` | File name for generated OpenAPI file. `null` to skip file generation. |
| `UrlPath` | string | `"/openapi.json"` | URL path for OpenAPI endpoint. `null` to skip endpoint generation. |
| `FileOverwrite` | bool | `true` | Overwrite existing files. |
| `DocumentTitle` | string | `null` | API title in the `info` section. Uses database name if `null`. |
| `DocumentVersion` | string | `"1.0.0"` | API version in the `info` section. |
| `DocumentDescription` | string | `null` | API description in the `info` section. |
| `AddCurrentServer` | bool | `true` | Include current server in the `servers` section. |
| `Servers` | array | `[]` | Additional server entries for the `servers` section. |
| `SecuritySchemes` | array | `[]` | Security schemes for authentication documentation. |

## Document Info

Configure the OpenAPI document metadata:

```json
{
  "NpgsqlRest": {
    "OpenApiOptions": {
      "Enabled": true,
      "DocumentTitle": "My API",
      "DocumentVersion": "2.0.0",
      "DocumentDescription": "REST API for my application"
    }
  }
}
```

## Servers

Add server entries to the OpenAPI specification:

```json
{
  "NpgsqlRest": {
    "OpenApiOptions": {
      "AddCurrentServer": true,
      "Servers": [
        {
          "Url": "https://api.example.com",
          "Description": "Production server"
        },
        {
          "Url": "https://staging-api.example.com",
          "Description": "Staging server"
        }
      ]
    }
  }
}
```

## Security Schemes

Define authentication schemes for the OpenAPI document. Supported types:

- `Http` - For Bearer and Basic authentication
- `ApiKey` - For Cookie, Header, or Query parameter authentication

### Bearer Token Authentication

```json
{
  "SecuritySchemes": [
    {
      "Name": "bearerAuth",
      "Type": "Http",
      "Scheme": "Bearer",
      "BearerFormat": "JWT",
      "Description": "JWT Bearer token authentication"
    }
  ]
}
```

### Basic Authentication

```json
{
  "SecuritySchemes": [
    {
      "Name": "basicAuth",
      "Type": "Http",
      "Scheme": "Basic",
      "Description": "HTTP Basic authentication"
    }
  ]
}
```

### Cookie Authentication

```json
{
  "SecuritySchemes": [
    {
      "Name": "cookieAuth",
      "Type": "ApiKey",
      "In": ".AspNetCore.Cookies",
      "ApiKeyLocation": "Cookie",
      "Description": "Cookie-based authentication"
    }
  ]
}
```

### API Key in Header

```json
{
  "SecuritySchemes": [
    {
      "Name": "apiKeyAuth",
      "Type": "ApiKey",
      "In": "X-API-Key",
      "ApiKeyLocation": "Header",
      "Description": "API key in header"
    }
  ]
}
```

### Security Scheme Settings

| Setting | Type | Description |
|---------|------|-------------|
| `Name` | string | Unique scheme identifier. |
| `Type` | string | Scheme type: `"Http"` or `"ApiKey"`. |
| `Scheme` | string | HTTP auth scheme (`"Bearer"`, `"Basic"`). For `Type: "Http"` only. |
| `BearerFormat` | string | Bearer token format (e.g., `"JWT"`). Optional. |
| `In` | string | Cookie/header/query name. For `Type: "ApiKey"` only. |
| `ApiKeyLocation` | string | Location: `"Cookie"`, `"Header"`, or `"Query"`. For `Type: "ApiKey"` only. |
| `Description` | string | Description of the security scheme. |

## Complete Example

Production configuration with multiple security schemes:

```json
{
  "NpgsqlRest": {
    "OpenApiOptions": {
      "Enabled": true,
      "FileName": "openapi.json",
      "UrlPath": "/openapi.json",
      "FileOverwrite": true,
      "DocumentTitle": "My REST API",
      "DocumentVersion": "1.0.0",
      "DocumentDescription": "REST API generated from PostgreSQL functions",
      "AddCurrentServer": true,
      "Servers": [
        {
          "Url": "https://api.example.com",
          "Description": "Production server"
        }
      ],
      "SecuritySchemes": [
        {
          "Name": "bearerAuth",
          "Type": "Http",
          "Scheme": "Bearer",
          "BearerFormat": "JWT",
          "Description": "JWT Bearer token authentication"
        },
        {
          "Name": "cookieAuth",
          "Type": "ApiKey",
          "In": ".AspNetCore.Cookies",
          "ApiKeyLocation": "Cookie",
          "Description": "Cookie-based authentication"
        }
      ]
    }
  }
}
```

## Related

- [tags annotation](../annotations/tags) - Tag endpoints for OpenAPI grouping
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [HTTP Files](./http-files) - Configure HTTP file generation
- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings

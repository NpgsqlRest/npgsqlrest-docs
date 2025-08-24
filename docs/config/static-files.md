---
outline: [2, 3]
title: "Static Files Configuration"
titleTemplate: NpgsqlRest
description: "Serve static files from NpgsqlRest. Configure file paths, authorization, content parsing, and caching for HTML, CSS, JavaScript, and other assets."
head:
  - - meta
    - name: keywords
      content: npgsqlrest static files, serve static files postgresql, static file authorization, wwwroot configuration, api static assets
  - - meta
    - property: og:title
      content: "NpgsqlRest Static Files Configuration"
  - - meta
    - property: og:description
      content: "Serve static files with authorization and content parsing support from NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# Static Files

Static file serving configuration with authorization and content parsing support.

## Overview

```json
{
  "StaticFiles": {
    "Enabled": false,
    "RootPath": "wwwroot",
    "AuthorizePaths": [],
    "UnauthorizedRedirectPath": "/",
    "UnauthorizedReturnToQueryParameter": "return_to",
    "ParseContentOptions": {
      "Enabled": false,
      "AvailableClaims": [],
      "CacheParsedFile": true,
      "Headers": [
        "Cache-Control: no-store, no-cache, must-revalidate",
        "Pragma: no-cache",
        "Expires: 0"
      ],
      "FilePaths": ["*.html"],
      "AntiforgeryFieldName": "antiForgeryFieldName",
      "AntiforgeryToken": "antiForgeryToken"
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable static file serving. |
| `RootPath` | string | `"wwwroot"` | Root directory for static files. |
| `AuthorizePaths` | array | `[]` | File patterns requiring authorization. |
| `UnauthorizedRedirectPath` | string | `"/"` | Redirect path for unauthorized requests. |
| `UnauthorizedReturnToQueryParameter` | string | `"return_to"` | Query parameter name for return URL after authentication. |
| `ParseContentOptions` | object | *(see below)* | Content parsing configuration. |

## Authorization

Protect specific static files by requiring authentication:

```json
{
  "StaticFiles": {
    "Enabled": true,
    "AuthorizePaths": [
      "/admin/*",
      "/dashboard/*.html",
      "/reports/*"
    ],
    "UnauthorizedRedirectPath": "/login",
    "UnauthorizedReturnToQueryParameter": "return_to"
  }
}
```

### Path Patterns

File paths are relative to `RootPath` and pattern matching is case-insensitive:

| Pattern | Description |
|---------|-------------|
| `*.html` | All HTML files in any directory |
| `/admin/*` | All files in the admin directory |
| `/user/profile.html` | Specific file |
| `*.js` | All JavaScript files |

## Content Parsing

Parse static files and replace tags with claim values from authenticated users.

```json
{
  "StaticFiles": {
    "ParseContentOptions": {
      "Enabled": false,
      "AvailableClaims": [],
      "CacheParsedFile": true,
      "Headers": [
        "Cache-Control: no-store, no-cache, must-revalidate",
        "Pragma: no-cache",
        "Expires: 0"
      ],
      "FilePaths": ["*.html"],
      "AntiforgeryFieldName": "antiForgeryFieldName",
      "AntiforgeryToken": "antiForgeryToken"
    }
  }
}
```

### Parse Content Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable content parsing for static files. |
| `AvailableClaims` | array | `[]` | Claim types to parse. Replaced with `NULL` if not found or user is unauthenticated. |
| `CacheParsedFile` | bool | `true` | Cache parsed file templates in memory. Caching applies to templates before parsing, not final content. |
| `Headers` | array | *(see below)* | Response headers for parsed static files. Set to `null` or empty array to ignore. |
| `FilePaths` | array | `["*.html"]` | File patterns to parse. |
| `AntiforgeryFieldName` | string | `"antiForgeryFieldName"` | Variable name for the antiforgery form field name in templates. |
| `AntiforgeryToken` | string | `"antiForgeryToken"` | Variable name for the antiforgery token value in templates. |

### Tag Replacement

When `Enabled` is `true`, tags in the format `{claimType}` are replaced with values from the user's claims:

```html
<p>Welcome, {name}!</p>
<p>Your email: {email}</p>
<input type="hidden" name="{antiForgeryFieldName}" value="{antiForgeryToken}" />
```

For unauthenticated users or missing claims, values are replaced with `NULL`.

### Default Headers

The default headers disable caching for parsed content:

```
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
```

## Example Configuration

Serve static files with protected admin area and content parsing:

```json
{
  "StaticFiles": {
    "Enabled": true,
    "RootPath": "wwwroot",
    "AuthorizePaths": [
      "/admin/*",
      "/dashboard/*"
    ],
    "UnauthorizedRedirectPath": "/login.html",
    "UnauthorizedReturnToQueryParameter": "return_to",
    "ParseContentOptions": {
      "Enabled": true,
      "AvailableClaims": ["name", "email", "role"],
      "CacheParsedFile": true,
      "FilePaths": ["*.html", "*.htm"],
      "AntiforgeryFieldName": "antiForgeryFieldName",
      "AntiforgeryToken": "antiForgeryToken"
    }
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication](./auth) - Configure authentication methods
- [Antiforgery](./antiforgery) - Configure CSRF protection

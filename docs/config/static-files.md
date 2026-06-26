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
      "AvailableEnvVars": [],
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
      "AvailableEnvVars": [],
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
| `AvailableClaims` | array \| object | `[]` | Claim types to parse. Array form (`["name"]`) replaces missing claims with `NULL`; object form (`{"name":"guest"}`) uses the given default when the claim is absent. |
| `AvailableEnvVars` | array \| object | `[]` | Environment variable names templated into static content (same `{NAME}` tags as claims). Array form (`["BUILD_LABEL"]`) yields the empty string when unset; object form (`{"DEMO_FLAG":"false"}`) uses the given default. Resolved once at startup. **Public — never list a secret.** |
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

You can also give a claim an explicit default with the object form:

```json
"AvailableClaims": { "name": "guest", "email": "" }
```

### Environment Variable Injection

`AvailableEnvVars` templates **app-wide, request-independent** environment
variable values into static content using the same `{NAME}` tag syntax.
This is useful for Single-Page Apps deployed to Kubernetes: build the
bundle once, and inject per-environment values (build label, feature
flags, analytics IDs) from pod env vars at boot — no per-environment
rebuild.

```json
{
  "StaticFiles": {
    "ParseContentOptions": {
      "Enabled": true,
      "FilePaths": ["/index.html"],
      "AvailableClaims": ["user_id", "user_name"],
      "AvailableEnvVars": {
        "BUILD_LABEL": "local",
        "DEMO_FLAG": "false",
        "TRACKING_ID": ""
      }
    }
  }
}
```

Values are substituted as complete, JSON-escaped literals, so the
template uses the **bare** `{NAME}` token with no surrounding quotes:

```html
<script>
  window.__appConfig = {
    userId: {user_id},          // claim → 123 or null
    userName: {user_name},      // claim → "alice" or null
    buildLabel: {BUILD_LABEL},  // env   → "demo" (or "local" default)
    demoMode: {DEMO_FLAG} === "true",
    trackingId: {TRACKING_ID}
  };
</script>
```

Guarantees:

- **Two forms.** An array of names (`["BUILD_LABEL"]`) — a missing
  variable becomes the empty string `""`. Or an object of name→default
  pairs (`{"DEMO_FLAG":"false"}`) — the default is used when the variable
  is absent.
- **Resolved once at startup.** A value change requires a restart (a
  Kubernetes pod restart re-reads the values).
- **JSON-escaped.** An accidental quote or backslash in a value cannot
  break the JS string. (The relaxed encoder does not escape `<`/`>`, the
  same as the claim path — env values are operator-controlled, not
  untrusted input.)
- **Claims win on collision.** If a name is both a user claim and an env
  var, the per-request claim value takes precedence.
- **Strict forms** (3.21.0+). Templates can also use `{!NAME}` (same as
  `{NAME}` for listed names) and `{!NAME:fallback}`, where the inline
  fallback is raw literal text (quote it yourself if needed) used when
  the listed variable is unset and has no configured default — the same
  works for listed claims that are absent on the request. Unlisted names
  stay literal in every form, so the strict forms never widen the
  allowlist (and never consume CSS/JS brace content).

:::danger Public allowlist
Anything you list in `AvailableEnvVars` is templated into static content
served to **any** client. Templating a secret (database password, API
key, signing token) into `index.html` leaks it to every user via browser
DevTools. Treat the list as a public allowlist, never as a "make this
reachable to the app" shortcut. Secrets stay in server-side code paths
that read env directly. This is distinct from the server-side
[`Config:ParseEnvironmentVariables`](./config-section) mechanism, which
substitutes `{ENV}` tokens into `appsettings.json` values that never
leave the server.
:::

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

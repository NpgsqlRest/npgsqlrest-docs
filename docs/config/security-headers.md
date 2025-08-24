---
outline: [2, 3]
title: "Security Headers"
titleTemplate: NpgsqlRest
description: "Configure HTTP security headers for NpgsqlRest. Protect against XSS, clickjacking, MIME-sniffing, and other web vulnerabilities with X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, and more."
head:
  - - meta
    - name: keywords
      content: npgsqlrest security headers, http security headers, csp, content security policy, x-frame-options, referrer-policy, permissions-policy
  - - meta
    - property: og:title
      content: "NpgsqlRest Security Headers Configuration"
  - - meta
    - property: og:description
      content: "Configure HTTP security headers to protect against common web vulnerabilities."
  - - meta
    - property: og:type
      content: article
---

# Security Headers

::: tip New in 3.6.0
Security Headers middleware was added in version 3.6.0.
:::

Configurable security headers middleware to protect against common web vulnerabilities. The middleware adds HTTP security headers to all responses.

## Overview

```json
{
  "SecurityHeaders": {
    "Enabled": false,
    "XContentTypeOptions": "nosniff",
    "XFrameOptions": "DENY",
    "ReferrerPolicy": "strict-origin-when-cross-origin",
    "ContentSecurityPolicy": null,
    "PermissionsPolicy": null,
    "CrossOriginOpenerPolicy": null,
    "CrossOriginEmbedderPolicy": null,
    "CrossOriginResourcePolicy": null
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable security headers middleware. When enabled, configured headers are added to all HTTP responses. |
| `XContentTypeOptions` | string | `"nosniff"` | Prevents browsers from MIME-sniffing a response away from the declared content-type. Set to `null` to not include this header. |
| `XFrameOptions` | string | `"DENY"` | Controls whether the browser should allow the page to be rendered in a frame. Values: `"DENY"`, `"SAMEORIGIN"`. Set to `null` to not include. |
| `ReferrerPolicy` | string | `"strict-origin-when-cross-origin"` | Controls how much referrer information should be included with requests. Set to `null` to not include. |
| `ContentSecurityPolicy` | string | `null` | Defines approved sources of content that the browser may load. Helps prevent XSS and code injection attacks. |
| `PermissionsPolicy` | string | `null` | Controls which browser features and APIs can be used. |
| `CrossOriginOpenerPolicy` | string | `null` | Controls how your document is shared with cross-origin popups. |
| `CrossOriginEmbedderPolicy` | string | `null` | Prevents a document from loading cross-origin resources that don't explicitly grant permission. |
| `CrossOriginResourcePolicy` | string | `null` | Indicates how the resource should be shared cross-origin. |

## X-Content-Type-Options

Prevents browsers from MIME-sniffing a response away from the declared content-type, reducing exposure to drive-by download attacks.

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "XContentTypeOptions": "nosniff"
  }
}
```

The recommended value is `"nosniff"`.

## X-Frame-Options

Controls whether the browser should allow the page to be rendered in a `<frame>`, `<iframe>`, `<embed>` or `<object>`. Prevents clickjacking attacks.

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "XFrameOptions": "DENY"
  }
}
```

| Value | Description |
|-------|-------------|
| `DENY` | Never allow the page to be framed |
| `SAMEORIGIN` | Allow framing from the same origin only |

::: warning
This header is **skipped** if [Antiforgery](./antiforgery) is enabled, as Antiforgery already sets `X-Frame-Options: SAMEORIGIN` by default via its `SuppressXFrameOptionsHeader` setting.
:::

## Referrer-Policy

Controls how much referrer information should be included with requests made from your site.

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "ReferrerPolicy": "strict-origin-when-cross-origin"
  }
}
```

| Value | Description |
|-------|-------------|
| `no-referrer` | Never send referrer information |
| `no-referrer-when-downgrade` | Send full URL for same-security requests, nothing for downgrades |
| `origin` | Send only the origin (scheme, host, port) |
| `origin-when-cross-origin` | Send full URL for same-origin, origin only for cross-origin |
| `same-origin` | Send full URL for same-origin, nothing for cross-origin |
| `strict-origin` | Send origin for same-security, nothing for downgrades |
| `strict-origin-when-cross-origin` | Send full URL for same-origin, origin for cross-origin same-security |
| `unsafe-url` | Always send full URL (not recommended) |

## Content-Security-Policy

Defines approved sources of content that the browser may load. This is one of the most powerful headers for preventing XSS, clickjacking, and other code injection attacks.

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  }
}
```

::: tip
CSP should be configured based on your specific application needs. Start with a restrictive policy and loosen as needed.
:::

Common directives:
- `default-src` - Fallback for other directives
- `script-src` - Valid sources for JavaScript
- `style-src` - Valid sources for stylesheets
- `img-src` - Valid sources for images
- `connect-src` - Valid sources for fetch, WebSocket, etc.
- `font-src` - Valid sources for fonts
- `frame-src` - Valid sources for frames

Reference: [MDN Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Permissions-Policy

Controls which browser features and APIs can be used by your application and any embedded content.

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "PermissionsPolicy": "geolocation=(), microphone=(), camera=()"
  }
}
```

This example disables geolocation, microphone, and camera access entirely.

To allow features only from the same origin:

```json
{
  "SecurityHeaders": {
    "PermissionsPolicy": "geolocation=(self), microphone=(self)"
  }
}
```

Reference: [MDN Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)

## Cross-Origin Policies

### Cross-Origin-Opener-Policy

Controls how your document is shared with cross-origin popups.

```json
{
  "SecurityHeaders": {
    "CrossOriginOpenerPolicy": "same-origin"
  }
}
```

| Value | Description |
|-------|-------------|
| `unsafe-none` | Default browser behavior |
| `same-origin-allow-popups` | Isolate from cross-origin, allow popups |
| `same-origin` | Full isolation from cross-origin documents |

### Cross-Origin-Embedder-Policy

Prevents a document from loading cross-origin resources that don't explicitly grant permission.

```json
{
  "SecurityHeaders": {
    "CrossOriginEmbedderPolicy": "require-corp"
  }
}
```

| Value | Description |
|-------|-------------|
| `unsafe-none` | Default browser behavior |
| `require-corp` | Require CORP or CORS for cross-origin resources |
| `credentialless` | Load cross-origin resources without credentials |

::: tip
`require-corp` along with `CrossOriginOpenerPolicy: same-origin` enables access to `SharedArrayBuffer` and high-resolution timers.
:::

### Cross-Origin-Resource-Policy

Indicates how the resource should be shared cross-origin.

```json
{
  "SecurityHeaders": {
    "CrossOriginResourcePolicy": "same-origin"
  }
}
```

| Value | Description |
|-------|-------------|
| `same-site` | Only same-site requests allowed |
| `same-origin` | Only same-origin requests allowed |
| `cross-origin` | Any origin can load the resource |

## Example Configurations

### Basic Security (Recommended Starting Point)

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "XContentTypeOptions": "nosniff",
    "XFrameOptions": "DENY",
    "ReferrerPolicy": "strict-origin-when-cross-origin"
  }
}
```

### API-Only Application

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "XContentTypeOptions": "nosniff",
    "XFrameOptions": "DENY",
    "ReferrerPolicy": "no-referrer",
    "ContentSecurityPolicy": "default-src 'none'; frame-ancestors 'none'"
  }
}
```

### Full Protection with CSP

```json
{
  "SecurityHeaders": {
    "Enabled": true,
    "XContentTypeOptions": "nosniff",
    "XFrameOptions": "SAMEORIGIN",
    "ReferrerPolicy": "strict-origin-when-cross-origin",
    "ContentSecurityPolicy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'",
    "PermissionsPolicy": "geolocation=(), microphone=(), camera=()",
    "CrossOriginOpenerPolicy": "same-origin",
    "CrossOriginEmbedderPolicy": "require-corp",
    "CrossOriginResourcePolicy": "same-origin"
  }
}
```

## Related

- [Antiforgery](./antiforgery) - CSRF protection (also sets X-Frame-Options)
- [CORS](./cors) - Cross-Origin Resource Sharing configuration
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/) - Security headers reference

## Next Steps

- [Forwarded Headers](./forwarded-headers) - Configure proxy header handling
- [Authentication](./auth) - Configure authentication methods

---
outline: [2, 3]
title: "Antiforgery Configuration"
titleTemplate: NpgsqlRest
description: "Configure CSRF protection in NpgsqlRest. Antiforgery tokens, cookie settings, and header validation for secure state-changing requests."
head:
  - - meta
    - name: keywords
      content: npgsqlrest antiforgery, csrf protection api, cross-site request forgery, antiforgery tokens, api security csrf
  - - meta
    - property: og:title
      content: "NpgsqlRest Antiforgery Configuration"
  - - meta
    - property: og:description
      content: "Configure CSRF protection with antiforgery tokens for secure state-changing requests."
  - - meta
    - property: og:type
      content: article
---

# Antiforgery

Antiforgery token configuration protects against Cross-Site Request Forgery (CSRF) attacks by validating unique tokens for state-changing requests (POST, PUT, DELETE, etc.).

## Overview

```json
{
  "Antiforgery": {
    "Enabled": false,
    "CookieName": null,
    "FormFieldName": "__RequestVerificationToken",
    "HeaderName": "RequestVerificationToken",
    "SuppressReadingTokenFromFormBody": false,
    "SuppressXFrameOptionsHeader": false
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable antiforgery token validation. |
| `CookieName` | string | `null` | Custom cookie name. Uses default (`.AspNetCore.Antiforgery.*`) if null. |
| `FormFieldName` | string | `"__RequestVerificationToken"` | Name of the hidden form field containing the token. |
| `HeaderName` | string | `"RequestVerificationToken"` | HTTP header name for sending the token (useful for AJAX requests). |
| `SuppressReadingTokenFromFormBody` | bool | `false` | When true, skips reading tokens from form body (forces header-only validation). |
| `SuppressXFrameOptionsHeader` | bool | `false` | When true, disables the automatic `X-Frame-Options: SAMEORIGIN` header. |

## Token Submission

Antiforgery tokens can be submitted in two ways:

### Form Field

Include a hidden field in HTML forms:

```html
<form method="POST" action="/api/submit">
  <input type="hidden" name="__RequestVerificationToken" value="token-value" />
  <!-- form fields -->
</form>
```

### HTTP Header

Send the token in a header (useful for AJAX/fetch requests):

```javascript
fetch('/api/submit', {
  method: 'POST',
  headers: {
    'RequestVerificationToken': tokenValue
  }
});
```

## X-Frame-Options Header

When `SuppressXFrameOptionsHeader` is `false` (default), the server automatically adds the `X-Frame-Options: SAMEORIGIN` header to prevent clickjacking attacks. While Antiforgery is enabled, the [Security Headers](./security-headers) middleware skips its own `XFrameOptions` value.

::: warning
Only set `SuppressXFrameOptionsHeader` to `true` if you're handling frame protection elsewhere (e.g., Content-Security-Policy frame-ancestors directive).
:::

## Example Configuration

Enable antiforgery with custom header name:

```json
{
  "Antiforgery": {
    "Enabled": true,
    "HeaderName": "X-CSRF-Token",
    "SuppressReadingTokenFromFormBody": true
  }
}
```

## Related

- [Security Headers](./security-headers) - X-Frame-Options and other security headers
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication](./auth) - Configure authentication methods
- [Data Protection](./data-protection) - Configure encryption settings

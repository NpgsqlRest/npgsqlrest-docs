---
outline: [2, 3]
title: "External OAuth Authentication"
titleTemplate: NpgsqlRest
description: "Configure OAuth authentication with Google, GitHub, LinkedIn, Microsoft, and Facebook. Social login integration for your PostgreSQL REST API."
head:
  - - meta
    - name: keywords
      content: npgsqlrest oauth, postgresql google login, github authentication api, social login postgresql, oauth2 rest api, external auth providers
  - - meta
    - property: og:title
      content: "NpgsqlRest External OAuth Authentication"
  - - meta
    - property: og:description
      content: "Configure OAuth with Google, GitHub, LinkedIn, Microsoft, and Facebook for social login."
  - - meta
    - property: og:type
      content: article
---

# External OAuth Authentication

NpgsqlRest supports OAuth authentication with popular external providers including Google, LinkedIn, GitHub, Microsoft, and Facebook.

## Overview

```json
{
  "Auth": {
    "External": {
      "Enabled": false,
      "BrowserSessionStatusKey": "__external_status",
      "BrowserSessionMessageKey": "__external_message",
      "SigninUrl": "/signin-{0}",
      "SignInHtmlTemplate": "<!DOCTYPE html><html><head><meta charset=\"utf-8\" /><title>Talking To {0}</title></head><body>Loading...{1}</body></html>",
      "RedirectUrl": null,
      "ReturnToPath": "/",
      "ReturnToPathQueryStringKey": "return_to",
      "LoginCommand": "select * from external_login($1,$2,$3,$4,$5)",
      "ClientAnalyticsData": "{timestamp:new Date().toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,screen:{width:window.screen.width,height:window.screen.height,colorDepth:window.screen.colorDepth,pixelRatio:window.devicePixelRatio,orientation:screen.orientation.type},browser:{userAgent:navigator.userAgent,language:navigator.language,languages:navigator.languages,cookiesEnabled:navigator.cookieEnabled,doNotTrack:navigator.doNotTrack,onLine:navigator.onLine,platform:navigator.platform,vendor:navigator.vendor},memory:{deviceMemory:navigator.deviceMemory,hardwareConcurrency:navigator.hardwareConcurrency},window:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,outerWidth:window.outerWidth,outerHeight:window.outerHeight},location:{href:window.location.href,hostname:window.location.hostname,pathname:window.location.pathname,protocol:window.location.protocol,referrer:document.referrer},performance:{navigation:{type:performance.navigation?.type,redirectCount:performance.navigation?.redirectCount},timing:performance.timing?{loadEventEnd:performance.timing.loadEventEnd,loadEventStart:performance.timing.loadEventStart,domComplete:performance.timing.domComplete,domInteractive:performance.timing.domInteractive,domContentLoadedEventEnd:performance.timing.domContentLoadedEventEnd}:null}}",
      "ClientAnalyticsIpKey": "ip",
      "Google": {
        "Enabled": false,
        "ClientId": "",
        "ClientSecret": "",
        "AuthUrl": "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={0}&redirect_uri={1}&scope=openid profile email&state={2}",
        "TokenUrl": "https://oauth2.googleapis.com/token",
        "InfoUrl": "https://www.googleapis.com/oauth2/v3/userinfo",
        "EmailUrl": null
      },
      "LinkedIn": {
        "Enabled": false,
        "ClientId": "",
        "ClientSecret": "",
        "AuthUrl": "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={0}&redirect_uri={1}&state={2}&scope=r_liteprofile%20r_emailaddress",
        "TokenUrl": "https://www.linkedin.com/oauth/v2/accessToken",
        "InfoUrl": "https://api.linkedin.com/v2/me",
        "EmailUrl": "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements//(handle~))"
      },
      "GitHub": {
        "Enabled": false,
        "ClientId": "",
        "ClientSecret": "",
        "AuthUrl": "https://github.com/login/oauth/authorize?client_id={0}&redirect_uri={1}&state={2}&allow_signup=false",
        "TokenUrl": "https://github.com/login/oauth/access_token",
        "InfoUrl": "https://api.github.com/user",
        "EmailUrl": null
      },
      "Microsoft": {
        "Enabled": false,
        "ClientId": "",
        "ClientSecret": "",
        "AuthUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&client_id={0}&redirect_uri={1}&scope=openid%20profile%20email&state={2}",
        "TokenUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "InfoUrl": "https://graph.microsoft.com/oidc/userinfo",
        "EmailUrl": null
      },
      "Facebook": {
        "Enabled": false,
        "ClientId": "",
        "ClientSecret": "",
        "AuthUrl": "https://www.facebook.com/v20.0/dialog/oauth?response_type=code&client_id={0}&redirect_uri={1}&scope=public_profile%20email&state={2}",
        "TokenUrl": "https://graph.facebook.com/v20.0/oauth/access_token",
        "InfoUrl": "https://graph.facebook.com/me?fields=id,name,email",
        "EmailUrl": null
      }
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable external OAuth providers. |
| `BrowserSessionStatusKey` | string | `"__external_status"` | sessionStorage key for auth status (HTTP status code). |
| `BrowserSessionMessageKey` | string | `"__external_message"` | sessionStorage key for auth message. |
| `SigninUrl` | string | `"/signin-{0}"` | Sign-in page URL pattern. `{0}` is replaced with the provider name in lowercase. |
| `SignInHtmlTemplate` | string | *(see below)* | HTML template for the sign-in page. |
| `RedirectUrl` | string | `null` | Base URL (scheme + host) used to build the OAuth `redirect_uri` as `RedirectUrl` + `SigninUrl`. Resolved from the incoming request when `null`; set it when the public host differs from what the server sees (e.g. behind a proxy). |
| `ReturnToPath` | string | `"/"` | Default path to redirect after auth completes. |
| `ReturnToPathQueryStringKey` | string | `"return_to"` | Query string key for dynamic return path. |
| `LoginCommand` | string | `"select * from external_login($1,$2,$3,$4,$5)"` | PostgreSQL command to execute after OAuth login. Uses the same result processing logic as the [login endpoint](../annotations/login). |
| `ClientAnalyticsData` | string | *(JavaScript object)* | Browser analytics data sent to login command. |
| `ClientAnalyticsIpKey` | string | `"ip"` | JSON key for client IP in analytics data. |

### SignInHtmlTemplate

HTML template for the sign-in page shown during communication with the OAuth provider. This is typically a simple loading page. You can customize this to show your own loading animation, spinner, or branding. Format placeholders:

- `{0}` - Provider name (e.g., "Google", "GitHub")
- `{1}` - JavaScript to redirect to the external auth provider

Default value:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Talking To {0}</title>
</head>
<body>
  Loading...
  {1}
</body>
</html>
```

## Login Command

The `LoginCommand` is a PostgreSQL command that executes after successful OAuth authentication. It uses **the same result set conventions as the [login annotation](../annotations/login)** - column names, special columns (`status`, `scheme`, `body`), and claim handling all work identically.

For full details on how the result set is processed (return type requirements, special columns, claim types, status codes), see the [Login Endpoint Conventions](../annotations/login#the-return-record) documentation.

### Parameters

The `LoginCommand` receives up to five parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | text | External login provider name (e.g., "google", "github") |
| `$2` | text | User's email address |
| `$3` | text | User's display name |
| `$4` | text/json/jsonb | Raw JSON data from the OAuth provider |
| `$5` | text/json/jsonb | Browser analytics data (screen size, timezone, etc.) |

### Result Set Conventions

The command must return a named record (table). The result is processed using the same rules as login endpoints:

- **Special columns**: `status`, `scheme`, `body` control login behavior (see [Special Columns](../annotations/login#special-columns))
- **All other columns**: Become security claims (column name = claim type, column value = claim value)
- **Empty result**: Returns 401 Unauthorized
- **Multiple rows**: Only the first row is processed

### Example Login Command Function

```sql
create function external_login(
    _provider text,
    _email text,
    _name text,
    _data jsonb,
    _analytics jsonb
)
returns table(status boolean, id int, name text, email text, provider text)
language plpgsql as $$
declare
    _user_id int;
begin
    -- Find or create user
    select id into _user_id from users where email = _email;

    if _user_id is null then
        insert into users (email, name, created_via)
        values (_email, _name, _provider)
        returning id into _user_id;
    end if;

    -- Return claims (same format as login endpoint)
    return query
    select
        true as status,
        _user_id as id,
        _name as name,
        _email as email,
        _provider as provider;
end;
$$;
```

**Equivalent as inline SQL:**

`LoginCommand` is executed directly, so it does not have to call a function — any statement using `$1`–`$5` works:

```json
{
  "Auth": {
    "External": {
      "LoginCommand": "insert into users (email, name, created_via) values ($2, $3, $1) on conflict (email) do update set name = excluded.name returning true as status, id, name, email, $1 as provider"
    }
  }
}
```

## OAuth Providers

NpgsqlRest includes pre-configured defaults for Google, LinkedIn, GitHub, Microsoft, and Facebook. For these providers, you only need to set `ClientId` and `ClientSecret` - all URL settings have sensible defaults.

::: tip Minimal Configuration
For pre-configured providers, this is all you need. External providers are only wired up when at least one of `CookieAuth`, `BearerTokenAuth`, or `JwtAuth` is enabled — the OAuth callback signs the user in under that scheme (or the one returned in the `scheme` column):

```json
{
  "Auth": {
    "CookieAuth": true,
    "External": {
      "Enabled": true,
      "Google": {
        "Enabled": true,
        "ClientId": "{GOOGLE_CLIENT_ID}",
        "ClientSecret": "{GOOGLE_CLIENT_SECRET}"
      }
    }
  }
}
```

The `AuthUrl`, `TokenUrl`, `InfoUrl`, and `EmailUrl` settings are optional and only needed if:
- The provider changes their endpoints
- You need custom OAuth scopes
- You're defining a custom provider not listed below
:::

### Google

Configure your app at [Google Cloud Console](https://console.cloud.google.com/apis/).

Default URLs (for reference - you don't need to set these):

| Setting | Default Value |
|---------|---------------|
| `AuthUrl` | `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={0}&redirect_uri={1}&scope=openid profile email&state={2}` |
| `TokenUrl` | `https://oauth2.googleapis.com/token` |
| `InfoUrl` | `https://www.googleapis.com/oauth2/v3/userinfo` |
| `EmailUrl` | `null` |

### LinkedIn

Configure your app at [LinkedIn Developers](https://www.linkedin.com/developers/apps/).

Default URLs (for reference - you don't need to set these):

| Setting | Default Value |
|---------|---------------|
| `AuthUrl` | `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={0}&redirect_uri={1}&state={2}&scope=r_liteprofile%20r_emailaddress` |
| `TokenUrl` | `https://www.linkedin.com/oauth/v2/accessToken` |
| `InfoUrl` | `https://api.linkedin.com/v2/me` |
| `EmailUrl` | `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements//(handle~))` |

### GitHub

Configure your app at [GitHub Developer Settings](https://github.com/settings/developers/).

Default URLs (for reference - you don't need to set these):

| Setting | Default Value |
|---------|---------------|
| `AuthUrl` | `https://github.com/login/oauth/authorize?client_id={0}&redirect_uri={1}&state={2}&allow_signup=false` |
| `TokenUrl` | `https://github.com/login/oauth/access_token` |
| `InfoUrl` | `https://api.github.com/user` |
| `EmailUrl` | `null` |

### Microsoft

Configure your app at [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade). See [Microsoft Identity Platform documentation](https://learn.microsoft.com/en-us/entra/identity-platform/).

Default URLs (for reference - you don't need to set these):

| Setting | Default Value |
|---------|---------------|
| `AuthUrl` | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&client_id={0}&redirect_uri={1}&scope=openid%20profile%20email&state={2}` |
| `TokenUrl` | `https://login.microsoftonline.com/common/oauth2/v2.0/token` |
| `InfoUrl` | `https://graph.microsoft.com/oidc/userinfo` |
| `EmailUrl` | `null` |

### Facebook

Configure your app at [Facebook Developers](https://developers.facebook.com/apps/). See [Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/).

Default URLs (for reference - you don't need to set these):

| Setting | Default Value |
|---------|---------------|
| `AuthUrl` | `https://www.facebook.com/v20.0/dialog/oauth?response_type=code&client_id={0}&redirect_uri={1}&scope=public_profile%20email&state={2}` |
| `TokenUrl` | `https://graph.facebook.com/v20.0/oauth/access_token` |
| `InfoUrl` | `https://graph.facebook.com/me?fields=id,name,email` |
| `EmailUrl` | `null` |

## Provider Settings Reference

Each provider has the same configuration options:

| Setting | Type | Required | Description |
|---------|------|----------|-------------|
| `Enabled` | bool | Yes | Enable this provider. |
| `ClientId` | string | Yes | OAuth client ID from the provider. |
| `ClientSecret` | string | Yes | OAuth client secret from the provider. |
| `AuthUrl` | string | No | Authorization URL. Has sensible default for pre-configured providers. Placeholders: `{0}` = client ID, `{1}` = redirect URI, `{2}` = state. |
| `TokenUrl` | string | No | Token exchange URL. Has sensible default for pre-configured providers. |
| `InfoUrl` | string | No | User info URL. Has sensible default for pre-configured providers. |
| `EmailUrl` | string | No | Email URL (some providers require separate request). Default is `null`. |

### Custom Providers

You can define custom OAuth providers by specifying all URL settings. Use any key name under `External`:

```json
{
  "Auth": {
    "External": {
      "Enabled": true,
      "MyCustomProvider": {
        "Enabled": true,
        "ClientId": "your-client-id",
        "ClientSecret": "your-client-secret",
        "AuthUrl": "https://auth.example.com/oauth/authorize?response_type=code&client_id={0}&redirect_uri={1}&state={2}",
        "TokenUrl": "https://auth.example.com/oauth/token",
        "InfoUrl": "https://api.example.com/userinfo",
        "EmailUrl": null
      }
    }
  }
}
```

The sign-in URL will be `/signin-mycustomprovider` (provider name in lowercase).

## Complete Example

Configuration with Google and GitHub OAuth:

```json
{
  "Auth": {
    "CookieAuth": true,
    "CookieValid": "30 days",

    "External": {
      "Enabled": true,
      "ReturnToPath": "/dashboard",
      "LoginCommand": "select * from external_login($1, $2, $3, $4, $5)",

      "Google": {
        "Enabled": true,
        "ClientId": "{GOOGLE_CLIENT_ID}",
        "ClientSecret": "{GOOGLE_CLIENT_SECRET}"
      },

      "GitHub": {
        "Enabled": true,
        "ClientId": "{GITHUB_CLIENT_ID}",
        "ClientSecret": "{GITHUB_CLIENT_SECRET}"
      }
    }
  }
}
```

## Related

- [Authentication Guide](../guide/authentication) — the full walkthrough
- [Authentication](./auth) - Cookie, Bearer Token, and JWT authentication
- [authorize annotation](../annotations/authorize) - Require authentication on endpoints
- [login annotation](../annotations/login) - Mark endpoint as sign-in
- [logout annotation](../annotations/logout) - Mark endpoint as sign-out
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication](./auth) - Configure Cookie, Bearer Token, and JWT authentication
- [Authentication Options](./authentication-options) - Configure login/logout and password handling
- [Connection Settings](./connection) - Configure database connections

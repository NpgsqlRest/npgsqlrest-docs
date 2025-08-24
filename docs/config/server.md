---
outline: [2, 3]
title: "Server & SSL Settings"
titleTemplate: NpgsqlRest
description: "Configure NpgsqlRest web server settings. SSL/HTTPS, Kestrel options, HSTS, and HTTPS redirection for secure PostgreSQL REST APIs."
head:
  - - meta
    - name: keywords
      content: npgsqlrest ssl, postgresql api https, kestrel configuration, rest api ssl, hsts configuration, secure api server
  - - meta
    - property: og:title
      content: "NpgsqlRest Server & SSL Settings"
  - - meta
    - property: og:description
      content: "Configure SSL/HTTPS, Kestrel server options, and security settings for NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# Server & SSL Settings

This page covers the web server configuration including SSL/HTTPS settings and Kestrel server options.

## SSL Configuration

The `Ssl` section enables HTTPS support and related security features.

```json
{
  "Ssl": {
    "Enabled": false,
    "UseHttpsRedirection": true,
    "UseHsts": true
  }
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable Kestrel HTTPS configuration. See [UseKestrelHttpsConfiguration](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.hosting.webhostbuilderkestrelextensions.usekestrelhttpsconfiguration). |
| `UseHttpsRedirection` | bool | `true` | Redirect HTTP requests to HTTPS. See [UseUseHttpsRedirection](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.httpspolicybuilderextensions.usehttpsredirection). |
| `UseHsts` | bool | `true` | Add the `Strict-Transport-Security` header (HSTS). See [UseHsts](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.hstsbuilderextensions.usehsts). |

### Enabling HTTPS

To enable HTTPS, set `Ssl.Enabled` to `true` and configure your certificates in the `Kestrel` section:

```json
{
  "Ssl": {
    "Enabled": true,
    "UseHttpsRedirection": true,
    "UseHsts": true
  }
}
```

### HTTPS Redirection

When `UseHttpsRedirection` is `true`, all HTTP requests are automatically redirected to HTTPS. This ensures users always use the secure connection.

### HTTP Strict Transport Security (HSTS)

When `UseHsts` is `true`, the server sends the `Strict-Transport-Security` header, instructing browsers to only access the site over HTTPS for a specified period.

::: warning
HSTS should only be enabled in production environments. It can cause issues during development if you don't have valid certificates configured.
:::

## Kestrel Configuration

The `Kestrel` section configures the underlying web server, including endpoints, certificates, and connection limits.

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5000"
      },
      "Https": {
        "Url": "https://localhost:5001",
        "Certificate": {
          "Path": "/path/to/certificate.pfx",
          "Password": "{CERT_PASSWORD}"
        }
      }
    }
  }
}
```

For complete Kestrel configuration options, see the [Microsoft documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints).

### Certificate Configuration

Kestrel supports multiple ways to configure SSL certificates:

#### PFX File

```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:5001",
        "Certificate": {
          "Path": "/path/to/certificate.pfx",
          "Password": "{CERT_PASSWORD}"
        }
      }
    }
  }
}
```

#### PEM/CRT with Key File

```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:5001",
        "Certificate": {
          "Path": "/path/to/certificate.pem",
          "KeyPath": "/path/to/private.key",
          "Password": "{KEY_PASSWORD}"
        }
      }
    }
  }
}
```

#### Certificate Store (Windows)

```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:5001",
        "Certificate": {
          "Subject": "localhost",
          "Store": "My",
          "Location": "CurrentUser",
          "AllowInvalid": false
        }
      }
    }
  }
}
```

#### Default Certificate

You can define a default certificate used by all HTTPS endpoints:

```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:5001"
      }
    },
    "Certificates": {
      "Default": {
        "Path": "/path/to/certificate.pfx",
        "Password": "{CERT_PASSWORD}"
      }
    }
  }
}
```

### Connection Limits

Configure connection and request limits to protect your server:

```json
{
  "Kestrel": {
    "Limits": {
      "MaxConcurrentConnections": 100,
      "MaxConcurrentUpgradedConnections": 100,
      "MaxRequestBodySize": 30000000,
      "MaxRequestBufferSize": 1048576,
      "MaxRequestHeaderCount": 100,
      "MaxRequestHeadersTotalSize": 32768,
      "MaxRequestLineSize": 8192,
      "MaxResponseBufferSize": 65536,
      "KeepAliveTimeout": "00:02:00",
      "RequestHeadersTimeout": "00:00:30"
    }
  }
}
```

#### Limits Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `MaxConcurrentConnections` | `null` (unlimited) | Maximum number of open connections. |
| `MaxConcurrentUpgradedConnections` | `null` (unlimited) | Maximum number of upgraded connections (e.g., WebSockets). |
| `MaxRequestBodySize` | 30,000,000 (~28.6 MB) | Maximum request body size in bytes. |
| `MaxRequestBufferSize` | 1,048,576 (1 MB) | Maximum size of the request buffer. |
| `MaxRequestHeaderCount` | 100 | Maximum number of request headers. |
| `MaxRequestHeadersTotalSize` | 32,768 (32 KB) | Maximum total size of request headers. |
| `MaxRequestLineSize` | 8,192 (8 KB) | Maximum size of the request line. |
| `MaxResponseBufferSize` | 65,536 (64 KB) | Maximum size of the response buffer. |
| `KeepAliveTimeout` | 2 minutes | Timeout for keep-alive connections. |
| `RequestHeadersTimeout` | 30 seconds | Timeout for receiving request headers. |

### HTTP/2 Settings

Configure HTTP/2 specific options:

```json
{
  "Kestrel": {
    "Limits": {
      "Http2": {
        "MaxStreamsPerConnection": 100,
        "HeaderTableSize": 4096,
        "MaxFrameSize": 16384,
        "MaxRequestHeaderFieldSize": 8192,
        "InitialConnectionWindowSize": 65535,
        "InitialStreamWindowSize": 65535,
        "KeepAlivePingDelay": "00:00:30",
        "KeepAlivePingTimeout": "00:01:00",
        "KeepAlivePingPolicy": "WithActiveRequests"
      }
    }
  }
}
```

### HTTP/3 Settings

Configure HTTP/3 (QUIC) specific options:

```json
{
  "Kestrel": {
    "Limits": {
      "Http3": {
        "MaxRequestHeaderFieldSize": 8192
      }
    }
  }
}
```

### Additional Kestrel Options

```json
{
  "Kestrel": {
    "DisableStringReuse": false,
    "AllowAlternateSchemes": false,
    "AllowSynchronousIO": false,
    "AllowResponseHeaderCompression": true,
    "AddServerHeader": true,
    "AllowHostHeaderOverride": false
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `DisableStringReuse` | `false` | Disable string reuse optimization for debugging. |
| `AllowAlternateSchemes` | `false` | Allow alternate URI schemes in requests. |
| `AllowSynchronousIO` | `false` | Allow synchronous I/O operations (not recommended). |
| `AllowResponseHeaderCompression` | `true` | Enable response header compression for HTTP/2. |
| `AddServerHeader` | `true` | Add the `Server` header to responses. |
| `AllowHostHeaderOverride` | `false` | Allow the Host header to be overridden. |

## Complete Example

Here's a production-ready configuration with HTTPS enabled:

```json
{
  "Urls": "http://localhost:5000;https://localhost:5001",
  "Ssl": {
    "Enabled": true,
    "UseHttpsRedirection": true,
    "UseHsts": true
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      },
      "Https": {
        "Url": "https://0.0.0.0:5001",
        "Certificate": {
          "Path": "/etc/ssl/certs/myapp.pfx",
          "Password": "{CERT_PASSWORD}"
        }
      }
    },
    "Limits": {
      "MaxConcurrentConnections": 1000,
      "MaxRequestBodySize": 52428800,
      "KeepAliveTimeout": "00:02:00",
      "RequestHeadersTimeout": "00:00:30"
    }
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication](./auth) - Set up authentication methods
- [Connection Settings](./connection) - Configure database connections

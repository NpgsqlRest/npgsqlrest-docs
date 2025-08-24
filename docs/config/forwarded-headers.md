---
outline: [2, 3]
title: "Forwarded Headers"
titleTemplate: NpgsqlRest
description: "Configure forwarded headers middleware for NpgsqlRest. Process X-Forwarded-For, X-Forwarded-Proto, and X-Forwarded-Host headers when running behind a reverse proxy."
head:
  - - meta
    - name: keywords
      content: npgsqlrest forwarded headers, x-forwarded-for, x-forwarded-proto, reverse proxy, nginx, load balancer, client ip
  - - meta
    - property: og:title
      content: "NpgsqlRest Forwarded Headers Configuration"
  - - meta
    - property: og:description
      content: "Configure proxy header processing for reverse proxy deployments."
  - - meta
    - property: og:type
      content: article
---

# Forwarded Headers

::: tip New in 3.6.0
Forwarded Headers middleware was added in version 3.6.0.
:::

Support for processing proxy headers when running behind a reverse proxy (nginx, Apache, Azure App Service, AWS ALB, Cloudflare, etc.). This is critical for getting the correct client IP address and protocol.

## Overview

```json
{
  "ForwardedHeaders": {
    "Enabled": false,
    "ForwardLimit": 1,
    "KnownProxies": [],
    "KnownNetworks": [],
    "AllowedHosts": []
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable forwarded headers middleware (automatically placed first in the middleware pipeline). |
| `ForwardLimit` | int | `1` | Limits the number of proxy entries that will be processed from X-Forwarded-For. Set to `null` to process all entries (not recommended). |
| `KnownProxies` | array | `[]` | List of IP addresses of known proxies to accept forwarded headers from. |
| `KnownNetworks` | array | `[]` | List of CIDR network ranges of known proxies. |
| `AllowedHosts` | array | `[]` | List of allowed values for the X-Forwarded-Host header. |

## Why Forwarded Headers Matter

When your application runs behind a reverse proxy, the proxy intercepts all incoming requests. Without forwarded headers:

- **Client IP**: Your application sees the proxy's IP instead of the real client IP
- **Protocol**: Your application sees HTTP even if the client connected via HTTPS
- **Host**: Your application sees the proxy's internal hostname instead of the public domain

This affects:
- Rate limiting (you'd limit the proxy, not individual clients)
- Logging and analytics (wrong IPs in logs)
- HTTPS redirects (infinite redirect loops)
- Cookie security (secure cookies fail on perceived HTTP)

## Processed Headers

| Header | Purpose |
|--------|---------|
| `X-Forwarded-For` | Gets real client IP instead of proxy IP |
| `X-Forwarded-Proto` | Gets original protocol (http/https) |
| `X-Forwarded-Host` | Gets original host header |

## Forward Limit

Limits how many proxy entries are processed from the `X-Forwarded-For` header chain.

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 1
  }
}
```

If you have a chain of proxies (e.g., CDN → Load Balancer → Application), increase this value:

```json
{
  "ForwardedHeaders": {
    "ForwardLimit": 2
  }
}
```

::: warning
Setting `ForwardLimit` to `null` processes all entries, which can be a security risk as attackers can inject fake X-Forwarded-For entries.
:::

## Known Proxies

Specify exact IP addresses of trusted proxies:

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "KnownProxies": ["10.0.0.1", "192.168.1.1"]
  }
}
```

Forwarded headers are only accepted from these IP addresses.

## Known Networks

Specify CIDR network ranges when proxy IPs are dynamically assigned:

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "KnownNetworks": ["10.0.0.0/8", "192.168.0.0/16", "172.16.0.0/12"]
  }
}
```

This example trusts all private network ranges (common for cloud deployments).

::: tip
If both `KnownProxies` and `KnownNetworks` are empty, forwarded headers are accepted from any source. This is less secure but may be necessary in some environments.
:::

## Allowed Hosts

Restrict which host headers are accepted to prevent host header injection attacks:

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "AllowedHosts": ["example.com", "www.example.com", "api.example.com"]
  }
}
```

If empty, any host is allowed.

## Example Configurations

### Behind nginx

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 1,
    "KnownProxies": ["127.0.0.1"],
    "AllowedHosts": ["myapp.com", "www.myapp.com"]
  }
}
```

nginx configuration:
```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```

### AWS ALB / ELB

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 1,
    "KnownNetworks": ["10.0.0.0/8", "172.16.0.0/12"]
  }
}
```

AWS load balancers automatically set forwarded headers. Trust the VPC network range.

### Azure App Service

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 2
  }
}
```

Azure App Service sits behind multiple proxies. Empty `KnownProxies`/`KnownNetworks` allows headers from Azure's infrastructure.

### Cloudflare + Origin Server

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 2,
    "KnownNetworks": [
      "173.245.48.0/20",
      "103.21.244.0/22",
      "103.22.200.0/22",
      "103.31.4.0/22",
      "141.101.64.0/18",
      "108.162.192.0/18",
      "190.93.240.0/20",
      "188.114.96.0/20",
      "197.234.240.0/22",
      "198.41.128.0/17",
      "162.158.0.0/15",
      "104.16.0.0/13",
      "104.24.0.0/14",
      "172.64.0.0/13",
      "131.0.72.0/22"
    ]
  }
}
```

::: tip
Cloudflare publishes their IP ranges at https://www.cloudflare.com/ips/. Keep this list updated.
:::

### Docker/Kubernetes with Internal Load Balancer

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 1,
    "KnownNetworks": ["10.0.0.0/8"]
  }
}
```

Trust the container network range.

### Development (Trust All)

```json
{
  "ForwardedHeaders": {
    "Enabled": true,
    "ForwardLimit": 1
  }
}
```

::: danger
Do not use empty `KnownProxies`/`KnownNetworks` in production without understanding the security implications. Malicious clients can spoof forwarded headers.
:::

## Security Considerations

1. **Only enable behind trusted proxies**: Forwarded headers can be spoofed by clients if not properly validated.

2. **Limit forward depth**: Use `ForwardLimit` to prevent clients from injecting fake proxy chains.

3. **Specify known proxies**: Use `KnownProxies` or `KnownNetworks` to only accept headers from trusted sources.

4. **Validate hosts**: Use `AllowedHosts` to prevent host header injection attacks.

## Related

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [Rate Limiter](./rate-limiter) - Rate limiting relies on correct client IPs
- [Logging](./logging) - Log configuration including request logging
- [Microsoft Documentation](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer) - ASP.NET Core proxy configuration

## Next Steps

- [Security Headers](./security-headers) - Add HTTP security headers
- [Health Checks](./health-checks) - Configure health check endpoints

---
outline: [2, 3]
title: "Response Compression"
titleTemplate: NpgsqlRest
description: "Configure HTTP response compression in NpgsqlRest. Enable Brotli and Gzip compression, control compression levels, and specify MIME types to compress."
head:
  - - meta
    - name: keywords
      content: npgsqlrest compression, brotli compression api, gzip rest api, http response compression, api performance optimization
  - - meta
    - property: og:title
      content: "NpgsqlRest Response Compression"
  - - meta
    - property: og:description
      content: "Configure Brotli and Gzip compression for HTTP responses to reduce bandwidth."
  - - meta
    - property: og:type
      content: article
---

# Response Compression

Response compression settings for reducing HTTP response sizes using Brotli and Gzip algorithms.

## Overview

```json
{
  "ResponseCompression": {
    "Enabled": false,
    "EnableForHttps": false,
    "UseBrotli": true,
    "UseGzipFallback": true,
    "CompressionLevel": "Optimal",
    "IncludeMimeTypes": [
      "text/plain",
      "text/css",
      "application/javascript",
      "text/javascript",
      "text/html",
      "application/xml",
      "text/xml",
      "application/json",
      "text/json",
      "image/svg+xml",
      "font/woff",
      "font/woff2",
      "application/font-woff",
      "application/font-woff2"
    ],
    "ExcludeMimeTypes": []
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable response compression for HTTP responses. |
| `EnableForHttps` | bool | `false` | Enable response compression for HTTPS responses. |
| `UseBrotli` | bool | `true` | Use Brotli compression algorithm when supported by client. |
| `UseGzipFallback` | bool | `true` | Use Gzip compression as fallback when Brotli is not supported. |
| `CompressionLevel` | string | `"Optimal"` | Compression level: `Optimal`, `Fastest`, `NoCompression`, `SmallestSize`. |
| `IncludeMimeTypes` | array | *(see below)* | MIME types to include for compression. |
| `ExcludeMimeTypes` | array | `[]` | MIME types to exclude from compression. |

## Compression Levels

| Level | Description |
|-------|-------------|
| `Optimal` | Balance between compression ratio and speed (default). |
| `Fastest` | Fastest compression with lower compression ratio. |
| `SmallestSize` | Best compression ratio but slower. |
| `NoCompression` | No compression applied. |

## Compression Algorithms

### Brotli

Brotli provides better compression ratios than Gzip, especially for text content. When `UseBrotli` is `true`, the server will use Brotli compression if the client supports it (indicated by `Accept-Encoding: br` header).

### Gzip Fallback

When `UseGzipFallback` is `true`, the server falls back to Gzip compression for clients that don't support Brotli but do support Gzip (indicated by `Accept-Encoding: gzip` header).

## HTTPS Compression

::: warning Security Consideration
Enabling compression for HTTPS responses (`EnableForHttps: true`) may expose your application to BREACH-style attacks. Only enable if you understand the security implications and have appropriate mitigations in place.
:::

## Default MIME Types

The default `IncludeMimeTypes` covers common compressible content:

| Category | MIME Types |
|----------|------------|
| Text | `text/plain`, `text/css`, `text/html` |
| JavaScript | `application/javascript` |
| XML | `application/xml`, `text/xml` |
| JSON | `application/json`, `text/json` |
| SVG | `image/svg+xml` |
| Fonts | `font/woff`, `font/woff2`, `application/font-woff`, `application/font-woff2` |

## Example Configuration

Enable compression for production:

```json
{
  "ResponseCompression": {
    "Enabled": true,
    "EnableForHttps": true,
    "UseBrotli": true,
    "UseGzipFallback": true,
    "CompressionLevel": "Optimal"
  }
}
```

High-compression configuration for bandwidth-constrained environments:

```json
{
  "ResponseCompression": {
    "Enabled": true,
    "EnableForHttps": true,
    "UseBrotli": true,
    "UseGzipFallback": true,
    "CompressionLevel": "SmallestSize"
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [Logging](./logging) - Configure logging outputs

---
outline: [2, 3]
title: "Configuration Reference"
titleTemplate: NpgsqlRest
description: "Complete NpgsqlRest configuration reference. All settings for connections, authentication, caching, logging, and more."
head:
  - - meta
    - name: keywords
      content: npgsqlrest configuration, api configuration reference, postgresql rest config, appsettings reference, npgsqlrest settings
  - - meta
    - property: og:title
      content: "NpgsqlRest Configuration Reference"
  - - meta
    - property: og:description
      content: "Complete configuration reference for all NpgsqlRest settings and options."
  - - meta
    - property: og:type
      content: article
---

# Configuration Reference

Complete reference documentation for all NpgsqlRest configuration options.

For an introduction to how configuration works (sources, precedence, environment variables, command-line arguments), see the [Configuration Guide](../guide/configuration).

::: tip Latest Default Configuration
See the [Latest Default Configuration](./latest) for a complete reference of all default settings for version 3.16.2.
:::

## Reference Sections

### Core Settings

- [Top-Level Settings](./top-level) - Application identity, URLs, and startup message
- [Config Section](./config-section) - Configuration file processing and environment variables
- [NpgsqlRest Options](./npgsqlrest) - Core API generation settings (URL prefixes, naming conventions, request handling)
- [Routine Options](./routine-options) - PostgreSQL routine handling (language filtering, custom types)
- [Connection](./connection) - Database connection strings and settings
- [Server](./server) - Kestrel web server and SSL/TLS configuration

### Security

- [Authentication](./auth) - Cookie, Bearer Token, and JWT authentication
- [External OAuth](./external-auth) - Google, LinkedIn, GitHub, Microsoft, Facebook OAuth
- [Passkey Authentication](./passkey-auth) - WebAuthn passwordless authentication
- [Authentication Options](./authentication-options) - Per-endpoint authentication configuration
- [Claims Mapping](./claims-mapping) - User context and parameters mapping
- [Basic Auth Config](./basic-auth-config) - HTTP Basic Authentication configuration
- [Validation](./validation) - Parameter validation rules (NotNull, Required, Regex, etc.)
- [Antiforgery](./antiforgery) - CSRF protection settings
- [Data Protection](./data-protection) - Key storage and encryption settings
- [CORS](./cors) - Cross-Origin Resource Sharing configuration
- [Security Headers](./security-headers) - HTTP security headers (CSP, X-Frame-Options, etc.)
- [Forwarded Headers](./forwarded-headers) - Proxy header processing (X-Forwarded-For, etc.)

### Features

- [SQL File Source](./sql-file-source) - REST API endpoints from SQL files
- [Proxy](./proxy) - Reverse proxy support for forwarding requests to upstream services
- [OpenAPI](./openapi) - OpenAPI/Swagger documentation generation
- [HTTP Files](./http-files) - HTTP test file generation
- [Code Generation](./codegen) - Client code generation (TypeScript, etc.)
- [Uploads](./uploads) - File upload handling
- [Table Format](./table-format) - HTML table and Excel spreadsheet rendering for function results
- [HTTP Client](./http-client) - HTTP Types for external API calls from PostgreSQL functions

### Performance

- [Response Compression](./response-compression) - Gzip/Brotli compression settings
- [Cache Options](./cache-options) - Response caching configuration
- [Rate Limiter](./rate-limiter) - Rate limiting settings
- [Command Retry](./command-retry) - Database command retry policies
- [Thread Pool](./thread-pool) - Thread pool configuration

### Infrastructure

- [Logging](./logging) - Log levels and output configuration
- [Static Files](./static-files) - Static file serving configuration
- [Error Handling](./error-handling) - Error response configuration
- [Health Checks](./health-checks) - Kubernetes probes and health check endpoints
- [Stats](./stats) - PostgreSQL statistics endpoints for monitoring

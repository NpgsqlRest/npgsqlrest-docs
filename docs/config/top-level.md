---
outline: [2, 3]
title: "Top-Level Settings"
titleTemplate: NpgsqlRest
description: "Configure NpgsqlRest application identity, server URLs, and startup behavior. Application name, environment, and binding configuration."
head:
  - - meta
    - name: keywords
      content: npgsqlrest settings, application name configuration, server url binding, startup configuration, environment settings
  - - meta
    - property: og:title
      content: "NpgsqlRest Top-Level Settings"
  - - meta
    - property: og:description
      content: "Configure application identity, server URLs, and startup behavior for NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# Top-Level Settings

These settings configure the application identity, server binding, and configuration behavior.

## Application Settings

```json
{
  "ApplicationName": null,
  "EnvironmentName": "Production",
  "Urls": "http://localhost:8080",
  "StartupMessage": "Started in {time}, listening on {urls}, version {version}"
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ApplicationName` | string | `null` | Application identifier. Defaults to the top-level directory name if not set. |
| `EnvironmentName` | string | `"Production"` | Environment designation (`Development`, `Staging`, `Production`). |
| `Urls` | string | `"http://localhost:8080"` | Server listening URLs. Separate multiple URLs with semicolons. |
| `StartupMessage` | string | *(see below)* | Message displayed on startup. Supports placeholders. |

Default `StartupMessage`: `"Started in {time}, listening on {urls}, version {version}"`

### Urls Configuration

The `Urls` setting accepts multiple URLs separated by semicolons:

```json
{
  "Urls": "http://localhost:8080;https://localhost:8443"
}
```

To listen on all interfaces:

```json
{
  "Urls": "http://0.0.0.0:8080;https://0.0.0.0:8443"
}
```

### Startup Message Placeholders

Customize the startup message with these placeholders:

| Placeholder | Description |
|-------------|-------------|
| `{time}` | Startup time |
| `{urls}` | Listening URLs |
| `{version}` | Application version |
| `{environment}` | Environment name (from `EnvironmentName`) |
| `{application}` | Application name (from `ApplicationName`) |

Example:

```json
{
  "StartupMessage": "Started in {time}, listening on {urls}, version {version}, env: {environment}"
}
```

## Related

- [Config Section](./config-section) - Configuration file processing settings
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration sources work

## Next Steps

- [Connection Settings](./connection) - Database connection strings
- [Server & SSL](./server) - Kestrel and HTTPS configuration

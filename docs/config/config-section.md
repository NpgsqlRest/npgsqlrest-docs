---
outline: [2, 3]
title: "Config Section"
titleTemplate: NpgsqlRest
description: "Configure how NpgsqlRest processes configuration files. Environment variables, .env files, and configuration key validation."
head:
  - - meta
    - name: keywords
      content: npgsqlrest config, environment variables, env file configuration, configuration debugging, appsettings processing
  - - meta
    - property: og:title
      content: "NpgsqlRest Config Section"
  - - meta
    - property: og:description
      content: "Configure environment variables, .env files, and configuration processing."
  - - meta
    - property: og:type
      content: article
---

# Config Section

The `Config` section controls how the configuration file itself is processed.

```json
{
  "Config": {
    "AddEnvironmentVariables": false,
    "ParseEnvironmentVariables": true,
    "EnvFile": null,
    "ValidateConfigKeys": "Warning"
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `AddEnvironmentVariables` | bool | `false` | Allow environment variables to override configuration settings. |
| `ParseEnvironmentVariables` | bool | `true` | Parse `{ENV_VAR_NAME}` placeholders in config values and replace with environment variable values. |
| `EnvFile` | string | `null` | Path to a `.env` file for loading environment variables. See below. |
| `ValidateConfigKeys` | string | `"Warning"` | Validate configuration keys against known defaults at startup. See below. |

## Environment Variable Override

When `AddEnvironmentVariables` is `true`, environment variables can override any configuration setting. Use double underscores for nested keys:

```bash
# Override ConnectionStrings.Default
export ConnectionStrings__Default="Host=production-server;..."

# Override NpgsqlRest.UrlPathPrefix
export NpgsqlRest__UrlPathPrefix="/v2/api"
```

## Environment Variable Parsing

When `ParseEnvironmentVariables` is `true` (default), you can use `{ENV_VAR}` syntax anywhere in configuration values:

```json
{
  "ConnectionStrings": {
    "Default": "Host={PGHOST};Port={PGPORT};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD}"
  }
}
```

This allows sensitive values to be kept in environment variables rather than in the configuration file.

## Loading from .env File

When `AddEnvironmentVariables` or `ParseEnvironmentVariables` is `true` and `EnvFile` is set, the application will load environment variables from the specified file:

```json
{
  "Config": {
    "AddEnvironmentVariables": false,
    "ParseEnvironmentVariables": true,
    "EnvFile": ".env"
  }
}
```

The `.env` file format supports:

- `KEY=VALUE` pairs (one per line)
- Comments (lines starting with `#`)
- Quoted values (both single and double quotes)

Example `.env` file:

```
# Database connection settings
PGHOST=localhost
PGPORT=5432
PGDATABASE=example_db
PGUSER=postgres
PGPASSWORD=postgres
```

The variables are loaded into the environment and made available for configuration parsing with the `{ENV_VAR_NAME}` syntax.

## Configuration Key Validation

::: tip New in 3.8.0
Configuration key validation was added in version 3.8.0.
:::

At startup, NpgsqlRest can validate all configuration keys in `appsettings.json` against the known defaults schema. This catches typos and unknown keys that would otherwise be silently ignored (e.g., `LogCommand` instead of `LogCommands`).

The `ValidateConfigKeys` setting has three modes:

| Mode | Behavior |
|------|----------|
| `"Warning"` (default) | Logs warnings for unknown keys, startup continues. |
| `"Error"` | Logs errors for unknown keys and exits the application. |
| `"Ignore"` | No validation is performed. |

```json
{
  "Config": {
    "ValidateConfigKeys": "Warning"
  }
}
```

Example output:

```
[12:34:56 WRN] Unknown configuration key: NpgsqlRest:KebabCaselUrls
```

Validation also covers the `Kestrel` section, checking against the known Kestrel schema including `Limits`, `Http2`, `Http3`, and top-level flags like `DisableStringReuse` and `AllowSynchronousIO`. User-defined endpoint and certificate names under `Endpoints` and `Certificates` remain open-ended and won't trigger warnings.

::: tip
Use the `--config` CLI switch to inspect the current configuration with syntax highlighting, or `--validate` for a pre-flight check of configuration and database connectivity.
:::

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration sources work

## Next Steps

- [Connection Settings](./connection) - Database connection strings
- [Server & SSL](./server) - Kestrel and HTTPS configuration

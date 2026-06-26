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

## Overview

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
| `ParseEnvironmentVariables` | bool | `true` | Parse `{ENV_VAR_NAME}` (optional), `{!ENV_VAR_NAME}` (required) and `{!ENV_VAR_NAME:fallback}` (fallback) placeholders in config values and replace with environment variable values. See below. |
| `EnvFile` | string | `"./.env"` | Path to a `.env` file for loading environment variables. Loaded by default since 3.21.0; when the default file is absent it is skipped with an information message. Set to `null` to disable. See below. |
| `ValidateConfigKeys` | string | `"Warning"` | Validate configuration keys against known defaults at startup. See below. |

## Placeholder Forms: Optional, Required and Fallback (3.17.0+, fallback 3.21.0+)

With `ParseEnvironmentVariables` enabled, config values support three placeholder forms, for **every** value type (bool, int, string, enum, arrays, dictionaries):

- **`{NAME}` — optional.** Substituted with the variable's value when set; **left untouched when not set** — typed reads (`bool`, `int`, …) fall back to their defaults instead of crashing, and legitimate non-env brace syntax (e.g. a Serilog `OutputTemplate`) is preserved.
- **`{!NAME}` — required.** Substituted with the value, or **throws a clear startup error naming the variable** when it is not set.
- **`{!NAME:fallback}` — fallback.** Substituted with the value when set, otherwise with the literal `fallback` text — never fails. The fallback starts after the first `:` and runs to the closing brace, so it may itself contain `:` (`{!BASE_URL:http://localhost:5000}`), but not `}`.

```jsonc
"Enabled": "{GITHUB_AUTH_ENABLED}"   // env unset → feature defaults to off (no crash)
"Enabled": "{!GITHUB_AUTH_ENABLED}"  // env unset → startup error naming the variable
"Port": "{!APP_PORT:5432}"           // env unset → 5432
```

Note that only the `{!` form takes a fallback: a plain `{NAME:...}` is never treated as an env placeholder, so brace-colon content like Serilog format specifiers (`{Timestamp:HH:mm:ss}`) or inline CSS stays intact.

## Environment Variable Override

When `AddEnvironmentVariables` is `true`, environment variables can override any configuration setting (command-line arguments still take precedence over environment variables). Use double underscores for nested keys:

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
    "EnvFile": "./.env"
  }
}
```

Since 3.21.0, `"./.env"` (relative to the working directory) is the shipped default, which makes the minimal setup a single file: create `.env` with one line — `PGDATABASE=mydb` — and run `npgsqlrest`. The rules:

- **Variables already present in the process environment always win** — the file only fills in missing ones (the standard dotenv convention; before 3.21.0 the file overwrote the environment). A repeated key within the file keeps its last value.
- The default `./.env` is **optional**: when the file does not exist, startup logs an information message (`Env file ./.env not found, skipping (set Config:EnvFile to null to disable env file loading)`). A **custom** path that does not exist logs a **warning**.
- When the file loads, startup logs how many variables it contributed and how many were kept from the real environment.
- Set `"EnvFile": null` to disable loading entirely. Configurations that omit the `EnvFile` key load nothing — the default comes from the shipped configuration file, not from code.

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

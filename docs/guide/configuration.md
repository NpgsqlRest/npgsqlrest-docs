---
outline: [2, 3]
title: "Configuration Guide"
titleTemplate: NpgsqlRest
description: "Configure NpgsqlRest using JSON files, environment variables, and command-line arguments. Learn about configuration precedence, default values, and best practices."
head:
  - - meta
    - name: keywords
      content: npgsqlrest configuration, appsettings.json postgresql, rest api server config, npgsqlrest settings, postgresql api configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Configuration Guide"
  - - meta
    - property: og:description
      content: "Configure NpgsqlRest using JSON files, environment variables, and command-line arguments."
  - - meta
    - property: og:type
      content: article
---

# Configuration Guide

NpgsqlRest can be configured through multiple sources, each with different precedence levels. Common configuration sources are configuration files, usually different versions for different environments, environment variables, and command-line arguments.

## Configuration Sources

NpgsqlRest reads configuration from the following sources (in order of precedence, lowest to highest):

1. **Configuration files** (`appsettings.json`, then `appsettings.Development.json`)
2. **Command-line arguments**

Environment variables can be referenced in configuration values using `{VARIABLE_NAME}` syntax. This works in both configuration files and command-line arguments.

Use command-line arguments to override any configuration value.

## Default Values

If a configuration value is not explicitly set in any source, NpgsqlRest uses the default value. To see all defaults with inline descriptions, use the `--config` command:

```bash
npgsqlrest --config > appsettings.json
```

This generates a fully commented JSONC file with descriptions for every setting, ready to use as your configuration file. See [Exploring Configuration](#exploring-configuration) below for more on `--config`.

## Configuration Files

### Default Configuration Files

By default, NpgsqlRest loads configuration files from the current working directory in this order:

1. `appsettings.json`
2. `appsettings.Development.json` (overrides values from the first)

Both files are optional — no error occurs if either is missing. You can specify additional or alternative configuration files using command-line arguments.

```bash
# Use default appsettings.json and/or appsettings.Development.json from current directory
npgsqlrest

# Specify a custom configuration file
npgsqlrest appsettings.production.json

# Load multiple configuration files (later files override earlier ones)
npgsqlrest appsettings.json appsettings.production.json appsettings.local.json
```

### Optional Configuration Files

Use the `-o` or `--optional` switch to mark configuration files as optional. Optional files won't cause an error if they don't exist:

```bash
# appsettings.local.json is optional - no error if missing
npgsqlrest appsettings.json -o appsettings.local.json

# Multiple optional files
npgsqlrest appsettings.json --optional development.json --optional local.json
```

### Configuration File Format

Configuration files use standard JSON format with support for comments:

```json
{
  // Application identification
  "ApplicationName": "MyApi",

  // Database connection
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=mydb;Username=user;Password=pass"
  },

  // NpgsqlRest options
  "NpgsqlRest": {
    "UrlPathPrefix": "/api",
    "RequiresAuthorization": false
  }
}
```

## Environment Variables

By default, environment variable binding is disabled. Instead, environment variables can be referenced in configuration values using `{VARIABLE_NAME}` syntax:

```json
{
  "ConnectionStrings": {
    "Default": "Host={DB_HOST};Database={DB_NAME};Username={DB_USER};Password={DB_PASS}"
  }
}
```

This works in both configuration files and command-line arguments.

For non-string configuration values, use the quoted form `"{VARIABLE_NAME}"` in the configuration file. The value will be automatically parsed to the appropriate type:

```json
{
  "NpgsqlRest": {
    "CommandTimeout": "{COMMAND_TIMEOUT}",
    "RequiresAuthorization": "{REQUIRES_AUTH}"
  }
}
```

### Optional and Required Placeholders <Badge type="tip" text="3.17.0+" />

Placeholders come in two forms, supported for **every** value type (bool, int, string, enum, arrays, dictionaries):

- **`{NAME}` — optional.** Substituted with the variable's value when set; **left untouched when not set** — so typed `bool`/`int` reads fall back to their default instead of crashing, and legitimate non-env brace syntax (e.g. a Serilog `OutputTemplate`) is preserved.
- **`{!NAME}` — required.** Substituted with the value, or **throws a clear startup error naming the variable** when it is not set.

```jsonc
"Enabled": "{GITHUB_AUTH_ENABLED}"   // env unset → feature defaults to off (no crash)
"Enabled": "{!GITHUB_AUTH_ENABLED}"  // env unset → startup error naming the variable
```

Placeholder parsing is controlled by [`Config:ParseEnvironmentVariables`](../config/config-section) (enabled by default).

### Enabling Environment Variable Binding

To enable automatic environment variable binding (where variables override configuration values directly), set `AddEnvironmentVariables` to `true`:

```json
{
  "Config": {
    "AddEnvironmentVariables": true
  }
}
```

When enabled, environment variables can override any configuration value. The naming convention uses double underscores (`__`) to represent JSON hierarchy levels:

```bash
# Override a top-level setting
export ApplicationName=MyApi

# Override nested settings (use __ for hierarchy)
export ConnectionStrings__Default="Host=localhost;Database=mydb"
export NpgsqlRest__UrlPathPrefix="/api/v2"
export NpgsqlRest__RequiresAuthorization=true

# Then run
npgsqlrest
```

### Environment Variable Naming Rules

| JSON Path | Environment Variable |
|-----------|---------------------|
| `ApplicationName` | `ApplicationName` |
| `ConnectionStrings.Default` | `ConnectionStrings__Default` |
| `NpgsqlRest.UrlPathPrefix` | `NpgsqlRest__UrlPathPrefix` |
| `Auth.CookieAuth.Enabled` | `Auth__CookieAuth__Enabled` |

## Command-Line Arguments

Command-line arguments have the highest precedence and override all other configuration sources. Use the `--key=value` syntax:

```bash
# Override settings via command line
npgsqlrest --ApplicationName=MyApi --NpgsqlRest:UrlPathPrefix=/api/v2

# Override connection string
npgsqlrest --ConnectionStrings:Default="Host=localhost;Database=mydb"

# Combine with configuration files
npgsqlrest appsettings.json --NpgsqlRest:RequiresAuthorization=false
```

### Command-Line Syntax Rules

- Use `--key=value` format
- Use colons (`:`) to separate hierarchy levels (alternative to `__`)
- Keys are **case-insensitive** — overrides match the existing key regardless of casing (e.g., `--applicationname=test` correctly updates `ApplicationName`)
- Boolean values: `true`, `false`, `1`, `0`

```bash
# These are all equivalent
npgsqlrest --npgsqlrest:urlpathprefix=/api
npgsqlrest --NpgsqlRest:UrlPathPrefix=/api
npgsqlrest --NPGSQLREST:URLPATHPREFIX=/api
```

## Exploring Configuration

The `--config` CLI command helps you discover and understand all available settings without consulting documentation. Standard configuration files and `--key=value` overrides can appear before the `--config` switch — this lets you inspect the effective configuration for a given setup.

### Generating a Default Configuration File

Running `--config` with no arguments outputs the full default configuration as JSONC with inline comments describing every setting:

```bash
npgsqlrest --config
```

Redirect the output to create a ready-to-use configuration file:

```bash
npgsqlrest --config > appsettings.json
```

Include config files and overrides (case-insensitive) to see their effect on the output:

```bash
npgsqlrest appsettings.json --npgsqlrest:commandtimeout=30 --config
```

The output is syntax-highlighted in the terminal; when piped or redirected, plain JSONC is emitted.

### Searching for Settings

Pass a filter argument to `--config` to search across setting names, comments, and values (case-insensitive):

```bash
npgsqlrest --config cors
npgsqlrest --config=timeout
npgsqlrest --config minworker
```

The output preserves the full section hierarchy so it can be copy-pasted directly into `appsettings.json`. When a key inside a section matches, its parent section is included. When a section name or its comment matches, the entire section is shown. Matched terms are highlighted in the terminal.

This also works with config files and case-insensitive overrides:

```bash
npgsqlrest appsettings.json --npgsqlrest:commandtimeout=30 --config timeout
```

### Configuration Validation

The `--config` command validates all configuration keys before producing output. Unknown keys (e.g., `--xxx=test`) produce an error on stderr and exit with code 1, helping you catch typos early.

## Configuration Precedence Example

Consider this scenario with multiple configuration sources:

**appsettings.json:**
```json
{
  "ApplicationName": "DefaultApp",
  "NpgsqlRest": {
    "UrlPathPrefix": "/api",
    "RequiresAuthorization": true
  }
}
```

**Environment variables:**
```bash
export NpgsqlRest__UrlPathPrefix="/api/v2"
```

**Command line:**
```bash
npgsqlrest --NpgsqlRest:RequiresAuthorization=false
```

**Resulting configuration:**
| Setting | Value | Source |
|---------|-------|--------|
| `ApplicationName` | `"DefaultApp"` | appsettings.json |
| `NpgsqlRest.UrlPathPrefix` | `"/api/v2"` | Environment variable |
| `NpgsqlRest.RequiresAuthorization` | `false` | Command line |

## Quick Reference

### Common Command-Line Overrides

```bash
# Database connection
npgsqlrest --ConnectionStrings:Default="Host=localhost;Database=mydb;Username=user;Password=pass"

# Change listening URL
npgsqlrest --Urls="http://localhost:8080"

# Disable authorization for development
npgsqlrest --NpgsqlRest:RequiresAuthorization=false

# Set log level
npgsqlrest --Log:MinimalLevels:NpgsqlRest=Debug
```

### Exploring Configuration

```bash
# Generate a fully commented default configuration file
npgsqlrest --config > appsettings.json

# Search for settings related to a topic
npgsqlrest --config cors
npgsqlrest --config=timeout

# Inspect effective configuration with overrides applied (case-insensitive)
npgsqlrest appsettings.json --npgsqlrest:commandtimeout=30 --config
```

## Configuration Structure Overview

This section provides a complete overview of the NpgsqlRest configuration file structure.

```json
{
  // Application Identification
  "ApplicationName": null,
  "EnvironmentName": "Production",
  "Urls": "http://localhost:8080",
  "StartupMessage": "Started in {time}, listening on {urls}, version {version}",

  // Configuration Options
  "Config": { ... },

  // Database Connections
  "ConnectionStrings": { ... },
  "ConnectionSettings": { ... },

  // Server & SSL
  "Ssl": { ... },
  "Kestrel": { ... },

  // Security
  "DataProtection": { ... },
  "Auth": { ... },
  "Antiforgery": { ... },

  // Threading
  "ThreadPool": { ... },

  // Logging
  "Log": { ... },

  // Performance & Features
  "ResponseCompression": { ... },
  "StaticFiles": { ... },
  "Cors": { ... },
  "CommandRetryOptions": { ... },
  "CacheOptions": { ... },
  "RateLimiterOptions": { ... },

  // Error Handling
  "ErrorHandlingOptions": { ... },

  // Core API Options
  "NpgsqlRest": {
    // Connection & Query Settings
    "ConnectionName": null,
    "UseMultipleConnections": false,
    "CommandTimeout": null,

    // Schema & Name Filtering
    "SchemaSimilarTo": null,
    "SchemaNotSimilarTo": null,
    "IncludeSchemas": [],
    "ExcludeSchemas": [],
    "NameSimilarTo": null,
    "NameNotSimilarTo": null,
    "IncludeNames": [],
    "ExcludeNames": [],

    // URL & Naming Options
    "UrlPathPrefix": "/api",
    "KebabCaseUrls": true,
    "CamelCaseNames": true,
    "CommentsMode": "OnlyWithHttpTag",

    // Request Handling
    "DefaultHttpMethod": null,
    "DefaultRequestParamType": null,
    "RequiresAuthorization": false,

    // Request Headers
    "RequestHeadersMode": "Parameter",
    "RequestHeadersContextKey": "request.headers",
    "RequestHeadersParameterName": "_headers",
    "InstanceIdRequestHeaderName": null,
    "CustomRequestHeaders": [],
    "ExecutionIdHeaderName": "X-NpgsqlRest-ID",

    // Server-Sent Events
    "DefaultServerSentEventsEventNoticeLevel": "INFO",
    "ServerSentEventsResponseHeaders": { ... },

    // Logging
    "LogConnectionNoticeEvents": false,
    "LogConnectionNoticeEventsMode": "FirstStackFrameAndMessage",
    "LogCommands": false,
    "LogCommandParameters": false,

    // Nested Configuration Objects
    "RoutineOptions": { ... },
    "UploadOptions": { ... },
    "AuthenticationOptions": { ... },
    "HttpFileOptions": { ... },
    "OpenApiOptions": { ... },
    "ClientCodeGen": { ... }
  }
}
```

## Top-Level Settings

These settings configure the application identity and server binding.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ApplicationName` | string | `null` | Application identifier. Defaults to the top-level directory name if not set. |
| `EnvironmentName` | string | `"Production"` | Environment designation (`Development`, `Staging`, `Production`). |
| `Urls` | string | `"http://localhost:8080"` | Server listening URLs. Separate multiple URLs with semicolons. |
| `StartupMessage` | string | `"Started in {time}, listening on {urls}, version {version}"` | Message displayed on startup. Supports placeholders. |

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

### Startup Message

Customize the startup message with placeholders:

```json
{
  "StartupMessage": "Started in {time}, listening on {urls}, version {version}, env: {environment}"
}
```

Available placeholders:
- `{time}` - Startup time
- `{urls}` - Listening URLs
- `{version}` - Application version
- `{environment}` - Environment name (from `EnvironmentName`)
- `{application}` - Application name (from `ApplicationName`)

## Config Section Options

The `Config` section controls how the configuration file itself is processed, including environment variable handling and configuration key validation.

See the [Config Section Reference](../config/config-section) for complete documentation on:

- Environment variable overrides
- Environment variable parsing with `{ENV_VAR}` syntax
- Loading variables from `.env` files
- Configuration key validation at startup

## Next Steps

- [Comment Annotations Guide](./annotations) - Use SQL comments to configure endpoints
- [Annotations Reference](../annotations/) - Complete reference of all annotations
- [Configuration Reference](../config/) - Complete reference for all configuration options
- [Connection Settings](../config/connection) - Configure database connections
- [Server & SSL](../config/server) - Configure HTTPS and Kestrel web server
- [Authentication](../config/auth) - Set up authentication methods

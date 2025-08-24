---
outline: [2, 3]
title: "Logging Configuration"
titleTemplate: NpgsqlRest
description: "Configure logging in NpgsqlRest with Serilog. Output to console, files, PostgreSQL tables, and OpenTelemetry. Control log levels and formatting."
head:
  - - meta
    - name: keywords
      content: npgsqlrest logging, serilog postgresql, api logging configuration, opentelemetry logging, postgresql log table, rest api logging
  - - meta
    - property: og:title
      content: "NpgsqlRest Logging Configuration"
  - - meta
    - property: og:description
      content: "Configure logging with Serilog for console, files, PostgreSQL, and OpenTelemetry outputs."
  - - meta
    - property: og:type
      content: article
---

# Logging

Logging configuration using Serilog for console, file, PostgreSQL database, and OpenTelemetry outputs.

## Overview

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Information",
      "System": "Warning",
      "Microsoft": "Warning"
    },
    "ToConsole": true,
    "ConsoleMinimumLevel": "Verbose",
    "ToFile": false,
    "FilePath": "logs/log.txt",
    "FileSizeLimitBytes": 30000000,
    "FileMinimumLevel": "Verbose",
    "RetainedFileCountLimit": 30,
    "RollOnFileSizeLimit": true,
    "ToPostgres": false,
    "PostgresCommand": "call log($1,$2,$3,$4,$5)",
    "PostgresMinimumLevel": "Verbose",
    "ToOpenTelemetry": false,
    "OTLPEndpoint": "http://localhost:4317",
    "OTLPProtocol": "Grpc",
    "OTLPResourceAttributes": {
      "service.name": "{application}",
      "service.version": "1.0",
      "service.environment": "{environment}"
    },
    "OTLPHeaders": {},
    "OTLPMinimumLevel": "Verbose",
    "OutputTemplate": "[{Timestamp:HH:mm:ss.fff} {Level:u3}] {Message:lj} [{SourceContext}]{NewLine}{Exception}"
  }
}
```

## Log Levels

Available log levels (from most to least verbose):

| Level | Description |
|-------|-------------|
| `Verbose` | Most detailed logging, typically for debugging |
| `Debug` | Debugging information |
| `Information` | General operational information |
| `Warning` | Warnings that don't stop execution |
| `Error` | Errors that affect specific operations |
| `Fatal` | Critical errors that stop the application |

See [Serilog Configuration Basics](https://github.com/serilog/serilog/wiki/Configuration-Basics#minimum-level) for more details.

## Minimal Levels

Configure minimum log levels per source context:

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Information",
      "System": "Warning",
      "Microsoft": "Warning"
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `NpgsqlRest` | string | `"Information"` | Log level for NpgsqlRest operations. Uses the application logger named after `ApplicationName`. |
| `System` | string | `"Warning"` | Log level for .NET System namespace. |
| `Microsoft` | string | `"Warning"` | Log level for Microsoft namespace (ASP.NET Core, etc.). |

## Console Output

```json
{
  "Log": {
    "ToConsole": true,
    "ConsoleMinimumLevel": "Verbose"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ToConsole` | bool | `true` | Enable logging to console output. |
| `ConsoleMinimumLevel` | string | `"Verbose"` | Minimum log level for console output. |

## File Output

```json
{
  "Log": {
    "ToFile": false,
    "FilePath": "logs/log.txt",
    "FileSizeLimitBytes": 30000000,
    "FileMinimumLevel": "Verbose",
    "RetainedFileCountLimit": 30,
    "RollOnFileSizeLimit": true
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ToFile` | bool | `false` | Enable logging to file system. |
| `FilePath` | string | `"logs/log.txt"` | File path for log files. |
| `FileSizeLimitBytes` | int | `30000000` | Maximum size limit for log files in bytes before rolling (30 MB). |
| `FileMinimumLevel` | string | `"Verbose"` | Minimum log level for file output. |
| `RetainedFileCountLimit` | int | `30` | Maximum number of log files to retain. |
| `RollOnFileSizeLimit` | bool | `true` | Create a new log file when size limit is reached. |

## PostgreSQL Output

```json
{
  "Log": {
    "ToPostgres": false,
    "PostgresCommand": "call log($1,$2,$3,$4,$5)",
    "PostgresMinimumLevel": "Verbose"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ToPostgres` | bool | `false` | Enable logging to PostgreSQL database. |
| `PostgresCommand` | string | `"call log($1,$2,$3,$4,$5)"` | PostgreSQL command to execute for database logging. |
| `PostgresMinimumLevel` | string | `"Verbose"` | Minimum log level for PostgreSQL output. |

### PostgreSQL Command Parameters

The `PostgresCommand` receives five parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | text | Log level (Verbose, Debug, Information, Warning, Error, Fatal) |
| `$2` | text | Log message |
| `$3` | timestamptz | Timestamp in UTC |
| `$4` | text | Exception text (or null if no exception) |
| `$5` | text | Source context (logger name) |

## OpenTelemetry Output

```json
{
  "Log": {
    "ToOpenTelemetry": false,
    "OTLPEndpoint": "http://localhost:4317",
    "OTLPProtocol": "Grpc",
    "OTLPResourceAttributes": {
      "service.name": "{application}",
      "service.version": "1.0",
      "service.environment": "{environment}"
    },
    "OTLPHeaders": {},
    "OTLPMinimumLevel": "Verbose"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ToOpenTelemetry` | bool | `false` | Enable OpenTelemetry protocol (OTLP) logging output. |
| `OTLPEndpoint` | string | `"http://localhost:4317"` | OTLP collector endpoint URL. |
| `OTLPProtocol` | string | `"Grpc"` | Protocol for OTLP: `"Grpc"` or `"HttpProtobuf"`. |
| `OTLPResourceAttributes` | object | *(see below)* | Resource attributes sent with logs. |
| `OTLPHeaders` | object | `{}` | Custom headers for OTLP requests. |
| `OTLPMinimumLevel` | string | `"Verbose"` | Minimum log level for OTLP output. |

### Resource Attributes

Default resource attributes use placeholders:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `service.name` | `"{application}"` | Application name from `ApplicationName` setting. |
| `service.version` | `"1.0"` | Application version. |
| `service.environment` | `"{environment}"` | Environment name from `EnvironmentName` setting. |

## Output Template

```json
{
  "Log": {
    "OutputTemplate": "[{Timestamp:HH:mm:ss.fff} {Level:u3}] {Message:lj} [{SourceContext}]{NewLine}{Exception}"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `OutputTemplate` | string | `"[{Timestamp:HH:mm:ss.fff} {Level:u3}] {Message:lj} [{SourceContext}]{NewLine}{Exception}"` | Serilog output template for formatting log messages. |

See [Serilog Formatting Output](https://github.com/serilog/serilog/wiki/Formatting-Output) for template syntax.

## Complete Example

Production configuration with file and PostgreSQL logging:

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Information",
      "System": "Warning",
      "Microsoft": "Warning"
    },
    "ToConsole": true,
    "ConsoleMinimumLevel": "Information",
    "ToFile": true,
    "FilePath": "/var/log/npgsqlrest/app.log",
    "FileSizeLimitBytes": 50000000,
    "FileMinimumLevel": "Information",
    "RetainedFileCountLimit": 14,
    "RollOnFileSizeLimit": true,
    "ToPostgres": true,
    "PostgresCommand": "call log($1,$2,$3,$4,$5)",
    "PostgresMinimumLevel": "Warning",
    "ToOpenTelemetry": false,
    "OutputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff} {Level:u3}] {Message:lj} [{SourceContext}]{NewLine}{Exception}"
  }
}
```

## Related

- [security_sensitive annotation](../annotations/security-sensitive) - Obfuscate sensitive data in logs
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Connection Settings](./connection) - Configure database connections
- [Server & SSL](./server) - Configure HTTPS and Kestrel web server

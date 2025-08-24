---
outline: [2, 3]
title: "Connection Settings"
titleTemplate: NpgsqlRest
description: "Configure PostgreSQL database connections in NpgsqlRest. Connection strings, multiple databases, pooling, and connection behavior settings."
head:
  - - meta
    - name: keywords
      content: npgsqlrest connection, postgresql connection string, database connection config, npgsql pooling, postgresql multiple databases
  - - meta
    - property: og:title
      content: "NpgsqlRest Connection Settings"
  - - meta
    - property: og:description
      content: "Configure PostgreSQL database connections, connection strings, pooling, and behavior settings."
  - - meta
    - property: og:type
      content: article
---

# Connection Settings

This page covers all database connection configuration in NpgsqlRest, including connection strings, connection behavior settings, and NpgsqlRest-specific connection options.

## Connection Strings

The `ConnectionStrings` section defines named database connections. The first available connection is used automatically when no specific connection is specified.

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=mydb;Username=myuser;Password=mypassword"
  }
}
```

### Multiple Connections

You can define multiple named connections for different purposes (e.g., read replicas, different databases):

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.example.com;Database=mydb;Username=app;Password=secret",
    "ReadReplica": "Host=replica.example.com;Database=mydb;Username=app;Password=secret",
    "Analytics": "Host=analytics.example.com;Database=analytics;Username=report;Password=secret"
  }
}
```

### Using Environment Variables

Connection strings support environment variable placeholders when `ParseEnvironmentVariables` is enabled (default):

```json
{
  "ConnectionStrings": {
    "Default": "Host={PGHOST};Port={PGPORT};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD}"
  }
}
```

This is the recommended approach for production deployments to keep credentials out of configuration files.

### Connection String Parameters

Common PostgreSQL connection string parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `Host` | Server hostname or IP | `localhost`, `db.example.com` |
| `Port` | Server port | `5432` |
| `Database` | Database name | `mydb` |
| `Username` | Login username | `myuser` |
| `Password` | Login password | `mypassword` |
| `SSL Mode` | SSL connection mode | `Require`, `Prefer`, `Disable` |
| `Pooling` | Enable connection pooling | `true`, `false` |
| `Minimum Pool Size` | Minimum connections in pool | `0` |
| `Maximum Pool Size` | Maximum connections in pool | `100` |
| `Connection Idle Lifetime` | Seconds before idle connection is closed | `300` |
| `Connection Lifetime` | Maximum connection lifetime in seconds | `0` (unlimited) |
| `Timeout` | Connection timeout in seconds | `15` |

For a complete list, see the [Npgsql Connection String Parameters](https://www.npgsql.org/doc/connection-string-parameters.html).

## Connection Settings

The `ConnectionSettings` section controls connection behavior, testing, and retry logic.

```json
{
  "ConnectionSettings": {
    "SetApplicationNameInConnection": true,
    "UseJsonApplicationName": false,
    "TestConnectionStrings": true,
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [1, 3, 6, 12],
      "ErrorCodes": ["08000", "08003", "08006", "08001", "08004", "55P03", "55006", "53300", "57P03", "40001"]
    },
    "MetadataQueryConnectionName": null,
    "MetadataQuerySchema": null,
    "MultiHostConnectionTargets": {
      "Default": "Any",
      "ByConnectionName": {}
    }
  }
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `SetApplicationNameInConnection` | bool | `true` | Sets the `ApplicationName` connection property to the configured application name. |
| `UseJsonApplicationName` | bool | `false` | Dynamically sets a JSON-formatted application name per request (see below). Note: Limited to 64 characters. |
| `TestConnectionStrings` | bool | `true` | Validates each connection by opening and closing it during startup. |
| `MetadataQueryConnectionName` | string | `null` | Connection name used for metadata queries. Uses default connection if null. |
| `MetadataQuerySchema` | string | `null` | Set the search path to this schema before executing the metadata query function. When `null` (default), no search path is set and the server's default search path is used. Useful when using non-superuser roles with limited schema access. |
| `MultiHostConnectionTargets` | object | *(see below)* | Configuration for multi-host connection failover and load balancing. |

### Application Name in Connection

When `SetApplicationNameInConnection` is `true`, the configured `ApplicationName` is included in the database connection. This helps identify connections in PostgreSQL monitoring tools like `pg_stat_activity`.

### JSON Application Name

When `UseJsonApplicationName` is `true`, the `ApplicationName` connection property is set dynamically on every request in the following JSON format:

```json
{"app": "MyApi", "uid": "user123", "id": "abc-123"}
```

| Field | Description |
|-------|-------------|
| `app` | Application name from configuration |
| `uid` | User ID for authenticated users, or `null` for anonymous requests |
| `id` | Value of the execution request header, or `null` if not provided |

The execution request header name can be configured in the `NpgsqlRest` section under`ExecutionIdHeaderName` (default is `X-NpgsqlRest-ID`). See [NpgsqlRest Request Headers](./npgsqlrest.html#request-headers) for details.

This provides detailed per-request tracking in PostgreSQL's `pg_stat_activity`.

::: warning
The `ApplicationName` connection property is limited to 64 characters. Longer values will be truncated.
:::

### Connection Testing

When `TestConnectionStrings` is `true` (default), NpgsqlRest validates all configured connections at startup by opening and closing each one. This ensures:

- Connection strings are valid
- Database servers are reachable
- Credentials are correct

If any connection fails, the application will not start.

## Retry Options

The `RetryOptions` section configures automatic retry behavior for transient connection failures.

```json
{
  "ConnectionSettings": {
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [1, 3, 6, 12],
      "ErrorCodes": ["08000", "08003", "08006", "08001", "08004", "55P03", "55006", "53300", "57P03", "40001"]
    }
  }
}
```

### Retry Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Enable automatic retry for connection failures. |
| `RetrySequenceSeconds` | number[] | `[1, 3, 6, 12]` | Wait intervals (in seconds) between retry attempts. Supports decimals like `0.25`. |
| `ErrorCodes` | string[] | *(see below)* | PostgreSQL error codes that trigger automatic retries. |

### Default Error Codes

The default error codes cover common transient failures:

| Code | Class | Description |
|------|-------|-------------|
| `08000` | Connection Exception | General connection error |
| `08001` | SQL Client Unable to Establish Connection | Client cannot connect |
| `08003` | Connection Does Not Exist | Connection lost |
| `08004` | SQL Server Rejected Connection | Server rejected connection |
| `08006` | Connection Failure | Connection failed |
| `55006` | Object In Use | Database object is in use |
| `55P03` | Lock Not Available | Cannot acquire lock |
| `53300` | Too Many Connections | Connection limit reached |
| `57P03` | Cannot Connect Now | Server starting up |
| `40001` | Serialization Failure | Transaction serialization conflict |

### Custom Retry Configuration

For high-availability scenarios, you might want more aggressive retries:

```json
{
  "ConnectionSettings": {
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [0.5, 1, 2, 4, 8, 16, 32],
      "ErrorCodes": ["08000", "08003", "08006", "57P03"]
    }
  }
}
```

## Multi-Host Connection Support

NpgsqlRest supports PostgreSQL multi-host connections with failover and load balancing capabilities using Npgsql's `NpgsqlMultiHostDataSource`.

### Multi-Host Connection Strings

Connection strings with comma-separated hosts are automatically detected as multi-host connections:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com,replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret"
  }
}
```

### Target Session Attributes

Configure which server type to target for each connection:

```json
{
  "ConnectionSettings": {
    "MultiHostConnectionTargets": {
      "Default": "Any",
      "ByConnectionName": {
        "readonly": "Standby",
        "primary": "Primary"
      }
    }
  }
}
```

| Value | Description |
|-------|-------------|
| `Any` | Any successful connection is acceptable (default) |
| `Primary` | Server must not be in hot standby mode |
| `Standby` | Server must be in hot standby mode |
| `PreferPrimary` | Try primary first, fall back to any |
| `PreferStandby` | Try standby first, fall back to any |
| `ReadWrite` | Session must accept read-write transactions |
| `ReadOnly` | Session must not accept read-write transactions |

See [Npgsql Failover and Load Balancing](https://www.npgsql.org/doc/failover-and-load-balancing.html) for more details.

### Multi-Host Example

Complete configuration for a primary-replica setup:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com,replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret",
    "ReadOnly": "Host=replica1.db.com,replica2.db.com,primary.db.com;Database=mydb;Username=app;Password=secret"
  },
  "ConnectionSettings": {
    "MultiHostConnectionTargets": {
      "Default": "PreferPrimary",
      "ByConnectionName": {
        "ReadOnly": "PreferStandby"
      }
    }
  }
}
```

## NpgsqlRest Connection Options

The `NpgsqlRest` section contains additional connection-related settings that control how routines interact with database connections.

```json
{
  "NpgsqlRest": {
    "ConnectionName": null,
    "UseMultipleConnections": false
  }
}
```

### NpgsqlRest Connection Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ConnectionName` | string | `null` | Connection name from `ConnectionStrings` to use. Uses first available if `null`. |
| `UseMultipleConnections` | bool | `false` | Allow individual routines to specify alternative connections. |

### Using Multiple Connections

When `UseMultipleConnections` is `true`, individual PostgreSQL routines can specify which connection to use via comments. This is useful for:

- **Read replicas**: Route read-only queries to replicas
- **Sharding**: Route queries to different database shards
- **Resource isolation**: Separate heavy analytics queries from transactional workloads

Example PostgreSQL function using a specific connection:

```sql
create function get_report_data()
returns table(...)
language sql
begin atomic;
  select * from large_table;
end;

comment on function get_report_data() is '
HTTP GET /reports/data
@connection ReadReplica
';
```

## Complete Example

Here's a complete connection configuration for a production environment:

```json
{
  "ConnectionStrings": {
    "Default": "Host={PGHOST};Port={PGPORT};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD};SSL Mode=Require;Pooling=true;Maximum Pool Size=100",
    "ReadReplica": "Host={PGHOST_REPLICA};Port={PGPORT};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD};SSL Mode=Require;Pooling=true;Maximum Pool Size=50"
  },
  "ConnectionSettings": {
    "SetApplicationNameInConnection": true,
    "UseJsonApplicationName": false,
    "TestConnectionStrings": true,
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [0.5, 1, 2, 5, 10],
      "ErrorCodes": ["08000", "08003", "08006", "08001", "08004", "55P03", "55006", "53300", "57P03", "40001"]
    }
  },
  "NpgsqlRest": {
    "ConnectionName": null,
    "UseMultipleConnections": true
  }
}
```

## Related

- [connection annotation](../annotations/connection) - Use named database connection per endpoint
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [Authentication](./auth) - Set up authentication methods

## See Also

- [CONNECTION](/annotations/connection) - Use named connection per endpoint

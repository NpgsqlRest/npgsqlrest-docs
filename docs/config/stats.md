---
outline: [2, 3]
title: "PostgreSQL Stats"
titleTemplate: NpgsqlRest
description: "Configure PostgreSQL statistics endpoints for NpgsqlRest. Monitor routine performance, table statistics, index usage, and active database sessions."
head:
  - - meta
    - name: keywords
      content: npgsqlrest stats, postgresql statistics, pg_stat_user_functions, pg_stat_user_tables, pg_stat_activity, database monitoring
  - - meta
    - property: og:title
      content: "NpgsqlRest PostgreSQL Stats Configuration"
  - - meta
    - property: og:description
      content: "Configure PostgreSQL statistics endpoints for monitoring and debugging."
  - - meta
    - property: og:type
      content: article
---

# PostgreSQL Stats

::: tip New in 3.6.0
PostgreSQL Stats endpoints were added in version 3.6.0.
:::

Exposes PostgreSQL statistics through HTTP endpoints for monitoring and debugging. Provides access to `pg_stat_user_functions`, `pg_stat_user_tables`, `pg_stat_user_indexes`, and `pg_stat_activity`.

## Overview

```json
{
  "Stats": {
    "Enabled": false,
    "CacheDuration": "5 seconds",
    "RateLimiterPolicy": null,
    "ConnectionName": null,
    "RequireAuthorization": false,
    "AuthorizedRoles": [],
    "OutputFormat": "html",
    "SchemaSimilarTo": null,
    "RoutinesStatsPath": "/stats/routines",
    "TablesStatsPath": "/stats/tables",
    "IndexesStatsPath": "/stats/indexes",
    "ActivityPath": "/stats/activity"
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable PostgreSQL statistics endpoints. |
| `CacheDuration` | string | `"5 seconds"` | Cache stats responses for the specified duration. PostgreSQL interval format. Set to `null` to disable caching. |
| `RateLimiterPolicy` | string | `null` | Apply a rate limiter policy to stats endpoints. Specify a policy name from `RateLimiterOptions.Policies`. |
| `ConnectionName` | string | `null` | Use a specific named connection for stats queries. When `null`, uses the default connection. |
| `RequireAuthorization` | bool | `false` | Require authentication for stats endpoints. |
| `AuthorizedRoles` | array | `[]` | Restrict access to specific roles. Empty array allows any authenticated user (if `RequireAuthorization` is `true`). |
| `OutputFormat` | string | `"html"` | Output format: `"json"` or `"html"`. HTML format is Excel-compatible for easy copy-paste. Can be overridden per-request with the `?format=` query string parameter. |
| `SchemaSimilarTo` | string | `null` | Filter schemas using PostgreSQL `SIMILAR TO` pattern. |
| `RoutinesStatsPath` | string | `"/stats/routines"` | Path for routine (function/procedure) statistics. |
| `TablesStatsPath` | string | `"/stats/tables"` | Path for table statistics. |
| `IndexesStatsPath` | string | `"/stats/indexes"` | Path for index statistics. |
| `ActivityPath` | string | `"/stats/activity"` | Path for current database activity. |

## Available Endpoints

### Routines Stats (`/stats/routines`)

Returns data from `pg_stat_user_functions` including:
- Call counts
- Total execution time
- Self execution time

::: warning PostgreSQL Configuration Required
Routine statistics require `track_functions` to be enabled in PostgreSQL:

```sql
ALTER SYSTEM SET track_functions = 'all';
SELECT pg_reload_conf();
```

Or set `track_functions = 'all'` in `postgresql.conf` and restart/reload.
:::

### Tables Stats (`/stats/tables`)

Returns data from `pg_stat_user_tables` including:
- Tuple counts (live, dead, inserted, updated, deleted)
- Table sizes
- Sequential and index scan counts
- Last vacuum and analyze timestamps

### Indexes Stats (`/stats/indexes`)

Returns data from `pg_stat_user_indexes` including:
- Index scan counts
- Tuples read and fetched
- Index definitions
- Index sizes

### Activity (`/stats/activity`)

Returns data from `pg_stat_activity` showing:
- Active sessions
- Currently running queries
- Wait events
- Session state and duration

::: danger Security Warning
The activity endpoint shows currently running queries which may contain sensitive data (passwords in plaintext queries, personal information, etc.). Always enable `RequireAuthorization` in production.
:::

## Output Formats

### HTML Format (Default)

```json
{
  "Stats": {
    "Enabled": true,
    "OutputFormat": "html"
  }
}
```

Returns an HTML table that is Excel-compatible for direct browser copy-paste. Ideal for quick debugging and analysis.

### JSON Format

```json
{
  "Stats": {
    "Enabled": true,
    "OutputFormat": "json"
  }
}
```

Returns a JSON array suitable for programmatic access and integration with monitoring tools.

### Per-Request Format Override

::: tip New in 3.8.0
The `format` query string override was added in version 3.8.0.
:::

The configured `OutputFormat` can be overridden per-request using the `format` query string parameter. Valid values are `html` and `json`:

```
GET /stats/routines?format=json
GET /stats/tables?format=html
```

This allows a single stats deployment to serve both human-readable HTML and machine-readable JSON without changing the server configuration.

## Security

### Require Authentication

```json
{
  "Stats": {
    "Enabled": true,
    "RequireAuthorization": true
  }
}
```

Any authenticated user can access stats endpoints.

### Role-Based Access

```json
{
  "Stats": {
    "Enabled": true,
    "RequireAuthorization": true,
    "AuthorizedRoles": ["admin", "dba"]
  }
}
```

Only users with `admin` or `dba` roles can access stats endpoints.

::: tip
Stats endpoints can reveal sensitive information about your database including table sizes, query patterns, and active sessions. Always enable `RequireAuthorization` in production environments.
:::

## Caching

Cache responses to reduce database load:

```json
{
  "Stats": {
    "Enabled": true,
    "CacheDuration": "10 seconds"
  }
}
```

The value uses PostgreSQL interval format:
- `"5 seconds"` or `"5s"`
- `"1 minute"` or `"1min"`
- `"30s"`

Set to `null` to disable caching (queries the database on every request).

Query strings are ignored to prevent cache-busting.

## Rate Limiting

Apply a rate limiter policy to prevent abuse:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": {
      "stats-limit": {
        "PermitLimit": 10,
        "Window": "1 minute"
      }
    }
  },
  "Stats": {
    "Enabled": true,
    "RateLimiterPolicy": "stats-limit"
  }
}
```

## Schema Filtering

Filter statistics by schema using PostgreSQL `SIMILAR TO` pattern:

```json
{
  "Stats": {
    "Enabled": true,
    "SchemaSimilarTo": "public|myapp%"
  }
}
```

This example includes:
- The `public` schema
- Schemas starting with `myapp` (e.g., `myapp`, `myapp_v1`, `myapp_archive`)

When `null`, all schemas are included.

## Using a Different Connection

Query stats from a specific database or with different credentials:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary;Database=myapp;Username=app;...",
    "Stats": "Host=replica;Database=myapp;Username=readonly;..."
  },
  "Stats": {
    "Enabled": true,
    "ConnectionName": "Stats"
  }
}
```

Useful for:
- Using read-only credentials
- Querying a read replica
- Separating stats queries from application traffic

## Custom Paths

```json
{
  "Stats": {
    "Enabled": true,
    "RoutinesStatsPath": "/api/stats/functions",
    "TablesStatsPath": "/api/stats/tables",
    "IndexesStatsPath": "/api/stats/indexes",
    "ActivityPath": "/api/stats/sessions"
  }
}
```

## Example Configurations

### Development (Open Access)

```json
{
  "Stats": {
    "Enabled": true,
    "OutputFormat": "html"
  }
}
```

### Production (Secured)

```json
{
  "Stats": {
    "Enabled": true,
    "RequireAuthorization": true,
    "AuthorizedRoles": ["admin"],
    "CacheDuration": "30 seconds",
    "OutputFormat": "json"
  }
}
```

### Monitoring Integration

```json
{
  "Stats": {
    "Enabled": true,
    "RequireAuthorization": true,
    "AuthorizedRoles": ["monitoring"],
    "OutputFormat": "json",
    "CacheDuration": "10 seconds",
    "RateLimiterPolicy": "monitoring"
  }
}
```

### Limited Schema Access

```json
{
  "Stats": {
    "Enabled": true,
    "RequireAuthorization": true,
    "SchemaSimilarTo": "public|api%",
    "OutputFormat": "html"
  }
}
```

## Related

- [Rate Limiter](./rate-limiter) - Configure rate limiting policies
- [Authentication](./auth) - Configure authentication for secured access
- [Health Checks](./health-checks) - Health check endpoints

## Next Steps

- [Logging](./logging) - Configure logging for monitoring
- [Connection](./connection) - Database connection settings

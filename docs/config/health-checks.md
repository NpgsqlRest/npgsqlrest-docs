---
outline: [2, 3]
title: "Health Checks"
titleTemplate: NpgsqlRest
description: "Configure health check endpoints for NpgsqlRest. Kubernetes readiness and liveness probes, database connectivity checks, and monitoring integration."
head:
  - - meta
    - name: keywords
      content: npgsqlrest health checks, kubernetes probes, readiness probe, liveness probe, database health check, monitoring
  - - meta
    - property: og:title
      content: "NpgsqlRest Health Checks Configuration"
  - - meta
    - property: og:description
      content: "Configure health check endpoints for container orchestration and monitoring."
  - - meta
    - property: og:type
      content: article
---

# Health Checks

::: tip New in 3.6.0
Health Checks middleware was added in version 3.6.0.
:::

Health check endpoints for container orchestration (Kubernetes, Docker Swarm) and monitoring systems to determine if the application is running correctly.

## Overview

```json
{
  "HealthChecks": {
    "Enabled": false,
    "CacheDuration": "5 seconds",
    "Path": "/health",
    "ReadyPath": "/health/ready",
    "LivePath": "/health/live",
    "IncludeDatabaseCheck": true,
    "ConnectionName": null
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable health check endpoints. |
| `CacheDuration` | string | `"5 seconds"` | Cache health check responses for the specified duration. PostgreSQL interval format. Set to `null` to disable caching. |
| `Path` | string | `"/health"` | Path for the main health check endpoint that reports overall status. |
| `ReadyPath` | string | `"/health/ready"` | Path for the readiness probe endpoint. |
| `LivePath` | string | `"/health/live"` | Path for the liveness probe endpoint. |
| `IncludeDatabaseCheck` | bool | `true` | Include PostgreSQL database connectivity in health checks. |
| `ConnectionName` | string | `null` | Use a specific named connection for health checks. When `null`, uses the default connection. |

## Health Check Types

NpgsqlRest provides three types of health check endpoints:

### Main Health (`/health`)

Reports the overall health status by combining all checks.

**Response:**
- `200 OK` with `"Healthy"` or `"Degraded"` status
- `503 Service Unavailable` with `"Unhealthy"` status

### Readiness Probe (`/health/ready`)

Indicates whether the application is ready to receive traffic. Used by Kubernetes to know when a pod is ready to be added to the service load balancer.

**Includes:**
- Database connectivity check (when `IncludeDatabaseCheck` is `true`)

**Response:**
- `200 OK` if ready to accept traffic
- `503 Service Unavailable` if not ready (e.g., database unreachable)

### Liveness Probe (`/health/live`)

Indicates whether the application process is running. Used by Kubernetes to know when to restart a pod.

**Does NOT include:**
- Database checks (a slow database shouldn't trigger a container restart)

**Response:**
- `200 OK` if the application process is responding

## Cache Duration

Health check responses are cached server-side to prevent excessive database queries:

```json
{
  "HealthChecks": {
    "Enabled": true,
    "CacheDuration": "5 seconds"
  }
}
```

The value uses PostgreSQL interval format:
- `"5 seconds"` or `"5s"`
- `"1 minute"` or `"1min"`
- `"30s"`

Set to `null` to disable caching:

```json
{
  "HealthChecks": {
    "CacheDuration": null
  }
}
```

::: tip
Query strings are ignored to prevent cache-busting attacks.
:::

## Database Health Check

When `IncludeDatabaseCheck` is `true`, the readiness probe verifies PostgreSQL connectivity:

```json
{
  "HealthChecks": {
    "Enabled": true,
    "IncludeDatabaseCheck": true
  }
}
```

If the database is unreachable:
- `/health/ready` returns `503 Service Unavailable`
- `/health/live` still returns `200 OK` (the app is running, just can't reach the database)

### Using a Different Connection

Use a specific named connection for health checks:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary;Database=myapp;...",
    "HealthCheck": "Host=replica;Database=myapp;..."
  },
  "HealthChecks": {
    "Enabled": true,
    "ConnectionName": "HealthCheck"
  }
}
```

This is useful when you want to:
- Use a read-only connection for health checks
- Query a different database server
- Use credentials with limited permissions

## Kubernetes Integration

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: npgsqlrest-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: vbilopav/npgsqlrest:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3
```

### Probe Behavior

| Probe | Checks | Failure Action |
|-------|--------|----------------|
| Liveness | App process responding | Restart container |
| Readiness | App + Database | Remove from load balancer |

::: warning
Don't use `/health/ready` for liveness probes. A database outage would cause all pods to restart, making recovery harder.
:::

## Docker Compose Health Check

```yaml
services:
  api:
    image: vbilopav/npgsqlrest:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

## Custom Paths

Customize the health check paths:

```json
{
  "HealthChecks": {
    "Enabled": true,
    "Path": "/api/health",
    "ReadyPath": "/api/health/readiness",
    "LivePath": "/api/health/liveness"
  }
}
```

## Example Configurations

### Basic Configuration

```json
{
  "HealthChecks": {
    "Enabled": true
  }
}
```

Uses all defaults: database check enabled, 5-second cache, standard paths.

### Production with Caching

```json
{
  "HealthChecks": {
    "Enabled": true,
    "CacheDuration": "10 seconds",
    "IncludeDatabaseCheck": true
  }
}
```

### API Gateway Integration

```json
{
  "HealthChecks": {
    "Enabled": true,
    "Path": "/healthz",
    "ReadyPath": "/readyz",
    "LivePath": "/livez",
    "CacheDuration": "3 seconds"
  }
}
```

Uses Kubernetes-style paths (`/healthz`, `/readyz`, `/livez`).

### Without Database Check

```json
{
  "HealthChecks": {
    "Enabled": true,
    "IncludeDatabaseCheck": false
  }
}
```

All probes return healthy if the app process is responding. Useful if you have separate database monitoring.

## Response Format

Health check endpoints return plain text responses:

```
Healthy
```

Or:

```
Unhealthy
```

With corresponding HTTP status codes:
- `200 OK` - Healthy or Degraded
- `503 Service Unavailable` - Unhealthy

## Related

- [Connection](./connection) - Database connection settings
- [Logging](./logging) - Log health check requests
- [Microsoft Documentation](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks) - ASP.NET Core health checks

## Next Steps

- [Stats](./stats) - PostgreSQL statistics endpoints
- [Forwarded Headers](./forwarded-headers) - Configure proxy header handling

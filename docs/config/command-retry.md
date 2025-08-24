---
outline: [2, 3]
title: "Command Retry Configuration"
titleTemplate: NpgsqlRest
description: "Configure automatic retry for transient PostgreSQL errors. Retry strategies, error codes, backoff sequences for resilient database operations."
head:
  - - meta
    - name: keywords
      content: npgsqlrest retry, postgresql error retry, transient error handling, database resilience, connection retry api
  - - meta
    - property: og:title
      content: "NpgsqlRest Command Retry Configuration"
  - - meta
    - property: og:description
      content: "Configure automatic retry strategies for transient PostgreSQL database errors."
  - - meta
    - property: og:type
      content: article
---

# Command Retry

Command retry strategies and options for handling transient database errors.

## Overview

```json
{
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 1, 2, 5, 10],
        "ErrorCodes": [
          "40001", "40P01",
          "08000", "08003", "08006", "08001", "08004", "08007", "08P01",
          "53000", "53100", "53200", "53300", "53400",
          "57P01", "57P02", "57P03", "58000", "58030",
          "55P03", "55006", "55000"
        ]
      }
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Enable command retry functionality. |
| `DefaultStrategy` | string | `"default"` | Name of the default retry strategy to use when no strategy is specified. |
| `Strategies` | object | *(see below)* | Named retry strategies with their configurations. |

Strategies can be assigned to endpoints using the [retry_strategy](../annotations/retry-strategy) annotation.

## Strategy Settings

Each strategy has the following settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RetrySequenceSeconds` | array | `[0, 1, 2, 5, 10]` | Retry delays in seconds. Array length determines maximum retries. |
| `ErrorCodes` | array | *(see below)* | PostgreSQL error codes that trigger retries. |

### Retry Sequence

The `RetrySequenceSeconds` array defines delay between retries:

```json
{
  "RetrySequenceSeconds": [0, 1, 2, 5, 10]
}
```

- First retry: immediate (0 seconds)
- Second retry: after 1 second
- Third retry: after 2 seconds
- Fourth retry: after 5 seconds
- Fifth retry: after 10 seconds

Accepts decimal values (e.g., `0.25` for 250ms, `0.5` for 500ms).

## Default Error Codes

The default strategy retries on these PostgreSQL error codes:

### Serialization Failures

| Code | Name | Description |
|------|------|-------------|
| `40001` | serialization_failure | Must retry for correctness |
| `40P01` | deadlock_detected | Deadlock resolved by aborting transaction |

### Connection Issues (Class 08)

| Code | Name |
|------|------|
| `08000` | connection_exception |
| `08003` | connection_does_not_exist |
| `08006` | connection_failure |
| `08001` | sqlclient_unable_to_establish_sqlconnection |
| `08004` | sqlserver_rejected_establishment_of_sqlconnection |
| `08007` | transaction_resolution_unknown |
| `08P01` | protocol_violation |

### Resource Constraints (Class 53)

| Code | Name |
|------|------|
| `53000` | insufficient_resources |
| `53100` | disk_full |
| `53200` | out_of_memory |
| `53300` | too_many_connections |
| `53400` | configuration_limit_exceeded |

### System Errors (Class 57/58)

| Code | Name |
|------|------|
| `57P01` | admin_shutdown |
| `57P02` | crash_shutdown |
| `57P03` | cannot_connect_now |
| `58000` | system_error |
| `58030` | io_error |

### Lock Acquisition Issues (Class 55)

| Code | Name |
|------|------|
| `55P03` | lock_not_available |
| `55006` | object_in_use |
| `55000` | object_not_in_prerequisite_state |

See [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) for the complete list.

## Multiple Strategies

Define multiple strategies for different use cases:

```json
{
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 1, 2, 5, 10],
        "ErrorCodes": ["40001", "40P01", "08000", "08003", "08006"]
      },
      "aggressive": {
        "RetrySequenceSeconds": [0, 0.5, 1, 2, 5, 10, 30],
        "ErrorCodes": ["40001", "40P01", "08000", "08003", "08006", "53300", "57P03"]
      },
      "minimal": {
        "RetrySequenceSeconds": [0, 1],
        "ErrorCodes": ["40001", "40P01"]
      }
    }
  }
}
```

## Example Configuration

Production configuration with extended retries:

```json
{
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 0.5, 1, 2, 5, 10, 30],
        "ErrorCodes": [
          "40001", "40P01",
          "08000", "08003", "08006", "08001", "08004",
          "53300", "57P03"
        ]
      }
    }
  }
}
```

## Using Strategies in Annotations

Assign strategies to specific endpoints using the [retry_strategy](../annotations/retry-strategy) annotation:

```sql
-- Use aggressive retry for critical operations
comment on function process_payment() is
'HTTP POST
@retry aggressive';

-- Use minimal retry for fast queries
comment on function quick_lookup() is
'HTTP GET
@retry minimal';

-- Use default strategy explicitly
comment on function standard_operation() is
'HTTP POST
@retry_strategy default';
```

## Related

- [retry_strategy annotation](../annotations/retry-strategy) - Assign retry strategies to endpoints
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Connection Settings](./connection) - Configure database connections and connection retry options
- [Logging](./logging) - Configure logging to monitor retries

## See Also

- [RETRY_STRATEGY](/annotations/retry-strategy) - Assign retry strategy per endpoint

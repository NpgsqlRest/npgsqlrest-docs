---
outline: [2, 3]
title: "RETRY_STRATEGY Annotation"
titleTemplate: NpgsqlRest
description: "Assign retry strategies for handling transient PostgreSQL database failures. Configure automatic retries per endpoint."
head:
  - - meta
    - name: keywords
      content: npgsqlrest retry strategy, transient error retry, database failure handling, automatic retry api
  - - meta
    - property: og:title
      content: "NpgsqlRest RETRY_STRATEGY Annotation"
  - - meta
    - property: og:description
      content: "Assign retry strategies for handling transient database failures."
  - - meta
    - property: og:type
      content: article
---

# RETRY_STRATEGY

::: info Also known as
`retry_strategy`, `retry` (with or without `@` prefix)
:::

Assign a named retry strategy for handling transient database failures.

## Syntax

```
@retry_strategy <strategy-name>
@retry <strategy-name>
```

Or using custom parameter syntax:

```
@retry_strategy = <strategy-name>
@retry = <strategy-name>
```

The `strategy-name` must match a strategy defined in [CommandRetryOptions](../config/command-retry) configuration.

## Examples

### Use Default Strategy

```sql
comment on function critical_operation() is
'HTTP POST
@retry_strategy default';
```

### Use Named Strategy

```sql
comment on function important_query() is
'HTTP GET
@retry aggressive';
```

### Combined with Timeout

```sql
comment on function long_running_task() is
'HTTP POST
@timeout 2min
@retry_strategy default';
```

## Behavior

- References a retry strategy defined in `CommandRetryOptions.Strategies` configuration.
- Automatically retries on transient failures when PostgreSQL returns error codes defined in the strategy.
- Strategy defines:
  - **Retry count**: Number of elements in `RetrySequenceSeconds` array
  - **Retry delays**: Wait time between retries in seconds
  - **Error codes**: PostgreSQL error codes that trigger retries

## Common Retry Scenarios

| Error Type | PostgreSQL Codes | Description |
|------------|------------------|-------------|
| Serialization | `40001`, `40P01` | Transaction conflicts, deadlocks |
| Connection | `08000`, `08003`, `08006` | Connection issues |
| Resources | `53300` | Too many connections |
| System | `57P03` | Cannot connect now |

## Configuration Example

Define strategies in configuration:

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

Then use in annotations:

```sql
-- Use aggressive retry for critical operations
comment on function process_payment() is
'HTTP POST
@retry aggressive';

-- Use minimal retry for fast queries
comment on function quick_lookup() is
'HTTP GET
@retry minimal';
```

See [Command Retry](../config/command-retry) for complete configuration reference.

## Related

- [Command Retry configuration](../config/command-retry) - Define retry strategies
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [COMMAND_TIMEOUT](./command-timeout) - Set query timeout
- [ERROR_CODE_POLICY](./error-code-policy) - Custom error code handling

## See Also

- [Command Retry](/config/command-retry) - Configure retry strategies

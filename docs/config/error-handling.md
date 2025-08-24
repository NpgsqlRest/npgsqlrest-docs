---
outline: [2, 3]
title: "Error Handling Configuration"
titleTemplate: NpgsqlRest
description: "Configure error handling in NpgsqlRest. Map PostgreSQL error codes to HTTP status codes, customize error messages, and control error response format."
head:
  - - meta
    - name: keywords
      content: npgsqlrest error handling, postgresql error codes, api error mapping, http error responses, postgresql exception handling
  - - meta
    - property: og:title
      content: "NpgsqlRest Error Handling Configuration"
  - - meta
    - property: og:description
      content: "Map PostgreSQL error codes to HTTP status codes and customize error responses."
  - - meta
    - property: og:type
      content: article
---

# Error Handling

Error handling configuration for mapping PostgreSQL errors to HTTP responses.

## Overview

```json
{
  "ErrorHandlingOptions": {
    "RemoveTypeUrl": false,
    "RemoveTraceId": true,
    "DefaultErrorCodePolicy": "Default",
    "TimeoutErrorMapping": {
      "StatusCode": 504,
      "Title": "Command execution timed out",
      "Details": null,
      "Type": null
    },
    "ErrorCodePolicies": [
      {
        "Name": "Default",
        "ErrorCodes": {
          "42501": {"StatusCode": 403, "Title": "Insufficient Privilege", "Details": null, "Type": null},
          "57014": {"StatusCode": 205, "Title": "Cancelled", "Details": null, "Type": null},
          "P0001": {"StatusCode": 400, "Title": null, "Details": null, "Type": null},
          "P0004": {"StatusCode": 400, "Title": null, "Details": null, "Type": null}
        }
      }
    ]
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RemoveTypeUrl` | bool | `false` | Remove Type URL from error responses. Default Type URL points to RFC documentation based on HTTP status code. |
| `RemoveTraceId` | bool | `true` | Remove TraceId field from error responses. TraceId is useful for correlating logs with errors. |
| `DefaultErrorCodePolicy` | string | `"Default"` | Name of the default error code policy to use. |
| `TimeoutErrorMapping` | object | *(see below)* | Error mapping for command timeout errors. |
| `ErrorCodePolicies` | array | *(see below)* | Named policies for mapping PostgreSQL error codes to HTTP responses. Assign a policy to an endpoint using the [error_code_policy](../annotations/error-code-policy) annotation. |

## Error Mapping Object

Each error mapping has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `StatusCode` | int | HTTP status code to return. |
| `Title` | string | Title field in response JSON. When `null`, the actual PostgreSQL error message is used. |
| `Details` | string | Details field in response JSON. When `null`, the PostgreSQL error code is used. |
| `Type` | string | URI reference (RFC3986) identifying the problem type. When `null`, uses default. Set `RemoveTypeUrl` to `true` to disable. |

## Timeout Error Mapping

Configure the response when a command timeout occurs:

```json
{
  "ErrorHandlingOptions": {
    "TimeoutErrorMapping": {
      "StatusCode": 504,
      "Title": "Command execution timed out",
      "Details": null,
      "Type": null
    }
  }
}
```

This maps command timeouts to HTTP 504 Gateway Timeout. Timeouts occur when a query exceeds:
- The global `NpgsqlRest.CommandTimeout` setting, or
- The per-endpoint [command_timeout](../annotations/command-timeout) annotation

## Error Code Policies

Define named policies for mapping PostgreSQL error codes to HTTP responses:

```json
{
  "ErrorHandlingOptions": {
    "DefaultErrorCodePolicy": "Default",
    "ErrorCodePolicies": [
      {
        "Name": "Default",
        "ErrorCodes": {
          "42501": {"StatusCode": 403, "Title": "Insufficient Privilege", "Details": null, "Type": null},
          "57014": {"StatusCode": 205, "Title": "Cancelled", "Details": null, "Type": null},
          "P0001": {"StatusCode": 400, "Title": null, "Details": null, "Type": null},
          "P0004": {"StatusCode": 400, "Title": null, "Details": null, "Type": null}
        }
      }
    ]
  }
}
```

### Default Error Code Mappings

| PostgreSQL Code | Name | HTTP Status | Description |
|-----------------|------|-------------|-------------|
| `42501` | insufficient_privilege | 403 Forbidden | User lacks required permissions |
| `57014` | query_canceled | 205 Reset Content | Query was cancelled |
| `P0001` | raise_exception | 400 Bad Request | Explicit RAISE EXCEPTION in function |
| `P0004` | assert_failure | 400 Bad Request | Assert statement failed |

See [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) for the complete list.

## Response Fields

### Type URL

When `RemoveTypeUrl` is `false` (default), error responses include a Type URL pointing to RFC documentation:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400
}
```

### TraceId

When `RemoveTraceId` is `false`, error responses include a TraceId for log correlation:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "traceId": "00-abc123..."
}
```

## Example Configuration

Production configuration with custom error mappings:

```json
{
  "ErrorHandlingOptions": {
    "RemoveTypeUrl": false,
    "RemoveTraceId": true,
    "DefaultErrorCodePolicy": "Default",
    "TimeoutErrorMapping": {
      "StatusCode": 504,
      "Title": "Request timed out",
      "Details": "The database operation took too long to complete.",
      "Type": null
    },
    "ErrorCodePolicies": [
      {
        "Name": "Default",
        "ErrorCodes": {
          "42501": {"StatusCode": 403, "Title": "Insufficient Privilege", "Details": null, "Type": null},
          "57014": {"StatusCode": 205, "Title": "Cancelled", "Details": null, "Type": null},
          "P0001": {"StatusCode": 400, "Title": null, "Details": null, "Type": null},
          "P0004": {"StatusCode": 400, "Title": null, "Details": null, "Type": null},
          "23505": {"StatusCode": 409, "Title": "Conflict", "Details": "A record with this key already exists.", "Type": null},
          "23503": {"StatusCode": 400, "Title": "Invalid Reference", "Details": "Referenced record does not exist.", "Type": null}
        }
      }
    ]
  }
}
```

Development configuration with TraceId for debugging:

```json
{
  "ErrorHandlingOptions": {
    "RemoveTypeUrl": false,
    "RemoveTraceId": false,
    "DefaultErrorCodePolicy": "Default"
  }
}
```

## Related

- [error_code_policy annotation](../annotations/error-code-policy) - Apply error handling policy to endpoints
- [command_timeout annotation](../annotations/command-timeout) - Set query timeout per endpoint
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Logging](./logging) - Configure logging for error tracking
- [NpgsqlRest Options](./npgsqlrest) - Configure command timeout settings

## See Also

- [ERROR_CODE_POLICY](/annotations/error-code-policy) - Apply error handling policy per endpoint

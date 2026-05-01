---
outline: [2, 3]
title: "NpgsqlRest Options"
titleTemplate: NpgsqlRest
description: "Configure NpgsqlRest middleware options. Schema filtering, endpoint generation, URL patterns, request handling, and response formatting settings."
head:
  - - meta
    - name: keywords
      content: npgsqlrest options, postgresql middleware config, api endpoint generation, schema filtering, url pattern configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Options"
  - - meta
    - property: og:description
      content: "Configure NpgsqlRest middleware for endpoint generation, schema filtering, and request handling."
  - - meta
    - property: og:type
      content: article
---

# NpgsqlRest Options

NpgsqlRest HTTP middleware general configuration for endpoint generation and request handling.

## Overview

```json
{
  "NpgsqlRest": {
    "ConnectionName": null,
    "UseMultipleConnections": false,
    "CommandTimeout": null,
    "SchemaSimilarTo": null,
    "SchemaNotSimilarTo": null,
    "IncludeSchemas": null,
    "ExcludeSchemas": null,
    "NameSimilarTo": null,
    "NameNotSimilarTo": null,
    "IncludeNames": null,
    "ExcludeNames": null,
    "CommentsMode": "OnlyWithHttpTag",
    "UrlPathPrefix": "/api",
    "KebabCaseUrls": true,
    "CamelCaseNames": true,
    "RequiresAuthorization": true,
    "LogConnectionNoticeEvents": true,
    "LogConnectionNoticeEventsMode": "FirstStackFrameAndMessage",
    "LogCommands": false,
    "LogCommandParameters": false,
    "DefaultHttpMethod": null,
    "DefaultRequestParamType": null,
    "RequestHeadersMode": "Parameter",
    "RequestHeadersContextKey": "request.headers",
    "RequestHeadersParameterName": "_headers",
    "InstanceIdRequestHeaderName": null,
    "CustomRequestHeaders": {},
    "ExecutionIdHeaderName": "X-NpgsqlRest-ID",
    "QueryStringNullHandling": "Ignore",
    "TextResponseNullHandling": "EmptyString",
    "DefaultServerSentEventsEventNoticeLevel": "INFO",
    "ServerSentEventsResponseHeaders": {},
    "RoutineOptions": { ... },
    "AuthenticationOptions": { ... },
    "SqlFileSource": { ... },
    "UploadOptions": { ... },
    "ClientCodeGen": { ... },
    "HttpFileOptions": { ... },
    "OpenApiOptions": { ... }
  }
}
```

See related configuration pages:

- [Routine Options](./routine-options) for `RoutineOptions` configuration
- [Authentication Options](./authentication-options) for `AuthenticationOptions` configuration
- [SQL File Source](./sql-file-source) for `SqlFileSource` configuration
- [Upload Options](./uploads) for `UploadOptions` configuration
- [Code Generation](./codegen) for `ClientCodeGen` configuration
- [HTTP Files](./http-files) for `HttpFileOptions` configuration
- [OpenAPI Options](./openapi) for `OpenApiOptions` configuration

## Connection Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ConnectionName` | string | `null` | Connection name from `ConnectionStrings` section. Uses first available if `null`. |
| `UseMultipleConnections` | bool | `false` | Allow individual routines to use different connections from `ConnectionStrings`. |
| `CommandTimeout` | string | `null` | Command timeout using [interval format](../annotations/interval-format) (e.g., `"30s"`, `"1m"`). Uses default 30 seconds if `null`. Can be overridden per endpoint with [command_timeout](../annotations/command-timeout) annotation. |

## Schema and Name Filtering

Filter which PostgreSQL routines are exposed as endpoints.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `SchemaSimilarTo` | string | `null` | Include schemas matching this SQL SIMILAR TO pattern. |
| `SchemaNotSimilarTo` | string | `null` | Exclude schemas matching this SQL SIMILAR TO pattern. |
| `IncludeSchemas` | array | `null` | List of schema names to include. |
| `ExcludeSchemas` | array | `null` | List of schema names to exclude. |
| `NameSimilarTo` | string | `null` | Include routine names matching this SQL SIMILAR TO pattern. |
| `NameNotSimilarTo` | string | `null` | Exclude routine names matching this SQL SIMILAR TO pattern. |
| `IncludeNames` | array | `null` | List of routine names to include. |
| `ExcludeNames` | array | `null` | List of routine names to exclude. |

### Filtering Examples

Include only specific schemas:

```json
{
  "NpgsqlRest": {
    "IncludeSchemas": ["api", "public"]
  }
}
```

Exclude internal schemas:

```json
{
  "NpgsqlRest": {
    "ExcludeSchemas": ["pg_catalog", "information_schema", "internal"]
  }
}
```

Filter by name pattern:

```json
{
  "NpgsqlRest": {
    "NameSimilarTo": "api_%",
    "NameNotSimilarTo": "%_internal"
  }
}
```

## Comments Mode

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `CommentsMode` | string | `"OnlyWithHttpTag"` | How comment annotations affect endpoint creation. |

Available modes:

| Mode | Description |
|------|-------------|
| `Ignore` | Create all endpoints, ignore comment annotations. |
| `ParseAll` | Create all endpoints, parse comment annotations to modify them. |
| `OnlyWithHttpTag` | Only create endpoints for routines with [HTTP](../annotations/http) annotation in comments (default). |

With the default `OnlyWithHttpTag` mode, routines without the `HTTP` annotation in their comment will not be exposed as endpoints. This provides explicit control over which database routines are accessible via the API.

## URL and Naming

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `UrlPathPrefix` | string | `"/api"` | URL prefix for all generated endpoints. |
| `KebabCaseUrls` | bool | `true` | Convert URL paths to kebab-case from PostgreSQL names. |
| `CamelCaseNames` | bool | `true` | Convert parameter names to camelCase from PostgreSQL names. |

### URL Examples

With default settings, `get_user_profile` becomes `/api/get-user-profile`.

```json
{
  "NpgsqlRest": {
    "UrlPathPrefix": "/v1/api",
    "KebabCaseUrls": true
  }
}
```

## Authorization

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RequiresAuthorization` | bool | `true` | Force all endpoints to require authorization. Can be overridden per endpoint via comment annotations. |

## Logging

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `LogConnectionNoticeEvents` | bool | `true` | Log PostgreSQL connection events (triggered by RAISE statements). |
| `LogConnectionNoticeEventsMode` | string | `"FirstStackFrameAndMessage"` | How to format notice event logs. |
| `LogCommands` | bool | `false` | Log every executed command and query at debug level. |
| `LogCommandParameters` | bool | `false` | Include parameter values in command logs. Only applies when `LogCommands` is `true`. |

### Notice Event Modes

| Mode | Description |
|------|-------------|
| `MessageOnly` | Log only the message. |
| `FirstStackFrameAndMessage` | Log first stack frame and message (default). |
| `FullStackAndMessage` | Log full stack trace and message. |

## HTTP Method and Parameters

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DefaultHttpMethod` | string | `null` | Force HTTP method for all endpoints (`GET`, `POST`, `PUT`, `DELETE`, etc.). |
| `DefaultRequestParamType` | string | `null` | Force parameter location for all endpoints (`QueryString` or `BodyJson`). |

### Default Behavior

When `DefaultHttpMethod` is `null`:
- `GET` is used when routine is not volatile, or name starts with `get_`, contains `_get_`, or ends with `_get`
- `POST` is used otherwise

When `DefaultRequestParamType` is `null`:
- `QueryString` for `GET` and `DELETE` endpoints
- `BodyJson` for all other methods

## Request Headers

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RequestHeadersMode` | string | `"Parameter"` | How to send request headers to PostgreSQL routines. |
| `RequestHeadersContextKey` | string | `"request.headers"` | Context variable name when mode is `Context`. |
| `RequestHeadersParameterName` | string | `"_headers"` | Parameter name when mode is `Parameter`. |
| `CustomRequestHeaders` | object | `{}` | Custom headers added to requests before sending to PostgreSQL. |
| `InstanceIdRequestHeaderName` | string | `null` | Header name for NpgsqlRest instance ID. Set to `null` to disable. |
| `ExecutionIdHeaderName` | string | `"X-NpgsqlRest-ID"` | Execution request header name. Used for request tracking and SSE correlation and in [`ConnectionSettings.UseJsonApplicationName`](./connection.html#json-application-name). |

### Request Headers Modes

| Mode | Description |
|------|-------------|
| `Ignore` | Don't send request headers to routines. |
| `Context` | Set context variable `context.headers` with JSON string via `set_config()`. |
| `Parameter` | Send headers to parameter named by `RequestHeadersParameterName`. Parameter must be JSON/text type with default value. |

## Connection Pooler Compatibility

::: tip New in 3.13.0
`WrapInTransaction` and `BeforeRoutineCommands` options for connection pooler compatibility and pre-routine SQL commands.
:::

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `WrapInTransaction` | bool | `false` | When `true`, **every request** is wrapped in an explicit `BEGIN ... COMMIT`, and all `set_config` calls switch from session-scoped (`is_local=false`) to transaction-local (`is_local=true`). |
| `BeforeRoutineCommands` | array | `[]` | SQL commands executed after any context is set but before the main routine call. Run in the same batch as the context `set_config` calls (no extra round-trip). |

### WrapInTransaction

This is required for connection poolers in transaction mode — including PgBouncer transaction-pool, AWS RDS Proxy in transaction mode, and Supabase Pooler. Previously, `set_config(name, value, false)` would set the GUC at the session level on the underlying PostgreSQL backend. With a transaction-mode pooler, the same backend is reused for unrelated client requests, which means session-scoped GUCs from one request could be visible to the next. With `WrapInTransaction = true`, GUCs are scoped to the request transaction and discarded on `COMMIT`.

The default remains `false` to preserve existing behavior; it is safe to leave off when using Npgsql's native pool only (which issues `DISCARD ALL` on connection return).

```jsonc
{
  "NpgsqlRest": {
    "WrapInTransaction": true
  }
}
```

### BeforeRoutineCommands

Each entry can be either a raw SQL string (no parameters) or an object with `Sql` and `Parameters`. Each parameter has a `Source` (`Claim`, `RequestHeader`, or `IpAddress`) and an optional `Name` (claim type or header name). Parameter values are bound at request time from `HttpContext` — claim and header values are passed as parameterized SQL inputs (no string interpolation, no injection risk).

The most useful pattern is **multi-tenant `search_path` setup** driven by a JWT/cookie claim:

```jsonc
{
  "NpgsqlRest": {
    "WrapInTransaction": true,
    "BeforeRoutineCommands": [
      "select set_config('app.request_time', clock_timestamp()::text, true)",
      {
        "Sql": "select set_config('search_path', $1, true)",
        "Parameters": [{ "Source": "Claim", "Name": "tenant_id" }]
      }
    ]
  }
}
```

Per-request execution order with this config:

1. `BEGIN`
2. Each `BeforeRoutineCommand` is added as a `NpgsqlBatchCommand` (with parameters bound from claims/headers/IP) and dispatched in a single batch.
3. The main routine call.
4. `COMMIT`.

Steps 1–3 share a single network round-trip.

## NULL Handling

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `QueryStringNullHandling` | string | `"Ignore"` | How empty or "null" query string values are interpreted. |
| `TextResponseNullHandling` | string | `"EmptyString"` | How NULL database results are returned in plain text responses. |

### QueryStringNullHandling Values

| Value | Description |
|-------|-------------|
| `Ignore` | No special handling - empty strings stay as empty strings, "null" literal stays as "null" string (default). |
| `EmptyString` | Empty query string values are interpreted as NULL values. |
| `NullLiteral` | Literal string "null" (case insensitive) is interpreted as NULL value. |

### TextResponseNullHandling Values

| Value | Description |
|-------|-------------|
| `EmptyString` | Returns an empty string response with status code 200 OK (default). |
| `NullLiteral` | Returns a string literal "NULL" with status code 200 OK. |
| `NoContent` | Returns status code 204 NO CONTENT. |

These settings can be overridden per-endpoint using comment annotations:

```sql
comment on function my_func(text) is '
@query_string_null_handling empty_string
@text_response_null_handling no_content
';
```

## JSON Timestamp Handling

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `JsonTimestampsAreUtc` | bool | `true` | How JSON-encoded timestamps are interpreted when parsed into `timestamp`, `timestamptz`, `time`, and `timetz` parameters. |

When `true` (default, recommended):

- `Z`-suffixed and offset-bearing ISO strings (e.g. `"2026-05-20T06:00:00Z"`, `"2026-05-20T08:00:00+02:00"`) are converted to UTC.
- Naive ISO strings with no offset and no `Z` (e.g. `"2026-05-20T06:00:00"`) are **assumed UTC** rather than interpreted as the host's local time.

The result is host-TZ-independent: the same JSON payload produces the same stored value regardless of the `TZ` environment of the process serving the request.

When `false`, the parsers fall back to the pre-3.16.0 behavior:

- `Z` / offset-bearing strings are converted to the host's local time zone and tagged `Kind=Local`.
- Naive strings are parsed as `Kind=Unspecified`.
- The `timestamptz` / `timetz` parsers then re-apply `SpecifyKind(Utc)` on top of the local-shifted value — silently shifting the stored value by the host's UTC offset on non-UTC hosts.

::: warning Opt-out only — not recommended for new deployments
`JsonTimestampsAreUtc: false` exists as a compatibility escape hatch for callers that genuinely depend on the legacy "naive timestamps are host-local" behavior and cannot be updated to send `Z`-suffixed values. It reproduces the bug class fixed in 3.16.0. Leave at the default unless you have a specific legacy reason to flip it.
:::

Example:

```json
{
  "NpgsqlRest": {
    "JsonTimestampsAreUtc": true
  }
}
```

## Server-Sent Events

Configure Server-Sent Events (SSE) for real-time streaming of PostgreSQL `RAISE` statements to connected clients.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DefaultServerSentEventsEventNoticeLevel` | string | `"INFO"` | Default PostgreSQL notice level for SSE events. Valid values: `INFO`, `NOTICE`, `WARNING`. |
| `ServerSentEventsResponseHeaders` | object | `{}` | Custom headers added to SSE responses. |

### Notice Level Behavior

The `DefaultServerSentEventsEventNoticeLevel` setting determines which PostgreSQL `RAISE` statements generate SSE events **by default** when the level is not specified in the annotation.

::: warning Important
SSE events are sent **only for the exact level configured**, not for "this level and above". For example, if set to `NOTICE`, only `RAISE NOTICE` statements generate SSE events—`RAISE INFO` and `RAISE WARNING` are ignored.
:::

This default can be overridden per-endpoint using the [`@sse` annotation](../annotations/sse).

### Example Configuration

```json
{
  "NpgsqlRest": {
    "DefaultServerSentEventsEventNoticeLevel": "NOTICE",
    "ServerSentEventsResponseHeaders": {
      "X-Accel-Buffering": "no"
    }
  }
}
```

The `X-Accel-Buffering: no` header is commonly needed when running behind nginx to disable response buffering for SSE streams.

### Related

- [SSE Annotation](../annotations/sse) - Enable SSE streaming per endpoint
- [SSE_EVENTS_LEVEL Annotation](../annotations/sse-events-level) - Override notice level per endpoint
- [SSE_EVENTS_SCOPE Annotation](../annotations/sse-events-scope) - Control event distribution scope

## Complete Example

Production configuration:

```json
{
  "NpgsqlRest": {
    "ConnectionName": null,
    "UseMultipleConnections": true,
    "CommandTimeout": "30 seconds",
    "IncludeSchemas": ["api"],
    "ExcludeSchemas": ["internal"],
    "CommentsMode": "OnlyWithHttpTag",
    "UrlPathPrefix": "/api",
    "KebabCaseUrls": true,
    "CamelCaseNames": true,
    "RequiresAuthorization": true,
    "LogConnectionNoticeEvents": true,
    "LogConnectionNoticeEventsMode": "FirstStackFrameAndMessage",
    "LogCommands": false,
    "LogCommandParameters": false,
    "RequestHeadersMode": "Parameter",
    "RequestHeadersParameterName": "_headers",
    "ExecutionIdHeaderName": "X-NpgsqlRest-ID"
  }
}
```

Development configuration with verbose logging:

```json
{
  "NpgsqlRest": {
    "CommentsMode": "ParseAll",
    "RequiresAuthorization": false,
    "LogConnectionNoticeEvents": true,
    "LogConnectionNoticeEventsMode": "FullStackAndMessage",
    "LogCommands": true,
    "LogCommandParameters": true
  }
}
```

## Related

- [http annotation](../annotations/http) - Expose function as HTTP endpoint
- [path annotation](../annotations/path) - Set custom endpoint path
- [request_param_type annotation](../annotations/request-param-type) - Query string vs body parameters
- [request_headers_mode annotation](../annotations/request-headers-mode) - Control header passing
- [command_timeout annotation](../annotations/command-timeout) - Set query timeout
- [query_string_null_handling annotation](../annotations/query-string-null-handling) - NULL in query strings
- [response_null_handling annotation](../annotations/response-null-handling) - NULL in responses
- [sse annotation](../annotations/sse) - Enable Server-Sent Events
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Routine Options](./routine-options) - Configure routine handling options
- [Connection Settings](./connection) - Configure database connections
- [Code Generation](./codegen) - Configure code generation options
- [Error Handling](./error-handling) - Configure error responses

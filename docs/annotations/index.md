---
outline: [2, 3]
title: "Annotations Reference"
titleTemplate: NpgsqlRest
description: "Complete reference for all NpgsqlRest comment annotations. HTTP methods, authorization, caching, rate limiting, and more for PostgreSQL REST APIs."
head:
  - - meta
    - name: keywords
      content: npgsqlrest annotations, postgresql comment annotations, rest api annotations, http endpoint configuration, sql api annotations
  - - meta
    - property: og:title
      content: "NpgsqlRest Annotations Reference"
  - - meta
    - property: og:description
      content: "Complete reference for all NpgsqlRest comment annotations for PostgreSQL REST APIs."
  - - meta
    - property: og:type
      content: article
---

# Annotations Reference

Complete reference for all NpgsqlRest comment annotations. For an introduction to how annotations work, see the [Comment Annotations Guide](../guide/annotations).

## How to Use This Reference

Each annotation has its own page with:
- Recognized keywords
- Syntax explanation
- Working examples from the test suite
- Related annotations

## Annotation Categories

### HTTP & Routing

- [HTTP](./http) - Expose function as HTTP endpoint
- [PATH](./path) - Set custom endpoint path
- [PROXY](./proxy) - Mark endpoint as reverse proxy
- [PROXY_OUT](./proxy-out) - Execute function first, then forward result to upstream
- [ENABLED](./enabled) - Enable endpoint for specific tags
- [DISABLED](./disabled) - Disable endpoint for specific tags
- [TAGS](./tags) - Filter annotations by tags
- [HTTP CUSTOM TYPES](./http-type) - Define HTTP request on composite type for external API calls
- [INTERNAL](./internal) - Mark endpoint as internal-only (accessible via proxy/HTTP client types, not public HTTP)

### Authorization

- [AUTHORIZE](./authorize) - Require authentication
- [ALLOW_ANONYMOUS](./allow-anonymous) - Allow unauthenticated access
- [LOGIN](./login) - Mark as sign-in endpoint
- [LOGOUT](./logout) - Mark as sign-out endpoint

### Basic Authentication

- [BASIC_AUTH](./basic-auth) - Enable HTTP Basic Authentication
- [BASIC_AUTH_REALM](./basic-auth-realm) - Set authentication realm
- [BASIC_AUTH_COMMAND](./basic-auth-command) - Set validation function

### Request Configuration

- [REQUEST_PARAM_TYPE](./request-param-type) - Query string vs body parameters
- [REQUEST_HEADERS_MODE](./request-headers-mode) - Control header passing
- [REQUEST_HEADERS_PARAMETER_NAME](./request-headers-parameter-name) - Header parameter name
- [BODY_PARAMETER_NAME](./body-parameter-name) - Body parameter name
- [QUERY_STRING_NULL_HANDLING](./query-string-null-handling) - NULL handling in query strings
- [VALIDATE](./validate) - Parameter validation before database execution

### Response Configuration

- [Response Headers](./response-headers) - Set custom response headers
- [RESPONSE_NULL_HANDLING](./response-null-handling) - NULL handling in responses
- [NESTED](./nested) - Serialize composite type columns as nested JSON objects
- [SINGLE](./single) - Return a single record as a JSON object instead of an array

### Table Format Output

- [Custom Parameters](./custom-parameters#table-format-parameters) - `table_format`, `excel_file_name`, `excel_sheet` for HTML table and Excel rendering

### Raw Output Mode

- [RAW](./raw) - Return raw text instead of JSON
- [SEPARATOR](./separator) - Column separator for raw output
- [NEW_LINE](./new-line) - Row separator for raw output
- [COLUMN_NAMES](./column-names) - Include column headers

### Caching

- [CACHED](./cached) - Enable response caching
- [CACHE_EXPIRES_IN](./cache-expires-in) - Set cache expiration

### Performance

- [BUFFER_ROWS](./buffer-rows) - Row buffering count
- [COMMAND_TIMEOUT](./command-timeout) - Query timeout
- [RETRY_STRATEGY](./retry-strategy) - Retry behavior

### Format References

- [Interval Format](./interval-format) - Time/duration format for timeouts and cache expiration

### Server-Sent Events

- [SSE](./sse) - Enable Server-Sent Events
- [SSE_EVENTS_LEVEL](./sse-events-level) - Notice level for SSE
- [SSE_EVENTS_SCOPE](./sse-events-scope) - SSE distribution scope

### Upload

- [UPLOAD](./upload) - File upload handling

### Policies

- [ERROR_CODE_POLICY](./error-code-policy) - Error handling policy
- [RATE_LIMITER_POLICY](./rate-limiter-policy) - Rate limiting policy

### Context & Security

- [USER_CONTEXT](./user-context) - Enable user context
- [USER_PARAMETERS](./user-parameters) - Add user parameters
- [CONNECTION](./connection) - Named database connection
- [SECURITY_SENSITIVE](./security-sensitive) - Obfuscate logs

### Parameter Annotations

- [PARAM](./param) - Rename, retype, set defaults, and configure parameters
- [PARAMETER_HASH](./parameter-hash) - Hash one parameter using another
- [ENCRYPT](./encrypt-decrypt) - Encrypt parameter values before sending to PostgreSQL
- [DECRYPT](./encrypt-decrypt) - Decrypt result column values before returning to client

### SQL File Annotations

- [DEFINE_PARAM](./define-param) - Define virtual HTTP parameters not bound to SQL
- [RESULT_NAME](./result-name) - Rename result keys in multi-command SQL file endpoints
- [SKIP](./skip) - Exclude commands from multi-command results

### Custom

- [Custom Parameters](./custom-parameters) - Custom key-value settings

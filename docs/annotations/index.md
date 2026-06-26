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

::: info
All annotations work in both PostgreSQL function/procedure comments (`COMMENT ON FUNCTION ...`) and [SQL file endpoints](../guide/sql-files) (`--` and `/* */` comments in `.sql` files). The "SQL File Annotations" section below lists annotations that are specific to SQL files.
:::

::: tip Looking for a specific keyword?
Annotations often have aliases (`@timeout` → COMMAND_TIMEOUT, `@retry` → RETRY_STRATEGY, `@anon` → ALLOW_ANONYMOUS). See the [A–Z Index](#a-z-index) for every name and alias.
:::

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
- [ENABLED](./enabled) - Re-enable an endpoint after `@disabled`, optionally only for specific tags
- [DISABLED](./disabled) - Disable endpoint, optionally only for specific tags
- [TAGS](./tags) - Filter annotations by tags
- [OPENAPI](./openapi) - Hide from the OpenAPI document or override the section tag
- [MCP](./mcp) - Expose a routine as a Model Context Protocol (MCP) tool for AI agents
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
- [VOID](./void) - Force endpoint to return 204 No Content

### Table Format Output

- [TABLE_FORMAT](./table-format) - `table_format`, `excel_file_name`, `excel_sheet` for HTML table and Excel rendering

### Client Code Generation

- [TSCLIENT](./tsclient) - Control TypeScript client generation per endpoint (disable, module names, URL exports, TanStack Query hooks opt-out)
- [DARTCLIENT](./dartclient) - Control Dart (Flutter) client generation per endpoint (disable, module names, URL exports, response options)

### Raw Output Mode

- [RAW](./raw) - Return raw text instead of JSON
- [SEPARATOR](./separator) - Column separator for raw output
- [NEW_LINE](./new-line) - Row separator for raw output
- [COLUMN_NAMES](./column-names) - Include column headers

### Caching

- [CACHED](./cached) - Enable response caching
- [CACHE_EXPIRES_IN](./cache-expires-in) - Set cache expiration
- [CACHE_PROFILE](./cache-profile) - Select a named cache profile (multiple backends, dynamic TTL, skip-on-condition rules)

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
- [Parameter Value Substitution](./parameter-substitution) - `{name}` placeholders in annotation values
- [Resolved Parameters](./resolved-parameters) - Compute a parameter value server-side from a SQL expression

### SQL File Annotations

- [DEFINE_PARAM](./define-param) - Define virtual HTTP parameters not bound to SQL
- [RESULT_NAME](./result-name) - Rename result keys in multi-command SQL file endpoints
- [SKIP](./skip) - Exclude commands from multi-command results
- [RETURNS](./returns) - Skip Describe step and resolve return columns from a composite type (for runtime-created temp tables)

### Test File Annotations

These apply **only to test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`) — not to endpoint SQL files or routine comments:

- [TEST @setup](./test-setup) - Run named steps before an individual test file
- [TEST @teardown](./test-teardown) - Run named steps after an individual test file, always
- [TEST @connection](./test-connection) - Run a test file on a different named connection
- [TEST @tag](./test-tag) - Tag a test file for Tag/ExcludeTag filtering
- [TEST @claim](./test-claim) - Set the acting principal for an in-process endpoint call (HTTP block directive)
- [TEST @response](./test-response) - Name the captured response temp table (HTTP block directive)

### Custom

- [Custom Parameters](./custom-parameters) - Custom key-value settings

## A–Z Index (Names and Aliases) {#a-z-index}

Most annotations accept one or more aliases, so the keyword you remember may not be the page name (for example, `@timeout` is documented under [COMMAND_TIMEOUT](./command-timeout)). All keywords work with or without the `@` prefix. Use your browser's find (Ctrl+F / ⌘F) on this table to look up any keyword.

| Annotation | Also accepted | What it does |
|---|---|---|
| [ALLOW_ANONYMOUS](./allow-anonymous) | `anonymous`, `allow_anon`, `anon` | Allow unauthenticated access |
| [AUTHORIZE](./authorize) | `authorized`, `requires_authorization` | Require authentication |
| [BASIC_AUTH](./basic-auth) | `basic_authentication` | Enable HTTP Basic Authentication |
| [BASIC_AUTH_COMMAND](./basic-auth-command) | `basic_authentication_command`, `challenge_command` | Set validation function |
| [BASIC_AUTH_REALM](./basic-auth-realm) | `basic_authentication_realm`, `realm` | Set authentication realm |
| [BODY_PARAMETER_NAME](./body-parameter-name) | `body_param_name` | Body parameter name |
| [BUFFER_ROWS](./buffer-rows) | `buffer` | Row buffering count |
| [CACHE_EXPIRES_IN](./cache-expires-in) | `cache_expires` | Set cache expiration |
| [CACHE_PROFILE](./cache-profile) | — | Select a named cache profile (multiple backends, dynamic TTL, skip-on-condition rules) |
| [CACHED](./cached) | — | Enable response caching |
| [COLUMN_NAMES](./column-names) | `columns`, `names` | Include column headers |
| [COMMAND_TIMEOUT](./command-timeout) | `timeout` | Query timeout |
| [CONNECTION](./connection) | `connection_name` | Named database connection |
| [Custom Parameters](./custom-parameters) | — | Custom key-value settings |
| [DARTCLIENT](./dartclient) | — | Control Dart (Flutter) client generation per endpoint (disable, module names, URL exports, response options) |
| [DECRYPT](./encrypt-decrypt) | `decrypted`, `unprotect`, `unprotected` | Decrypt result column values before returning to client |
| [DEFINE_PARAM](./define-param) | — | Define virtual HTTP parameters not bound to SQL |
| [DISABLED](./disabled) | — | Disable endpoint, optionally only for specific tags |
| [ENABLED](./enabled) | — | Re-enable an endpoint after `@disabled`, optionally only for specific tags |
| [ENCRYPT](./encrypt-decrypt) | `encrypted`, `protect`, `protected` | Encrypt parameter values before sending to PostgreSQL |
| [ERROR_CODE_POLICY](./error-code-policy) | `error_code_policy_name`, `error_code` | Error handling policy |
| [HTTP](./http) | — | Expose function as HTTP endpoint |
| [HTTP CUSTOM TYPES](./http-type) | — | Define HTTP request on composite type for external API calls |
| [INTERNAL](./internal) | `internal_only` | Mark endpoint as internal-only (accessible via proxy/HTTP client types, not public HTTP) |
| [Interval Format](./interval-format) | — | Time/duration format for timeouts and cache expiration |
| [LOGIN](./login) | `signin` | Mark as sign-in endpoint |
| [LOGOUT](./logout) | `signout` | Mark as sign-out endpoint |
| [MCP](./mcp) | — | Expose a routine as a Model Context Protocol (MCP) tool for AI agents |
| [NESTED](./nested) | `nested_json`, `nested_composite` | Serialize composite type columns as nested JSON objects |
| [NEW_LINE](./new-line) | `raw_new_line` | Row separator for raw output |
| [OPENAPI](./openapi) | — | Hide from the OpenAPI document or override the section tag |
| [PARAM](./param) | `parameter` | Rename, retype, set defaults, and configure parameters |
| [Parameter Value Substitution](./parameter-substitution) | — | `{name}` placeholders in annotation values |
| [PARAMETER_HASH](./parameter-hash) | `param … is hash of …` form of PARAM | Hash one parameter using another |
| [PATH](./path) | — | Set custom endpoint path |
| [PROXY](./proxy) | `reverse_proxy` | Mark endpoint as reverse proxy |
| [PROXY_OUT](./proxy-out) | `forward_proxy` | Execute function first, then forward result to upstream |
| [QUERY_STRING_NULL_HANDLING](./query-string-null-handling) | `query_null_handling`, `query_string_null`, `query_null` | NULL handling in query strings |
| [RATE_LIMITER_POLICY](./rate-limiter-policy) | `rate_limiter_policy_name`, `rate_limiter` | Rate limiting policy |
| [RAW](./raw) | `raw_mode`, `raw_results` | Return raw text instead of JSON |
| [REQUEST_HEADERS_MODE](./request-headers-mode) | `request_headers` | Control header passing |
| [REQUEST_HEADERS_PARAMETER_NAME](./request-headers-parameter-name) | `request_headers_param_name`, `request-headers-param-name` | Header parameter name |
| [REQUEST_PARAM_TYPE](./request-param-type) | `param_type` | Query string vs body parameters |
| [Resolved Parameters](./resolved-parameters) | — | Compute a parameter value server-side from a SQL expression |
| [Response Headers](./response-headers) | — | Set custom response headers |
| [RESPONSE_NULL_HANDLING](./response-null-handling) | `response_null` | NULL handling in responses |
| [RESULT_NAME](./result-name) | `result` | Rename result keys in multi-command SQL file endpoints |
| [RETRY_STRATEGY](./retry-strategy) | `retry_strategy_name`, `retry` | Retry behavior |
| [RETURNS](./returns) | — | Skip Describe step and resolve return columns from a composite type (for runtime-created temp tables) |
| [SECURITY_SENSITIVE](./security-sensitive) | `sensitive`, `security` | Obfuscate logs |
| [SEPARATOR](./separator) | `raw_separator` | Column separator for raw output |
| [SINGLE](./single) | `single_record`, `single_result` | Return a single record as a JSON object instead of an array |
| [SKIP](./skip) | `skip_result`, `no_result` | Exclude commands from multi-command results |
| [SSE](./sse) | `sse_events_path`, `sse_path` | Enable Server-Sent Events |
| [SSE_EVENTS_LEVEL](./sse-events-level) | `sse_level` | Notice level for SSE |
| [SSE_EVENTS_SCOPE](./sse-events-scope) | `sse_scope` | SSE distribution scope |
| [TABLE_FORMAT](./table-format) | — | `table_format`, `excel_file_name`, `excel_sheet` for HTML table and Excel rendering |
| [TAGS](./tags) | `for`, `tag` | Filter annotations by tags |
| [TEST @claim](./test-claim) | — | Set the acting principal for an in-process endpoint call (HTTP block directive) |
| [TEST @connection](./test-connection) | — | Run a test file on a different named connection |
| [TEST @response](./test-response) | — | Name the captured response temp table (HTTP block directive) |
| [TEST @setup](./test-setup) | — | Run named steps before an individual test file |
| [TEST @tag](./test-tag) | — | Tag a test file for Tag/ExcludeTag filtering |
| [TEST @teardown](./test-teardown) | — | Run named steps after an individual test file, always |
| [TSCLIENT](./tsclient) | — | Control TypeScript client generation per endpoint (disable, module names, URL exports, TanStack Query hooks opt-out) |
| [UPLOAD](./upload) | — | File upload handling |
| [USER_CONTEXT](./user-context) | — | Enable user context |
| [USER_PARAMETERS](./user-parameters) | `user_params` | Add user parameters |
| [VALIDATE](./validate) | — | Parameter validation before database execution |
| [VOID](./void) | `void_result` | Force endpoint to return 204 No Content |

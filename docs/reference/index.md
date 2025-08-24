# Reference

Complete reference documentation for NpgsqlRest.

## Annotations Reference

Comment annotations control how PostgreSQL functions are exposed as HTTP endpoints. Add annotations to function comments to configure routing, authentication, caching, and more.

### HTTP & Routing

- [HTTP](/annotations/http) - Expose function as HTTP endpoint
- [PATH](/annotations/path) - Set custom endpoint path
- [ENABLED](/annotations/enabled) - Enable endpoint for specific tags
- [DISABLED](/annotations/disabled) - Disable endpoint for specific tags
- [TAGS](/annotations/tags) - Filter annotations by tags
- [HTTP CUSTOM TYPES](/annotations/http-type) - Define HTTP request on composite type for external API calls

### Authorization

- [AUTHORIZE](/annotations/authorize) - Require authentication
- [ALLOW_ANONYMOUS](/annotations/allow-anonymous) - Allow unauthenticated access
- [LOGIN](/annotations/login) - Mark as sign-in endpoint
- [LOGOUT](/annotations/logout) - Mark as sign-out endpoint

### Basic Authentication

- [BASIC_AUTH](/annotations/basic-auth) - Enable HTTP Basic Authentication
- [BASIC_AUTH_REALM](/annotations/basic-auth-realm) - Set authentication realm
- [BASIC_AUTH_COMMAND](/annotations/basic-auth-command) - Set validation function

### Request Configuration

- [REQUEST_PARAM_TYPE](/annotations/request-param-type) - Query string vs body parameters
- [REQUEST_HEADERS_MODE](/annotations/request-headers-mode) - Control header passing
- [REQUEST_HEADERS_PARAMETER_NAME](/annotations/request-headers-parameter-name) - Header parameter name
- [BODY_PARAMETER_NAME](/annotations/body-parameter-name) - Body parameter name
- [QUERY_STRING_NULL_HANDLING](/annotations/query-string-null-handling) - NULL handling in query strings

### Response Configuration

- [Response Headers](/annotations/response-headers) - Set custom response headers
- [RESPONSE_NULL_HANDLING](/annotations/response-null-handling) - NULL handling in responses
- [RAW](/annotations/raw) - Return raw text instead of JSON
- [SEPARATOR](/annotations/separator) - Column separator for raw output
- [NEW_LINE](/annotations/new-line) - Row separator for raw output
- [COLUMN_NAMES](/annotations/column-names) - Include column headers

### Caching & Performance

- [CACHED](/annotations/cached) - Enable response caching
- [CACHE_EXPIRES_IN](/annotations/cache-expires-in) - Set cache expiration
- [BUFFER_ROWS](/annotations/buffer-rows) - Row buffering count
- [COMMAND_TIMEOUT](/annotations/command-timeout) - Query timeout
- [RETRY_STRATEGY](/annotations/retry-strategy) - Retry behavior

### Server-Sent Events

- [SSE](/annotations/sse) - Enable Server-Sent Events
- [SSE_EVENTS_LEVEL](/annotations/sse-events-level) - Notice level for SSE
- [SSE_EVENTS_SCOPE](/annotations/sse-events-scope) - SSE distribution scope

### Upload & Policies

- [UPLOAD](/annotations/upload) - File upload handling
- [ERROR_CODE_POLICY](/annotations/error-code-policy) - Error handling policy
- [RATE_LIMITER_POLICY](/annotations/rate-limiter-policy) - Rate limiting policy

### Context & Security

- [USER_CONTEXT](/annotations/user-context) - Enable user context
- [USER_PARAMETERS](/annotations/user-parameters) - Add user parameters
- [PARAMETER_HASH](/annotations/parameter-hash) - Hash one parameter using another
- [CONNECTION](/annotations/connection) - Named database connection
- [SECURITY_SENSITIVE](/annotations/security-sensitive) - Obfuscate logs
- [Custom Parameters](/annotations/custom-parameters) - Custom key-value settings

## Configuration Reference

Configuration options control the server behavior, database connections, security, and features. Settings can be provided via JSON files, environment variables, or command-line arguments.

### Core Settings

- [Top-Level Settings](/config/top-level) - Application identity, URLs, and startup message
- [Config Section](/config/config-section) - Configuration file processing and environment variables
- [NpgsqlRest Options](/config/npgsqlrest) - Core API generation settings
- [Routine Options](/config/routine-options) - PostgreSQL routine handling
- [Connection Settings](/config/connection) - Database connection strings
- [Server & SSL](/config/server) - Kestrel web server and SSL/TLS configuration

### Security

- [Authentication](/config/auth) - Cookie and Bearer Token authentication
- [External OAuth](/config/external-auth) - Google, LinkedIn, GitHub, Microsoft, Facebook OAuth
- [Authentication Options](/config/authentication-options) - Per-endpoint authentication configuration
- [Claims Mapping](/config/claims-mapping) - User context and parameters mapping
- [Basic Auth Config](/config/basic-auth-config) - HTTP Basic Authentication configuration
- [Antiforgery](/config/antiforgery) - CSRF protection settings
- [Data Protection](/config/data-protection) - Key storage and encryption settings
- [CORS](/config/cors) - Cross-Origin Resource Sharing configuration

### Features

- [CRUD Source](/config/crud) - Automatic CRUD endpoint generation for tables
- [OpenAPI](/config/openapi) - OpenAPI/Swagger documentation generation
- [HTTP Files](/config/http-files) - HTTP test file generation
- [Code Generation](/config/codegen) - Client code generation (TypeScript, etc.)
- [Upload Options](/config/uploads) - File upload handling
- [HTTP Client](/config/http-client) - HTTP Types for external API calls from PostgreSQL functions

### Performance

- [Response Compression](/config/response-compression) - Gzip/Brotli compression settings
- [Cache Options](/config/cache-options) - Response caching configuration
- [Rate Limiter](/config/rate-limiter) - Rate limiting settings
- [Command Retry](/config/command-retry) - Database command retry policies
- [Thread Pool](/config/thread-pool) - Thread pool configuration

### Infrastructure

- [Logging](/config/logging) - Log levels and output configuration
- [Static Files](/config/static-files) - Static file serving configuration
- [Error Handling](/config/error-handling) - Error response configuration

---
outline: [2, 3]
title: "Custom Parameters Annotation"
titleTemplate: NpgsqlRest
description: "Set custom key-value configuration for PostgreSQL REST API endpoints. Add metadata and custom settings to endpoints."
head:
  - - meta
    - name: keywords
      content: npgsqlrest custom parameters, endpoint metadata, key value config, custom endpoint settings, api custom config
  - - meta
    - property: og:title
      content: "NpgsqlRest Custom Parameters Annotation"
  - - meta
    - property: og:description
      content: "Set custom key-value configuration and metadata for endpoints."
  - - meta
    - property: og:type
      content: article
---

# Custom Parameters

Set custom key-value configuration for the endpoint.

## Syntax

```
@<key> = <value>
```

The `@` prefix is optional - both `@key = value` and `key = value` work identically. Custom parameters with `@` prefix are stored without the prefix (e.g., `@my_param = value` is stored as `my_param`).

::: tip Misspelt keys (since 4.0.0)
Any `key = value` line is stored, so a misspelt key does nothing. When the line is written with the `@` prefix and nothing reads that key, NpgsqlRest logs a warning at startup (`"@tsclinet_module = users" - nothing reads a custom parameter named tsclinet_module`), and `npgsqlrest --endpoints` lists it under `unknownAnnotations` and `unknownCustomParameters`. `npgsqlrest --annotations` lists every key that is read. A key that your own application reads from `CustomParameters` is reported as well when written with `@`: write it without the prefix, or register it with `CommentAnnotations.Register(...)`.
:::

A comment line that begins with `@` and is not an annotation at all (`@color blue`) is ignored: it is not stored, and since 4.0.0 it is no longer published as part of the endpoint's description by OpenAPI and MCP.

## Dynamic Parameter Values

Some parameters support dynamic values using the `{param_name}` format, where `param_name` references a function parameter or an [allowlisted environment variable](./parameter-substitution#environment-variables) (`NpgsqlRest:AvailableEnvVars`). Parameter values are resolved at runtime from the actual value passed to the endpoint; environment variables are resolved once at startup, and a parameter with the same name takes precedence. Since 3.21.0 the strict forms work here too: `{!name}` resolves like `{name}` for known names, and `{!name:fallback}` substitutes the inline fallback when an allowlisted variable is unset (with no configured default) or when a parameter value is null — e.g. `@file_system_path = {!UPLOAD_ROOT:/var/uploads}`. The matching and substitution rules are shared across annotations — see [Parameter Value Substitution](./parameter-substitution).

::: warning
The upload `row_command` (and `csv_row_command` / `excel_row_command`) is SQL text, so placeholders are **never** substituted in it (since 4.0.0) — a request value pasted into SQL would be SQL injection. Pass values through the row command's `$1`–`$4` parameters instead.
:::

### Example

```sql
create function upload_file(_path text, _file text)
returns void
language sql
begin atomic;
  -- function body
end;

comment on function upload_file(text, text) is '
@upload for file_system
@file_system_path = {_path}
@file_system_file = {_file}
';
```

**Equivalent as a SQL file endpoint** (`sql/upload-file.sql`):

```sql
/*
HTTP POST
@upload for file_system
@file_system_path = {path}
@file_system_file = {file}
@define_param path
@define_param file
*/
select;
```

The SQL does not reference the two values, so [`@define_param`](./define-param) declares them as HTTP parameters that only feed the placeholders.

When called with `{"_path": "/uploads/images", "_file": "photo.jpg"}`, the file will be saved to `/uploads/images/photo.jpg`.

## Built-in Parameters

Many annotations support the `@key = value` syntax. The following sections link to where each parameter group is documented.

### General

These parameters are predefined annotations that also support the `key = value` syntax:

- [BUFFER_ROWS](./buffer-rows) — `buffer_rows`, `buffer`
- [RAW](./raw) — `raw`, `raw_mode`, `raw_results`
- [SEPARATOR](./separator) — `separator`, `raw_separator`
- [NEW_LINE](./new-line) — `new_line`, `raw_new_line`
- [COLUMN_NAMES](./column-names) — `columns`, `names`, `column_names`
- [CONNECTION](./connection) — `connection`, `connection_name`
- [COMMAND_TIMEOUT](./command-timeout) — `timeout`, `command_timeout`
- [SINGLE](./single) — `single`, `single_record`, `single_result`
- [VOID](./void) — `void`, `void_result`
- [USER_CONTEXT](./user-context) — `user_context`
- [USER_PARAMETERS](./user-parameters) — `user_parameters`, `user_params`
- [ENCRYPT / DECRYPT](./encrypt-decrypt) — `encrypt`, `decrypt` (`= true` encrypts all text parameters / decrypts all text columns)
- [RETRY_STRATEGY](./retry-strategy) — `retry_strategy`, `retry_strategy_name`, `retry`
- [RATE_LIMITER_POLICY](./rate-limiter-policy) — `rate_limiter`, `rate_limiter_policy`, `rate_limiter_policy_name`
- [ERROR_CODE_POLICY](./error-code-policy) — `error_code_policy`, `error_code_policy_name`, `error_code`
- [BASIC_AUTH](./basic-auth) — `basic_auth = <username> <password>` adds a user, `basic_auth = true` only turns it on
- [BASIC_AUTH_REALM](./basic-auth-realm), [BASIC_AUTH_COMMAND](./basic-auth-command) — `realm`, `challenge_command` (and their aliases)

### Upload

Upload handlers accept custom parameters to control file processing behavior per-endpoint:

- [UPLOAD — Custom Parameters](./upload#custom-parameters)

### Table Format

Per-endpoint control of HTML table and Excel spreadsheet rendering:

- [TABLE_FORMAT](./table-format)

### Server-Sent Events

SSE annotations that also support the `key = value` syntax:

- [SSE](./sse) — `sse`, `sse_path`, `sse_events_path`
- `sse_publish`, `sse_events_publish` — publish this routine's `RAISE` messages without giving the endpoint a stream of its own (`true`, `false`)
- `sse_subscribe`, `sse_events_subscribe` — give the endpoint a stream without publishing its own messages (`true`, `false`, or a path)
- [SSE_EVENTS_LEVEL](./sse-events-level) — `sse_level`, `sse_events_level`
- [SSE_EVENTS_SCOPE](./sse-events-scope) — `sse_scope`, `sse_events_scope`

### TypeScript Client

Per-endpoint control of generated TypeScript client code:

- [TSCLIENT](./tsclient)

### Dart Client

Per-endpoint control of generated Dart client code:

- [DARTCLIENT](./dartclient)

## Rules for keys and values

- **Keys are matched in any case** (since 4.0.0): `TsClient_Module = users` is the same as `tsclient_module = users`.
- **Switches** accept `true`, `on`, `enabled`, `1` and `false`, `off`, `disabled`, `0`, in any case (since 4.0.0 for the built-in keys such as `raw`, `single`, `user_context`; the client generators always did).
- **A value that is not valid** for a built-in key (`raw = maybe`, `buffer_rows = many`, `timeout = soon`, `sse_level = loud`, an unknown `retry_strategy`) is ignored and logged as a warning (since 4.0.0; it used to be ignored in silence).
- **Escapes:** `\t`, `\n` and the like are read as escapes (`separator = \t` is a tab). A value that is not a valid escape sequence, such as the Windows path `C:\uploads`, is taken as written.
- **A key that is one of the routine's parameters** is not a custom parameter but a [resolved parameter](./resolved-parameters), with or without the `@`.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default parameters
- [Upload configuration](../config/uploads) - Configure upload handlers
- [Table Format Options](../config/table-format) - Configure table format rendering
- [Code Generation](../config/codegen) - Configure TypeScript client generation
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

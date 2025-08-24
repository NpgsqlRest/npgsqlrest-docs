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

## Dynamic Parameter Values

Some parameters support dynamic values using the `{param_name}` format, where `param_name` references a function parameter. The value is resolved at runtime from the actual parameter value passed to the endpoint.

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

### Upload

Upload handlers accept custom parameters to control file processing behavior per-endpoint:

- [UPLOAD — Custom Parameters](./upload#custom-parameters)

### Table Format

Per-endpoint control of HTML table and Excel spreadsheet rendering:

- [TABLE_FORMAT](./table-format)

### Server-Sent Events

SSE annotations that also support the `key = value` syntax:

- [SSE](./sse) — `sse`, `sse_path`, `sse_events_path`
- [SSE_EVENTS_LEVEL](./sse-events-level) — `sse_level`, `sse_events_level`
- [SSE_EVENTS_SCOPE](./sse-events-scope) — `sse_scope`, `sse_events_scope`

### TypeScript Client

Per-endpoint control of generated TypeScript client code:

- [TSCLIENT](./tsclient)

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default parameters
- [Upload configuration](../config/uploads) - Configure upload handlers
- [Table Format Options](../config/table-format) - Configure table format rendering
- [Code Generation](../config/codegen) - Configure TypeScript client generation
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

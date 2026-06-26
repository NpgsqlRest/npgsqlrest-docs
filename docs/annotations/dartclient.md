---
outline: [2, 3]
title: "DARTCLIENT Annotation"
titleTemplate: NpgsqlRest
description: "Control Dart client code generation per-endpoint. Disable generation, set module names, configure URL exports and response options for Flutter clients."
head:
  - - meta
    - name: keywords
      content: npgsqlrest dartclient, dart client annotation, flutter codegen control, api client generation, per-endpoint dart
  - - meta
    - property: og:title
      content: "NpgsqlRest DARTCLIENT Annotation"
  - - meta
    - property: og:description
      content: "Control Dart client code generation per-endpoint with custom parameter annotations."
  - - meta
    - property: og:type
      content: article
---

# DARTCLIENT

Control Dart client code generation for individual endpoints using [custom parameter](./custom-parameters) annotations. Available since version 3.20.0.

::: warning Requires Configuration
Dart client generation must be enabled in the [Dart Code Generation](../config/dart-codegen) configuration (`DartClientCodeGen.Enabled = true`).
:::

## Syntax

```
@dartclient = <true|false>
@dartclient_module = <module_name>
@dartclient_status_code = <true|false>
@dartclient_events = <true|false>
@dartclient_parse_url = <true|false>
@dartclient_parse_request = <true|false>
@dartclient_export_url = <true|false>
@dartclient_url_only = <true|false>
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `dartclient` | Set to `false`, `off`, `disabled`, `disable`, or `0` to exclude this endpoint from the generated Dart client. |
| `dartclient_module` | Sets a different module name for the generated Dart client file. Endpoints with the same module name are grouped into the same file. Falls back to `tsclient_module`, so SQL-file directory grouping applies to both generators. |
| `dartclient_status_code` | Enable or disable the `ApiResult<T>` status wrapper in the return value. |
| `dartclient_events` | Enable or disable the SSE event-source parameters for endpoints with SSE events enabled. |
| `dartclient_parse_url` | Enable or disable the `parseUrl` named parameter in the generated function. |
| `dartclient_parse_request` | Enable or disable the `parseRequest` named parameter in the generated function. |
| `dartclient_export_url` | When `true`, emits a `{name}Url()` URL-builder function for this endpoint regardless of the global `ExportUrls` setting. |
| `dartclient_url_only` | When `true`, emits only the URL-builder function for this endpoint (no fetch function). |

## Examples

Exclude an endpoint from the Dart client:

```sql
comment on function internal_maintenance() is '
HTTP POST
@dartclient = off
';
```

Group endpoints into one module file with the status wrapper:

```sql
comment on function get_orders(_customer text) is '
HTTP GET
@dartclient_module = orders
@dartclient_status_code = true
';
```

## Related

- [Dart Code Generation](../config/dart-codegen) - Full configuration reference, generated code shapes and type mapping
- [TSCLIENT annotation](./tsclient) - The TypeScript client equivalent
- [Custom Parameters](./custom-parameters) - How custom parameter annotations work

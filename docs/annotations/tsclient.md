---
outline: [2, 3]
title: "TSCLIENT Annotation"
titleTemplate: NpgsqlRest
description: "Control TypeScript client code generation per-endpoint. Disable generation, set module names, configure URL exports and response options."
head:
  - - meta
    - name: keywords
      content: npgsqlrest tsclient, typescript client annotation, codegen control, api client generation, per-endpoint typescript
  - - meta
    - property: og:title
      content: "NpgsqlRest TSCLIENT Annotation"
  - - meta
    - property: og:description
      content: "Control TypeScript client code generation per-endpoint with custom parameter annotations."
  - - meta
    - property: og:type
      content: article
---

# TSCLIENT

Control TypeScript client code generation for individual endpoints using [custom parameter](./custom-parameters) annotations.

::: warning Requires Configuration
TypeScript client generation must be enabled in the [Code Generation](../config/codegen) configuration (`ClientCodeGen.Enabled = true`).
:::

## Syntax

```
@tsclient = <true|false>
@tsclient_module = <module_name>
@tsclient_events = <true|false>
@tsclient_parse_url = <true|false>
@tsclient_parse_request = <true|false>
@tsclient_status_code = <true|false>
@tsclient_export_url = <true|false>
@tsclient_url_only = <true|false>
@tsclient_hooks = <true|false>
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `tsclient` | Set to `false`, `off`, `disabled`, `disable`, or `0` to disable TypeScript client code generation for the endpoint. |
| `tsclient_module` | Sets a different module name for the generated TypeScript client file. Endpoints with the same module name are grouped into the same file. |
| `tsclient_events` | Enable or disable SSE events parameter for endpoints with SSE events enabled. |
| `tsclient_parse_url` | Enable or disable `parseUrl` parameter in the generated function. |
| `tsclient_parse_request` | Enable or disable `parseRequest` parameter in the generated function. |
| `tsclient_status_code` | Enable or disable status code in the return value. |
| `tsclient_export_url` | When `true`, exports a URL constant for this endpoint regardless of the global `ExportUrls` setting. |
| `tsclient_hooks` | When `off`/`false`/`disabled`, excludes this endpoint from the generated [TanStack Query hooks](../config/react-query) file only; the client function is still generated. Available since 3.20.0. |
| `tsclient_url_only` | When `true`, only the URL constant and request interface are exported — the fetch function and response type are skipped. Implies `tsclient_export_url = true`. Useful for endpoints consumed via browser navigation (e.g., table format downloads). |

## Examples

### Disable Generation

Use `@tsclient = false` to skip client generation for endpoints that return binary data or are not useful in the TypeScript client:

```sql
create function get_image(_id int)
returns bytea
language sql
begin atomic;
  select data from images where id = _id;
end;

comment on function get_image(int) is '
HTTP GET
@tsclient = false
';
```

**Equivalent as a SQL file endpoint** (`sql/get-image.sql`):

```sql
/*
HTTP GET
@tsclient = false
@param $1 id
*/
select data from images where id = $1;
```

### URL-Only Export

Use `@tsclient_url_only = true` for endpoints consumed via browser navigation rather than `fetch` — such as table format downloads or file exports:

```sql
create function get_data(
    _format text,
    _excel_file_name text = null,
    _excel_sheet text = null
)
returns table (int_val int, text_val text, date_val date)
language sql
begin atomic;
  select * from data;
end;

comment on function get_data(text, text, text) is '
HTTP GET
@table_format = {_format}
@excel_file_name = {_excel_file_name}
@excel_sheet = {_excel_sheet}
@tsclient_url_only = true
';
```

This generates only the URL builder and request interface:

```typescript
export const getDataUrl = (request: IGetDataRequest) =>
    baseUrl + "/api/get-data" + parseQuery(request);

interface IGetDataRequest {
    format: string | null;
    excelFileName?: string | null;
    excelSheet?: string | null;
}
```

### Custom Module

Use `@tsclient_module` to group endpoints from different schemas into the same generated file:

```sql
comment on function public.get_users() is '
HTTP GET
@tsclient_module = admin
';

comment on function auth.get_roles() is '
HTTP GET
@tsclient_module = admin
';
```

Both endpoints will be generated in the `admin` module file.

## Related

- [Code Generation](../config/codegen) - Global TypeScript client generation configuration
- [Custom Parameters](./custom-parameters) - Custom parameter syntax and dynamic values
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [TABLE_FORMAT](./table-format) - Table format rendering (commonly used with `tsclient_url_only`)
- [SSE](./sse) - Server-Sent Events (use `tsclient_events` to control SSE parameter generation)

## See Also

- [Code Generation](/config/codegen) - Configure TypeScript client generation

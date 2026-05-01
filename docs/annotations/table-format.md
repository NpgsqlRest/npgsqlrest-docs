---
outline: [2, 3]
title: "TABLE_FORMAT Annotation"
titleTemplate: NpgsqlRest
description: "Render PostgreSQL function results as HTML tables or Excel spreadsheet downloads instead of JSON. Per-endpoint table format control with dynamic placeholders."
head:
  - - meta
    - name: keywords
      content: npgsqlrest table format, html table rendering, excel download api, spreadsheet export, table_format annotation
  - - meta
    - property: og:title
      content: "NpgsqlRest TABLE_FORMAT Annotation"
  - - meta
    - property: og:description
      content: "Render function results as HTML tables or Excel downloads with per-endpoint annotation control."
  - - meta
    - property: og:type
      content: article
---

# TABLE_FORMAT

Control how function results (from routines returning `SETOF` or `TABLE`) are rendered. Instead of JSON, results can be rendered as HTML tables or Excel spreadsheet downloads.

::: warning Applies to Set-Returning Functions Only
Table format rendering only applies to routines that return `SETOF` or `TABLE` results. Scalar-returning functions are not affected.
:::

::: warning Requires Configuration
Table format rendering must be enabled in the [Table Format Options](../config/table-format) configuration (`TableFormatOptions.Enabled = true`).
:::

## Syntax

```
@table_format = <format>
@excel_file_name = <filename>
@excel_sheet = <sheet_name>
```

All parameters support [dynamic placeholders](./custom-parameters#dynamic-parameter-values) using the `{param_name}` format.

## Parameters

| Parameter | Description |
|-----------|-------------|
| `table_format` | Sets the table format renderer for the endpoint. Values: `html` (render as HTML table), `excel` (render as `.xlsx` download). If the value is not a recognized format, a warning is logged and the endpoint falls back to the default JSON response. |
| `excel_file_name` | Sets the download filename for Excel table format output. Only applies when `table_format` is `excel`. If omitted, defaults to the routine name. |
| `excel_sheet` | Sets the worksheet name for Excel table format output. Only applies when `table_format` is `excel`. If omitted, defaults to the routine name (max 31 characters). |

## Examples

### Static HTML Table

```sql
create function get_report()
returns table (id int, name text, amount numeric)
language sql
begin atomic;
  select * from reports;
end;

comment on function get_report() is '
HTTP GET
@table_format = html
';
```

**Equivalent as a SQL file endpoint** (`sql/get-report.sql`):

```sql
/*
HTTP GET
@table_format = html
*/
select id, name, amount from reports;
```

### Static Excel Download

```sql
comment on function get_report() is '
HTTP GET
@table_format = excel
@excel_file_name = monthly_report.xlsx
@excel_sheet = Report Data
';
```

### Dynamic Format Selection

Use function parameters as dynamic placeholders to let the caller choose the output format:

```sql
create function get_data(
    _format text,
    _excel_file_name text = null,
    _excel_sheet text = null
)
returns table (
    int_val int,
    text_val text,
    date_val date
)
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

When called with `?format=html`, renders an HTML table. When called with `?format=excel&excelFileName=report.xlsx`, returns an Excel download.

::: tip Use with tsclient_url_only
Table format endpoints are typically consumed via browser navigation (opening a URL directly), not via `fetch`. Use [`@tsclient_url_only = true`](./tsclient) to generate only the URL builder in the TypeScript client.
:::

## Related

- [Table Format Options](../config/table-format) - Global configuration for HTML and Excel rendering
- [Custom Parameters](./custom-parameters) - Custom parameter syntax and dynamic values
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [TSCLIENT](./tsclient) - Control TypeScript client generation (use `tsclient_url_only` for table format endpoints)

## See Also

- [Table Format Config](/config/table-format) - Configure HTML and Excel rendering

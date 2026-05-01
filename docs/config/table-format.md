---
outline: [2, 3]
title: "Table Format Options"
titleTemplate: NpgsqlRest
description: "Configure table format rendering in NpgsqlRest. Render PostgreSQL function results as HTML tables or Excel spreadsheet downloads instead of JSON."
head:
  - - meta
    - name: keywords
      content: npgsqlrest table format, html table rendering, excel download api, spreadsheet export, postgresql report export
  - - meta
    - property: og:title
      content: "NpgsqlRest Table Format Options"
  - - meta
    - property: og:description
      content: "Configure HTML table and Excel spreadsheet rendering for PostgreSQL function results."
  - - meta
    - property: og:type
      content: article
---

# Table Format Options

Pluggable table format rendering system that allows PostgreSQL function results to be rendered as HTML tables or Excel spreadsheet downloads instead of JSON, controlled by the `@table_format` annotation.

::: warning Applies to Set-Returning Functions Only
Table format rendering only applies to routines that return `SETOF` or `TABLE` results. Scalar-returning functions are not affected.
:::

## Overview

```json
{
  "NpgsqlRest": {
    "TableFormatOptions": {
      "Enabled": false,
      "HtmlEnabled": true,
      "HtmlKey": "html",
      "HtmlHeader": "<style>table{font-family:Calibri,Arial,sans-serif;font-size:11pt;border-collapse:collapse}th,td{border:1px solid #d4d4d4;padding:4px 8px}th{background-color:#f5f5f5;font-weight:600}</style>",
      "HtmlFooter": null,
      "ExcelEnabled": true,
      "ExcelKey": "excel",
      "ExcelSheetName": null,
      "ExcelDateTimeFormat": null,
      "ExcelNumericFormat": null
    }
  }
}
```

## General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable table format handlers. When `false`, `@table_format` annotations are ignored. |

## HTML Table Handler

Renders results as a styled HTML table suitable for browser viewing and copy-paste into Excel. Activated by the `@table_format = html` annotation on PostgreSQL functions returning `SETOF` or `TABLE`.

```json
{
  "NpgsqlRest": {
    "TableFormatOptions": {
      "Enabled": true,
      "HtmlEnabled": true,
      "HtmlKey": "html",
      "HtmlHeader": "<style>table{font-family:Calibri,Arial,sans-serif;font-size:11pt;border-collapse:collapse}th,td{border:1px solid #d4d4d4;padding:4px 8px}th{background-color:#f5f5f5;font-weight:600}</style>",
      "HtmlFooter": null
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `HtmlEnabled` | bool | `true` | Enable the HTML table handler. |
| `HtmlKey` | string | `"html"` | The key name used to match `@table_format = <key>` annotation. |
| `HtmlHeader` | string | *(CSS style block)* | Content written before the HTML table. Typically a CSS style block. Set to `null` to omit. |
| `HtmlFooter` | string | `null` | Content written after the closing HTML table tag. Set to `null` to omit. |

### Example

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

This renders the function result as an HTML table instead of JSON.

## Excel Table Handler

Renders results as an `.xlsx` Excel spreadsheet download using the SpreadCheetah library (streaming, AOT-compatible). Activated by the `@table_format = excel` annotation on PostgreSQL functions returning `SETOF` or `TABLE`.

```json
{
  "NpgsqlRest": {
    "TableFormatOptions": {
      "Enabled": true,
      "ExcelEnabled": true,
      "ExcelKey": "excel",
      "ExcelSheetName": null,
      "ExcelDateTimeFormat": null,
      "ExcelNumericFormat": null
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ExcelEnabled` | bool | `true` | Enable the Excel handler. |
| `ExcelKey` | string | `"excel"` | The key name used to match `@table_format = <key>` annotation. |
| `ExcelSheetName` | string | `null` | Worksheet name. When `null`, uses the routine name. |
| `ExcelDateTimeFormat` | string | `null` | Excel Format Code for DateTime cells. When `null`, uses SpreadCheetah default (`yyyy-MM-dd HH:mm:ss`). Uses Excel Format Codes (not .NET format strings). Examples: `yyyy-mm-dd`, `dd/mm/yyyy hh:mm`, `m/d/yy h:mm`. |
| `ExcelNumericFormat` | string | `null` | Excel Format Code for numeric cells. When `null`, uses Excel default (General). Uses Excel Format Codes (not .NET format strings). Examples: `#,##0.00`, `0.00`, `#,##0`. |

### Example

```sql
create function get_report()
returns table (id int, name text, amount numeric)
language sql
begin atomic;
  select * from reports;
end;

comment on function get_report() is '
HTTP GET
@table_format = excel
';
```

This returns an `.xlsx` file download instead of JSON.

### Per-Endpoint Overrides

The download filename and worksheet name can be overridden per-endpoint via custom parameter annotations:

```sql
comment on function get_report() is '
HTTP GET
@table_format = excel
@excel_file_name = monthly_report.xlsx
@excel_sheet = Report Data
';
```

These also support dynamic placeholders resolved from function parameters:

```sql
create function get_report(_format text, _file_name text, _sheet_name text)
returns table (id int, name text, amount numeric)
language sql
begin atomic;
  select * from reports;
end;

comment on function get_report(text, text, text) is '
HTTP GET
@table_format = {_format}
@excel_file_name = {_file_name}
@excel_sheet = {_sheet_name}
';
```

## Complete Example

Production configuration with both HTML and Excel handlers:

```json
{
  "NpgsqlRest": {
    "TableFormatOptions": {
      "Enabled": true,
      "HtmlEnabled": true,
      "HtmlKey": "html",
      "HtmlHeader": "<style>table{font-family:Calibri,Arial,sans-serif;font-size:11pt;border-collapse:collapse}th,td{border:1px solid #d4d4d4;padding:4px 8px}th{background-color:#f5f5f5;font-weight:600}</style>",
      "HtmlFooter": null,
      "ExcelEnabled": true,
      "ExcelKey": "excel",
      "ExcelSheetName": null,
      "ExcelDateTimeFormat": "yyyy-mm-dd",
      "ExcelNumericFormat": "#,##0.00"
    }
  }
}
```

## Related

- [TABLE_FORMAT annotation](../annotations/table-format) - Per-endpoint `table_format`, `excel_file_name`, and `excel_sheet` parameters
- [Code Generation](./codegen) - TypeScript client code generation with `tsclient_export_url` and `tsclient_url_only`
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Upload Options](./uploads) - Configure file upload handlers
- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings

## See Also

- [TABLE_FORMAT](/annotations/table-format) - Render results as HTML or Excel

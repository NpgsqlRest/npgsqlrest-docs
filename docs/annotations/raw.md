---
outline: [2, 3]
title: "RAW Annotation"
titleTemplate: NpgsqlRest
description: "Return raw text output instead of JSON from PostgreSQL REST API endpoints. Output CSV, plain text, or custom formats."
head:
  - - meta
    - name: keywords
      content: npgsqlrest raw output, text response api, csv output postgresql, non-json response, plain text api
  - - meta
    - property: og:title
      content: "NpgsqlRest RAW Annotation"
  - - meta
    - property: og:description
      content: "Return raw text output instead of JSON formatting from PostgreSQL."
  - - meta
    - property: og:type
      content: article
---

# RAW

::: info Also known as
`raw_mode`, `raw_results` (with or without `@` prefix)
:::

Return raw text output instead of JSON formatting.

## Syntax

```
@raw
```

## Examples

### Basic Raw Output

```sql
create function get_plain_text()
returns text
language sql
begin atomic;
select 'Hello, World!';
end;

comment on function get_plain_text() is
'HTTP GET
@raw';
```

**Equivalent as a SQL file endpoint** (`sql/get-plain-text.sql`):

```sql
-- HTTP GET
-- @raw
select 'Hello, World!';
```

Response: `Hello, World!` (plain text, no JSON wrapping)

### Raw with Multiple Columns

```sql
create function get_user_info()
returns table(name text, email text)
language sql
begin atomic;
select name, email from users limit 1;
end;

comment on function get_user_info() is
'HTTP GET
@raw';
```

Response: `John Doejohn@example.com` (values concatenated with no separator — add `@separator` to delimit them)

### CSV Export

```sql
create function export_users_csv()
returns table(id int, name text, email text)
language sql
begin atomic;
select id, name, email from users;
end;

comment on function export_users_csv() is
'HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv';
```

Response:
```
id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
```

### Tab-Separated Values

```sql
create function export_tsv()
returns table(col1 text, col2 text, col3 text)
language sql
begin atomic;
select * from my_table;
end;

comment on function export_tsv() is
'HTTP GET
@raw
@separator \t
@new_line \n
Content-Type: text/tab-separated-values';
```

### Pipe-Delimited Format

```sql
create function export_data()
returns table(a text, b text, c text)
language sql
begin atomic;
...;
end;

comment on function export_data() is
'HTTP GET
@raw
@separator |
@new_line \n';
```

Response:
```
value1|value2|value3
value4|value5|value6
```

### Download as File

```sql
create function download_report()
returns table(data text)
language sql
begin atomic;
...;
end;

comment on function download_report() is
'HTTP GET
@raw
Content-Type: text/csv
Content-Disposition: attachment; filename="report.csv"';
```

Browser will download the response as a file.

### Dynamic CSV Download

Use `{param_name}` template syntax in headers for dynamic content type and filename:

```sql
create function export_data(_type text, _file text)
returns table(id int, name text, email text)
language sql
begin atomic;
select id, name, email from users;
end;

comment on function export_data(text, text) is
'HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: {_type}
Content-Disposition: attachment; filename={_file}';
```

Request: `GET /api/export-data?type=text/csv&file=users.csv`

Response headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename=users.csv
```

Response body:
```
id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
```

## Behavior

- Returns content as plain text instead of JSON
- Multiple columns are concatenated (use `separator` to delimit)
- Multiple rows are concatenated (use `new_line` to delimit)
- Use with `Content-Type` header to set appropriate media type

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [SEPARATOR](./separator) - Set column delimiter
- [NEW_LINE](./new-line) - Set row delimiter
- [COLUMN_NAMES](./column-names) - Include header row
- [Response Headers](./response-headers) - Set Content-Type

---
outline: [2, 3]
title: "COLUMN_NAMES Annotation"
titleTemplate: NpgsqlRest
description: "Include column names as header row in raw output mode. Add CSV headers to PostgreSQL REST API responses."
head:
  - - meta
    - name: keywords
      content: npgsqlrest column names, csv header row, include headers, raw output headers, column headers
  - - meta
    - property: og:title
      content: "NpgsqlRest COLUMN_NAMES Annotation"
  - - meta
    - property: og:description
      content: "Include column names as header row in raw output mode."
  - - meta
    - property: og:type
      content: article
---

# COLUMN_NAMES

::: info Also known as
`columns`, `names` (with or without `@` prefix)
:::

Include column names as the first row in raw output mode.

## Syntax

```
@columns
```

## Examples

### CSV with Headers

```sql
create function export_users()
returns table(id int, name text, email text)
language sql
begin atomic;
select id, name, email from users;
end;

comment on function export_users() is
'HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv';
```

**Equivalent as a SQL file endpoint** (`sql/export-users.sql`):

```sql
/*
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
*/
select id, name, email from users;
```

Response:
```
id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
```

### TSV with Headers

```sql
comment on function export_tsv() is
'HTTP GET
@raw
@separator \t
@new_line \n
@column_names';
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [RAW](./raw) - Enable raw output mode
- [SEPARATOR](./separator) - Set column delimiter
- [NEW_LINE](./new-line) - Set row delimiter

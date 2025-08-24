---
outline: [2, 3]
title: "NEW_LINE Annotation"
titleTemplate: NpgsqlRest
description: "Set row separator for raw output mode in PostgreSQL REST APIs. Configure line endings for CSV and text output."
head:
  - - meta
    - name: keywords
      content: npgsqlrest new line, row separator, line ending, csv line break, raw output newline
  - - meta
    - property: og:title
      content: "NpgsqlRest NEW_LINE Annotation"
  - - meta
    - property: og:description
      content: "Set row separator for raw output mode and CSV line endings."
  - - meta
    - property: og:type
      content: article
---

# NEW_LINE

::: info Also known as
`raw_new_line` (with or without `@` prefix)
:::

Set the row separator for raw output mode.

## Syntax

```
@new_line <string>
```

Supports escape sequences: `\n` (newline), `\r\n` (Windows newline), `\\` (backslash)

## Examples

### Unix Line Endings

```sql
comment on function export_unix() is
'HTTP GET
@raw
@separator ,
@new_line \n';
```

### Windows Line Endings

```sql
comment on function export_windows() is
'HTTP GET
@raw
@separator ,
@new_line \r\n';
```

### Custom Row Separator

```sql
comment on function export_custom() is
'HTTP GET
@raw
@new_line |||';
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [RAW](./raw) - Enable raw output mode
- [SEPARATOR](./separator) - Set column delimiter
- [COLUMN_NAMES](./column-names) - Include header row

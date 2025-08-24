---
outline: [2, 3]
title: "SEPARATOR Annotation"
titleTemplate: NpgsqlRest
description: "Set column separator for raw output mode in PostgreSQL REST APIs. Configure CSV delimiters and custom separators."
head:
  - - meta
    - name: keywords
      content: npgsqlrest separator, csv delimiter, column separator, raw output format, custom delimiter
  - - meta
    - property: og:title
      content: "NpgsqlRest SEPARATOR Annotation"
  - - meta
    - property: og:description
      content: "Set column separator for raw output mode and CSV generation."
  - - meta
    - property: og:type
      content: article
---

# SEPARATOR

::: info Also known as
`raw_separator` (with or without `@` prefix)
:::

Set the column separator for raw output mode.

## Syntax

```
@separator <string>
```

Supports escape sequences: `\t` (tab), `\n` (newline), `\\` (backslash)

## Examples

### Comma Separator (CSV)

```sql
comment on function export_csv() is
'HTTP GET
@raw
@separator ,';
```

### Tab Separator (TSV)

```sql
comment on function export_tsv() is
'HTTP GET
@raw
@separator \t';
```

### Pipe Separator

```sql
comment on function export_pipe() is
'HTTP GET
@raw
@separator |';
```

### Custom Separator

```sql
comment on function export_custom() is
'HTTP GET
@raw
@separator ::';
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [RAW](./raw) - Enable raw output mode
- [NEW_LINE](./new-line) - Set row delimiter
- [COLUMN_NAMES](./column-names) - Include header row

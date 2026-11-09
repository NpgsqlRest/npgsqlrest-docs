---
outline: [2, 3]
title: "BUFFER_ROWS Annotation"
titleTemplate: NpgsqlRest
description: "Configure row buffering for PostgreSQL REST API responses. Control memory usage and streaming behavior for large result sets."
head:
  - - meta
    - name: keywords
      content: npgsqlrest buffer rows, response buffering, streaming results, large result sets, memory optimization
  - - meta
    - property: og:title
      content: "NpgsqlRest BUFFER_ROWS Annotation"
  - - meta
    - property: og:description
      content: "Configure row buffering for controlling memory usage and streaming."
  - - meta
    - property: og:type
      content: article
---

# BUFFER_ROWS (`buffer`)

::: info Also known as
`buffer` (with or without `@` prefix)
:::

Set the number of rows to collect before they can be sent to the client.

## Syntax

```
@buffer_rows <count>
@buffer <count>
```

Or using custom parameter syntax:

```
@buffer_rows = <count>
@buffer = <count>
```

## Default Value

The default value is `25` rows.

## Special Values

| Value | Behavior |
|-------|----------|
| `0` | Disable buffering - send every row as soon as it is read |
| `1` | Buffer the entire array (all rows) |
| `25` | Default - every 25 rows, send what is collected if it is at least 16 KB |
| `> 1` | Every that many rows, send what is collected if it is at least 16 KB |

::: info Changed in 4.0.0
Rows used to be sent every `buffer_rows` rows, whatever their size. Since 4.0.0 they are sent once at least **16 KB** is collected (checked every `buffer_rows` rows) and at the end. A response smaller than 16 KB therefore arrives in one piece when the query finishes, which costs the server less, and a query that fails before anything was sent returns a proper error response instead of cut-off JSON. Use `@buffer_rows 0` for endpoints that should send rows as they are produced.

In the same release, `@buffer_rows 0` was fixed (it failed every request with a division by zero), and multi-statement SQL file endpoints follow the same rules as all other endpoints (they repeated rows when a statement returned more than `buffer_rows` rows).
:::

## Examples

### Disable Buffering

Write each row immediately to the response stream:

```sql
comment on function stream_live_data() is
'HTTP GET
@buffer_rows 0';
```

### Buffer Entire Response

Wait for all rows before sending response:

```sql
comment on function get_small_dataset() is
'HTTP GET
@buffer 1';
```

### Large Buffer for Throughput

```sql
comment on function export_all_data() is
'HTTP GET
@buffer_rows 5000';
```

### Small Buffer for Memory Efficiency

```sql
comment on function stream_data() is
'HTTP GET
@buffer 100';
```

## Behavior

- Controls how many rows are collected before they can be written to the response stream.
- Every that many rows, the collected rows are sent if they amount to at least 16 KB; the rest is sent when the query finishes.
- Applies to rows in JSON object arrays when returning records from the database (functions, tables, views and SQL files, including multi-statement SQL files).
- Buffering is more efficient than writing to the response stream for each row.
- Disabling buffering (`0`) costs noticeably more CPU per row; use it when rows must reach the client as they are produced.
- Higher values can have a negative impact on memory usage, especially with large datasets.
- As long as nothing was sent yet, a query that fails returns an error response; once rows were sent, the response can only be cut short.

## Performance Considerations

- **`0`**: Every row is written and flushed on its own - lowest latency for the first rows, highest cost per row.
- **Default (25)**: Responses under 16 KB are sent in one write; larger ones in pieces of at least 16 KB.
- **High values (1000+)**: Larger pieces, higher memory usage per request.
- **Value of 1**: Entire result buffered before sending, at any size - when you want all-or-nothing responses.

## Related

- `NpgsqlRestOptions.BufferRows` and `NpgsqlRestOptions.ResponseBufferBytes` - the defaults (25 rows, 16 KB) when NpgsqlRest is used as a library
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [COMMAND_TIMEOUT](./command-timeout) - Set query timeout
- [RAW](./raw) - Return raw text output

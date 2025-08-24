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

# BUFFER_ROWS

::: info Also known as
`buffer` (with or without `@` prefix)
:::

Set the number of rows to buffer in the string builder before sending the response.

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
| `0` | Disable buffering - write response for each row |
| `1` | Buffer the entire array (all rows) |
| `25` | Default - buffer 25 rows before writing |
| `> 1` | Buffer specified number of rows before writing |

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

- Controls how many rows are buffered in the string builder before writing to the response stream.
- Applies to rows in JSON object arrays when returning records from the database.
- Buffering is more efficient than writing to the response stream for each row.
- Disabling buffering (`0`) can have a slight negative impact on performance.
- Higher values can have a negative impact on memory usage, especially with large datasets.

## Performance Considerations

- **Low values (0-10)**: Lower memory usage, more response stream writes, slight performance overhead.
- **Default (25)**: Balanced trade-off between memory and performance.
- **High values (1000+)**: Better throughput, higher memory usage per request.
- **Value of 1**: Entire result buffered before sending - best for small datasets where you want atomic responses.

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure default buffer size
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [COMMAND_TIMEOUT](./command-timeout) - Set query timeout
- [RAW](./raw) - Return raw text output

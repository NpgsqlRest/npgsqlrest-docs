---
outline: [2, 3]
title: "COMMAND_TIMEOUT Annotation"
titleTemplate: NpgsqlRest
description: "Set query execution timeout for PostgreSQL REST API endpoints. Configure per-endpoint database command timeouts."
head:
  - - meta
    - name: keywords
      content: npgsqlrest timeout, query timeout, command timeout, postgresql timeout, api request timeout
  - - meta
    - property: og:title
      content: "NpgsqlRest COMMAND_TIMEOUT Annotation"
  - - meta
    - property: og:description
      content: "Set query execution timeout for individual PostgreSQL REST API endpoints."
  - - meta
    - property: og:type
      content: article
---

# COMMAND_TIMEOUT

::: info Also known as
`timeout` (with or without `@` prefix)
:::

Set the query execution timeout for the endpoint.

## Syntax

```
@timeout <interval>
@command_timeout <interval>
```

Or using custom parameter syntax:

```
@timeout = <interval>
@command_timeout = <interval>
```

The value uses the [interval format](./interval-format). Common examples:

| Unit | Examples |
|------|----------|
| Microseconds | `1000us`, `1000usec`, `1000microseconds` |
| Milliseconds | `500ms`, `500msec`, `500milliseconds` |
| Seconds | `30`, `30s`, `30sec`, `30seconds` |
| Minutes | `5m`, `5min`, `5minutes` |
| Hours | `1h`, `1hour`, `1hours` |
| Days | `1d`, `1day`, `1days` |
| Weeks | `1w`, `1week`, `1weeks` |

::: warning Single Token Requirement
The `@timeout` annotation reads only the **first token** after the keyword. Use formats without spaces to avoid parsing issues. Numbers without a unit default to seconds.
:::

## Default Value

The default timeout is configured via `NpgsqlRest.CommandTimeout` in configuration. If not set, defaults to 30 seconds.

## Examples

### Short Timeout

```sql
create function quick_lookup(_id int)
returns json
language sql
begin atomic;
select row_to_json(t) from table t where id = _id;
end;

comment on function quick_lookup(int) is
'HTTP GET
@timeout 5s';
```

### Long Running Query

```sql
create function generate_report(_year int)
returns json
language sql
begin atomic;
...complex aggregation...;
end;

comment on function generate_report(int) is
'HTTP GET
@timeout 2min
@authorize';
```

### Using Seconds Format

```sql
comment on function slow_process() is
'HTTP POST
@command_timeout 90s';
```

## Behavior

- Overrides the global `NpgsqlRest.CommandTimeout` configuration for this endpoint.
- Query is cancelled if it exceeds the timeout.
- On timeout, returns the response configured in `ErrorHandlingOptions.TimeoutErrorMapping`.

## Timeout Response

When a command times out, the response is determined by the `TimeoutErrorMapping` configuration:

```json
{
  "ErrorHandlingOptions": {
    "TimeoutErrorMapping": {
      "StatusCode": 504,
      "Title": "Command execution timed out",
      "Details": null,
      "Type": null
    }
  }
}
```

Default timeout response: **HTTP 504 Gateway Timeout**

See [Error Handling](../config/error-handling) for customizing timeout responses.

## Related

- [Interval Format](./interval-format) - Complete interval format reference
- [NpgsqlRest Options configuration](../config/npgsqlrest) - Set global `CommandTimeout` default
- [Error Handling configuration](../config/error-handling) - Configure `TimeoutErrorMapping` response
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [BUFFER_ROWS](./buffer-rows) - Control row buffering
- [RETRY_STRATEGY](./retry-strategy) - Retry on failure

## See Also

- [NpgsqlRest Options](/config/npgsqlrest) - Default timeout setting

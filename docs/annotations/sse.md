---
outline: [2, 3]
title: "SSE Annotation"
titleTemplate: NpgsqlRest
description: "Enable Server-Sent Events streaming for PostgreSQL REST APIs. Create real-time endpoints with SSE for live data updates."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sse, server sent events, real-time api, streaming endpoint, postgresql streaming, live updates
  - - meta
    - property: og:title
      content: "NpgsqlRest SSE Annotation"
  - - meta
    - property: og:description
      content: "Enable Server-Sent Events streaming for real-time data updates from PostgreSQL."
  - - meta
    - property: og:type
      content: article
---

# SSE

::: info Also known as
`sse_events_path`, `sse_path` (with or without `@` prefix)
:::

Enable Server-Sent Events (SSE) streaming for the endpoint.

## Syntax

```
@sse
@sse <path>
@sse <path> on <level>
```

**level**: `info`, `notice`, `warning`

## SSE Path Construction

The SSE endpoint path is constructed by **appending** the SSE path segment to the **original endpoint path**.

### When Path is Omitted

When the path is omitted (`@sse` without arguments), the SSE path segment defaults to the **notice level name in lowercase**:

| Level | SSE Path Segment |
|-------|------------------|
| `INFO` (default) | `info` |
| `NOTICE` | `notice` |
| `WARNING` | `warning` |

**Example:** If your endpoint path is `/api/my-function` and you use `@sse` without arguments, the SSE endpoint will be at `/api/my-function/info` (since `INFO` is the default level).

### When Custom Path is Specified

When you specify a custom path (`@sse my_events`), that path segment is appended to the endpoint path.

**Example:** If your endpoint path is `/api/my-function` and you use `@sse my_events`, the SSE endpoint will be at `/api/my-function/my_events`.

## Default Level

The default notice level is **`INFO`**. This can be changed globally via the [`DefaultServerSentEventsEventNoticeLevel`](../config/npgsqlrest#server-sent-events) configuration setting.

## Level Filtering

::: warning Important
SSE events are sent **only for the exact level specified**, not for "this level and above".
:::

When you set the level to `NOTICE`, only `RAISE NOTICE` statements will generate SSE events. `RAISE INFO` and `RAISE WARNING` statements will **not** generate SSE events for that endpoint.

| Configured Level | `RAISE INFO` | `RAISE NOTICE` | `RAISE WARNING` |
|------------------|--------------|----------------|-----------------|
| `INFO` | Sent | Not sent | Not sent |
| `NOTICE` | Not sent | Sent | Not sent |
| `WARNING` | Not sent | Not sent | Sent |

If you need events from multiple levels, create separate SSE endpoints for each level.

## Examples

### Basic SSE Endpoint

```sql
create function long_running_process(_id int)
returns void
language plpgsql
as $$
begin
  raise info 'Starting process...';
  -- do work
  raise info 'Progress: 50%%';
  -- more work
  raise info 'Complete!';
end;
$$;

comment on function long_running_process(int) is
'HTTP POST
@sse events';
```

If the endpoint is at `/api/long-running-process`, the SSE endpoint will be at `/api/long-running-process/events`. It receives `RAISE INFO` messages (the default level).

### With Notice Level

```sql
comment on function background_task() is
'HTTP POST
@sse updates on notice';
```

If the endpoint is at `/api/background-task`, the SSE endpoint will be at `/api/background-task/updates`. It receives **only** `RAISE NOTICE` messages.

### Warning Level Only

```sql
comment on function critical_job() is
'HTTP POST
@sse alerts on warning';
```

If the endpoint is at `/api/critical-job`, the SSE endpoint will be at `/api/critical-job/alerts`. It receives **only** `RAISE WARNING` messages.

### Using Default Path (Level Name)

```sql
comment on function my_process() is
'HTTP POST
@sse';
```

If the endpoint is at `/api/my-process`, the SSE endpoint will be at `/api/my-process/info` (default path segment from the default `INFO` level).

```sql
comment on function my_process() is
'HTTP POST
@sse_events_level notice
@sse';
```

If the endpoint is at `/api/my-process`, the SSE endpoint will be at `/api/my-process/notice` (path segment derived from the configured `NOTICE` level).

## Behavior

- Creates an SSE endpoint by appending the path segment to the original endpoint path
- PostgreSQL `RAISE` statements become SSE events
- Only statements matching the **exact configured level** generate events
- Clients connect to SSE path to receive real-time updates
- Use the `X-NpgsqlRest-ID` header to correlate SSE events to specific requests

## Related

- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure SSE options
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [SSE_EVENTS_LEVEL](./sse-events-level) - Set notice level
- [SSE_EVENTS_SCOPE](./sse-events-scope) - Set distribution scope

## See Also

- [NpgsqlRest Options](/config/npgsqlrest) - SSE configuration settings

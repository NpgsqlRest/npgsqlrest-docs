---
outline: [2, 3]
title: "SSE_EVENTS_LEVEL Annotation"
titleTemplate: NpgsqlRest
description: "Set minimum PostgreSQL notice level for Server-Sent Events. Filter SSE messages by severity (INFO, WARNING, ERROR)."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sse level, server sent events filter, notice level sse, postgresql notice events, sse severity filter
  - - meta
    - property: og:title
      content: "NpgsqlRest SSE_EVENTS_LEVEL Annotation"
  - - meta
    - property: og:description
      content: "Set minimum PostgreSQL notice level for Server-Sent Events filtering."
  - - meta
    - property: og:type
      content: article
---

# SSE_EVENTS_LEVEL

::: info Also known as
`sse_level` (with or without `@` prefix)
:::

Set the minimum PostgreSQL notice level for Server-Sent Events.

## Syntax

```
@sse_level <level>
@sse_events_level <level>
```

## Values

| Value | PostgreSQL Level |
|-------|------------------|
| `info` | INFO (default) |
| `notice` | NOTICE |
| `warning` | WARNING |

## Examples

### Info Level (All Messages)

```sql
comment on function verbose_process() is
'HTTP POST
@sse /events
@sse_level info';
```

Receives: `RAISE INFO`, `RAISE NOTICE`, `RAISE WARNING`

### Notice Level

```sql
comment on function standard_process() is
'HTTP POST
@sse /events
@sse_level notice';
```

Receives: `RAISE NOTICE`, `RAISE WARNING`

### Warning Level Only

```sql
comment on function quiet_process() is
'HTTP POST
@sse /events
@sse_level warning';
```

Receives: `RAISE WARNING` only

## Related

- [Server-Sent Events Guide](../guide/sse) — the full walkthrough
- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure SSE options
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [SSE](./sse) - Enable Server-Sent Events
- [SSE_EVENTS_SCOPE](./sse-events-scope) - Set distribution scope

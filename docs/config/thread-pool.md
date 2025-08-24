---
outline: [2, 3]
title: "Thread Pool Configuration"
titleTemplate: NpgsqlRest
description: "Configure .NET thread pool settings for NpgsqlRest performance. Worker threads, completion ports, and async optimization for high-throughput APIs."
head:
  - - meta
    - name: keywords
      content: npgsqlrest thread pool, api performance tuning, worker threads configuration, async optimization, high throughput api
  - - meta
    - property: og:title
      content: "NpgsqlRest Thread Pool Configuration"
  - - meta
    - property: og:description
      content: "Configure thread pool settings for optimal API performance and throughput."
  - - meta
    - property: og:type
      content: article
---

# Thread Pool

Thread pool configuration settings for optimizing application performance.

## Overview

```json
{
  "ThreadPool": {
    "MinWorkerThreads": null,
    "MinCompletionPortThreads": null,
    "MaxWorkerThreads": null,
    "MaxCompletionPortThreads": null
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `MinWorkerThreads` | int | `null` | Minimum number of worker threads in the thread pool. Uses system defaults if null. |
| `MinCompletionPortThreads` | int | `null` | Minimum number of completion port threads. Uses system defaults if null. |
| `MaxWorkerThreads` | int | `null` | Maximum number of worker threads in the thread pool. Uses system defaults if null. |
| `MaxCompletionPortThreads` | int | `null` | Maximum number of completion port threads. Uses system defaults if null. |

## Worker Threads vs Completion Port Threads

- **Worker threads** execute CPU-bound work and synchronous operations
- **Completion port threads** handle asynchronous I/O operations (database queries, HTTP requests)

## When to Configure

The default thread pool settings work well for most scenarios. Consider adjusting when:

- High-concurrency workloads cause thread pool starvation
- Application experiences delays during burst traffic
- Profiling indicates thread pool bottlenecks

## Example Configuration

High-concurrency configuration:

```json
{
  "ThreadPool": {
    "MinWorkerThreads": 100,
    "MinCompletionPortThreads": 100,
    "MaxWorkerThreads": 500,
    "MaxCompletionPortThreads": 500
  }
}
```

::: warning
Setting thread pool values too high can increase memory usage and context switching overhead. Test thoroughly before deploying to production.
:::

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Connection Settings](./connection) - Configure database connections
- [Server & SSL](./server) - Configure HTTPS and Kestrel web server

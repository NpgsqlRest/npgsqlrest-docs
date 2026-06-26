---
outline: [2, 3]
title: "Rate Limiter Configuration"
titleTemplate: NpgsqlRest
description: "Configure rate limiting for NpgsqlRest APIs. Control request rates with fixed window, sliding window, token bucket, and concurrency policies."
head:
  - - meta
    - name: keywords
      content: npgsqlrest rate limiter, api rate limiting, postgresql api throttling, request rate control, api throttle configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Rate Limiter Configuration"
  - - meta
    - property: og:description
      content: "Configure rate limiting with fixed window, sliding window, token bucket, and concurrency policies."
  - - meta
    - property: og:type
      content: article
---

# Rate Limiter

Rate limiting configuration to control the number of requests from clients. Apply policies to endpoints using the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation.

## Overview

```json
{
  "RateLimiterOptions": {
    "Enabled": false,
    "StatusCode": 429,
    "StatusMessage": "Too many requests. Please try again later.",
    "DefaultPolicy": null,
    "Policies": {
      "fixed": {
        "Type": "FixedWindow",
        "Enabled": false,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "sliding": {
        "Type": "SlidingWindow",
        "Enabled": false,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "bucket": {
        "Type": "TokenBucket",
        "Enabled": false,
        "TokenLimit": 100,
        "TokensPerPeriod": 10,
        "ReplenishmentPeriodSeconds": 10,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "concurrency": {
        "Type": "Concurrency",
        "Enabled": false,
        "PermitLimit": 10,
        "QueueLimit": 5,
        "OldestFirst": true
      },
      "per_user": {
        "Type": "FixedWindow",
        "Enabled": false,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "QueueLimit": 10,
        "AutoReplenishment": true,
        "Partition": {
          "Sources": [
            {
              "Type": "Claim",
              "Name": "name_identifier"
            },
            {
              "Type": "IpAddress"
            },
            {
              "Type": "Static",
              "Value": "anonymous"
            }
          ],
          "BypassAuthenticated": false
        }
      },
      "login_throttle": {
        "Type": "FixedWindow",
        "Enabled": false,
        "PermitLimit": 10,
        "WindowSeconds": 60,
        "QueueLimit": 0,
        "AutoReplenishment": true,
        "StatusMessage": "Too many login attempts. Please wait a minute and try again.",
        "Partition": {
          "Sources": [
            {
              "Type": "IpAddress"
            }
          ],
          "BypassAuthenticated": false
        }
      }
    }
  }
}
```

::: warning Breaking change in 3.13.0
`RateLimiterOptions:Policies` was previously an array of objects with explicit `"Name"` properties. It is now an **object keyed by policy name**, matching `ValidationOptions:Rules` and `CacheOptions:Profiles`. Migrate by moving each policy's `Name` value to be the JSON key and dropping the `Name` field. If you upgrade with the old array form still in your config, **startup will fail** with a clear `InvalidOperationException` telling you to migrate.
:::

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable rate limiting. |
| `StatusCode` | int | `429` | HTTP status code returned when rate limit is exceeded. |
| `StatusMessage` | string | `"Too many requests. Please try again later."` | Response message when rate limit is exceeded. |
| `DefaultPolicy` | string | `null` | Name of the default policy to apply to all endpoints. |
| `Policies` | object | `{}` | Named rate limiting policies, keyed by policy name. Assign a policy to an endpoint using the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation. |

## Policy Types

Four policy types are available:

- **FixedWindow** - Fixed time window rate limiting
- **SlidingWindow** - Sliding time window rate limiting
- **TokenBucket** - Token bucket algorithm
- **Concurrency** - Concurrent request limiting

## Fixed Window Policy

Limits requests within fixed time intervals.

```json
{
  "Policies": {
    "fixed": {
      "Type": "FixedWindow",
      "Enabled": true,
      "PermitLimit": 100,
      "WindowSeconds": 60,
      "QueueLimit": 10,
      "AutoReplenishment": true
    }
  }
}
```

The JSON key (`"fixed"`) is the policy name used with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"FixedWindow"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `PermitLimit` | int | `100` | Maximum requests allowed per window. |
| `WindowSeconds` | int | `60` | Window duration in seconds. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish permits. |
| `StatusCode` | int | global | Optional. HTTP status code returned when *this* policy rejects a request, overriding `RateLimiterOptions:StatusCode`. Omit to inherit the global value. See [Per-Policy Status Code and Message](#per-policy-status-code-and-message). |
| `StatusMessage` | string | global | Optional. Response message when *this* policy rejects a request, overriding `RateLimiterOptions:StatusMessage`. Omit to inherit the global value. |
| `Partition` | object | `null` | Optional [Partition block](#per-user-rate-limiting-partition) for per-user / per-IP / per-header rate limiting. |

See [Fixed Window Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#fixed) documentation.

## Sliding Window Policy

Limits requests using a sliding time window with segments.

```json
{
  "Policies": {
    "sliding": {
      "Type": "SlidingWindow",
      "Enabled": true,
      "PermitLimit": 100,
      "WindowSeconds": 60,
      "SegmentsPerWindow": 6,
      "QueueLimit": 10,
      "AutoReplenishment": true
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"SlidingWindow"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `PermitLimit` | int | `100` | Maximum requests allowed per window. |
| `WindowSeconds` | int | `60` | Window duration in seconds. |
| `SegmentsPerWindow` | int | `6` | Number of segments dividing the window. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish permits. |
| `StatusCode` | int | global | Optional. HTTP status code returned when *this* policy rejects a request, overriding `RateLimiterOptions:StatusCode`. Omit to inherit the global value. See [Per-Policy Status Code and Message](#per-policy-status-code-and-message). |
| `StatusMessage` | string | global | Optional. Response message when *this* policy rejects a request, overriding `RateLimiterOptions:StatusMessage`. Omit to inherit the global value. |
| `Partition` | object | `null` | Optional [Partition block](#per-user-rate-limiting-partition) for per-user / per-IP / per-header rate limiting. |

See [Sliding Window Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#sliding-window-limiter) documentation.

## Token Bucket Policy

Limits requests using the token bucket algorithm.

```json
{
  "Policies": {
    "bucket": {
      "Type": "TokenBucket",
      "Enabled": true,
      "TokenLimit": 100,
      "TokensPerPeriod": 10,
      "ReplenishmentPeriodSeconds": 10,
      "QueueLimit": 10,
      "AutoReplenishment": true
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"TokenBucket"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `TokenLimit` | int | `100` | Maximum tokens in the bucket. |
| `TokensPerPeriod` | int | `10` | Number of tokens to add per replenishment period. |
| `ReplenishmentPeriodSeconds` | int | `10` | How often tokens are added to the bucket. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish tokens. |
| `StatusCode` | int | global | Optional. HTTP status code returned when *this* policy rejects a request, overriding `RateLimiterOptions:StatusCode`. Omit to inherit the global value. See [Per-Policy Status Code and Message](#per-policy-status-code-and-message). |
| `StatusMessage` | string | global | Optional. Response message when *this* policy rejects a request, overriding `RateLimiterOptions:StatusMessage`. Omit to inherit the global value. |
| `Partition` | object | `null` | Optional [Partition block](#per-user-rate-limiting-partition) for per-user / per-IP / per-header rate limiting. |

See [Token Bucket Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#token-bucket-limiter) documentation.

## Concurrency Policy

Limits the number of concurrent requests.

```json
{
  "Policies": {
    "concurrency": {
      "Type": "Concurrency",
      "Enabled": true,
      "PermitLimit": 10,
      "QueueLimit": 5,
      "OldestFirst": true
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"Concurrency"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `PermitLimit` | int | `10` | Maximum concurrent requests. |
| `QueueLimit` | int | `5` | Maximum queued requests when limit is reached. |
| `OldestFirst` | bool | `true` | Process queued requests oldest first. |
| `StatusCode` | int | global | Optional. HTTP status code returned when *this* policy rejects a request, overriding `RateLimiterOptions:StatusCode`. Omit to inherit the global value. See [Per-Policy Status Code and Message](#per-policy-status-code-and-message). |
| `StatusMessage` | string | global | Optional. Response message when *this* policy rejects a request, overriding `RateLimiterOptions:StatusMessage`. Omit to inherit the global value. |
| `Partition` | object | `null` | Optional [Partition block](#per-user-rate-limiting-partition) for per-user / per-IP / per-header rate limiting. |

See [Concurrency Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#concurrency-limiter) documentation.

## Per-User Rate Limiting (Partition)

::: tip New in 3.13.0
Rate-limiter policies can now be partitioned at request time, so each request gets its own bucket based on a value derived from `HttpContext` (a claim, an IP, a header, or a static fallback).
:::

The classic use case is **per-user throttling**: each authenticated user gets their own quota instead of all users sharing one global bucket. Without `Partition`, all requests under a policy share a single global bucket.

```jsonc
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": {
      "per_user": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "Partition": {
          "Sources": [
            { "Type": "Claim", "Name": "name_identifier" },
            { "Type": "IpAddress" },
            { "Type": "Static", "Value": "anonymous" }
          ]
        }
      },
      "throttle_anon_only": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 10,
        "WindowSeconds": 60,
        "Partition": {
          "BypassAuthenticated": true,
          "Sources": [{ "Type": "IpAddress" }]
        }
      }
    }
  }
}
```

### Partition Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Sources` | array | - | Ordered list of partition key sources. Walked top-to-bottom at request time; the first source returning a non-empty value wins. If no source resolves, partition resolution falls through to the literal key `"unpartitioned"`. |
| `BypassAuthenticated` | bool | `false` | When `true`, signed-in users skip the limiter entirely. Evaluated **before** `Sources`, so use this for "throttle anonymous only" patterns. |

### Source Types

| Type | Behavior | `Name` required? |
|------|----------|------------------|
| `Claim` | Reads `HttpContext.User.FindFirst(Name).Value`. | Yes (the claim type, e.g., `"name_identifier"`). |
| `IpAddress` | Reads the client IP via `HttpRequest.GetClientIpAddress()`, which honors `X-Forwarded-For` / `X-Real-IP` ahead of `Connection.RemoteIpAddress`. | No |
| `Header` | Reads `HttpContext.Request.Headers[Name]`. | Yes (the header name). |
| `Static` | Always returns the configured `Value`. Useful as a terminal fallback (e.g., everyone unmatched shares the `"anonymous"` bucket). | Uses `Value` instead. |

**Behavior is unchanged for policies without a `Partition` block.** Each non-partitioned policy still uses a single global bucket.

Each `Sources` entry is validated at startup — invalid entries (e.g., `Claim` without `Name`, unknown `Type`) are logged at `Warning` and skipped. If a `Partition` block has no usable sources and `BypassAuthenticated` is false, the partition is dropped (with a Warning) and the policy reverts to a single global bucket.

## Per-Policy Status Code and Message

::: tip New in 3.16.2
Each named policy can set its own `StatusCode` and/or `StatusMessage`, overriding the global `RateLimiterOptions:StatusCode` / `RateLimiterOptions:StatusMessage` for requests rejected by that policy. A policy that omits either field inherits the global value.
:::

Previously the global `StatusCode` / `StatusMessage` were the only values returned for any rejected request, so a login-specific message (e.g. *"Too many login attempts…"*) would be returned for **every** rate-limited endpoint. Now the override is resolved at rejection time from the endpoint's policy, so each policy can speak for itself:

```jsonc
{
  "RateLimiterOptions": {
    "Enabled": true,
    "StatusCode": 429,                                  // global default
    "StatusMessage": "Too many requests. Please slow down.",
    "Policies": {
      "login_throttle": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 10,
        "WindowSeconds": 60,
        "StatusMessage": "Too many login attempts. Please wait a minute and try again.",
        "Partition": { "Sources": [ { "Type": "IpAddress" } ] }
      },
      "api": {
        "Type": "TokenBucket",
        "Enabled": true,
        "StatusCode": 503,
        "StatusMessage": "API capacity reached. Retry shortly."
      }
    }
  }
}
```

A request rejected by `login_throttle` returns `429` (inherited) with the login message; a request rejected by `api` returns `503` with the API message. This is fully backward compatible — configs that set only the global values behave exactly as before.

### Ready-to-use `login_throttle` policy

The shipped `appsettings.json` includes a disabled `login_throttle` policy — 10 attempts per minute partitioned per client IP, with its own rejection message — so the common case is one flag away:

```jsonc
{
  "RateLimiterOptions": {
    "Policies": {
      "login_throttle": {
        "Type": "FixedWindow",
        "Enabled": false,
        "PermitLimit": 10,
        "WindowSeconds": 60,
        "QueueLimit": 0,
        "AutoReplenishment": true,
        "StatusMessage": "Too many login attempts. Please wait a minute and try again.",
        "Partition": { "Sources": [ { "Type": "IpAddress" } ], "BypassAuthenticated": false }
      }
    }
  }
}
```

Set `"Enabled": true` and apply it to a login endpoint with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation (`rate_limiter login_throttle`), or set it as `DefaultPolicy`.

## Complete Example

Configuration with multiple policies:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "StatusCode": 429,
    "StatusMessage": "Too many requests. Please try again later.",
    "DefaultPolicy": "bucket",
    "Policies": {
      "fixed": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "sliding": {
        "Type": "SlidingWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "bucket": {
        "Type": "TokenBucket",
        "Enabled": true,
        "TokenLimit": 100,
        "TokensPerPeriod": 10,
        "ReplenishmentPeriodSeconds": 10,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      "concurrency": {
        "Type": "Concurrency",
        "Enabled": true,
        "PermitLimit": 10,
        "QueueLimit": 5,
        "OldestFirst": true
      },
      "per_user": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "QueueLimit": 10,
        "AutoReplenishment": true,
        "Partition": {
          "Sources": [
            { "Type": "Claim", "Name": "name_identifier" },
            { "Type": "IpAddress" },
            { "Type": "Static", "Value": "anonymous" }
          ]
        }
      }
    }
  }
}
```

## Rate Limiting Scope

Rate-limit policies are applied at the **HTTP route level**. Every request arriving over HTTP is metered by the policy of the route it hits. Three invocation paths execute endpoints **in-process**, without passing through the target endpoint's route — by design, the target's own `rate_limiter` policy is **not** consulted on these paths:

| Invocation path | What still applies | How it is throttled |
|---|---|---|
| [HTTP client type](./http-client) self-calls (a type's URL targets the same server) | the target's `authorize` and all execution-level annotations (the caller's principal is forwarded) | by the **calling** endpoint's own route policy |
| [Proxy](../annotations/proxy) self-calls (`@proxy` / `@proxy_out` targeting own URL) | same as above | by the **proxy** endpoint's own route policy |
| [MCP](../config/mcp) `tools/call` | same as above | by [`McpOptions.RateLimiterPolicy`](../config/mcp#ratelimiterpolicy) on the whole `/mcp` route (a routine's `@rate_limiter` does not carry to tool calls; a startup warning is logged for `@mcp` routines that also have `@rate_limiter`) |

In short: these paths cannot be reached by a client directly — they exist only where you explicitly composed them in SQL or config — and the outer route that the client *does* hit is where its rate limit applies.

## Related

- [rate_limiter_policy annotation](../annotations/rate-limiter-policy) - Apply rate limiting policies to endpoints
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [CORS](./cors) - Configure Cross-Origin Resource Sharing

## See Also

- [RATE_LIMITER_POLICY](/annotations/rate-limiter-policy) - Apply rate limiting to endpoints

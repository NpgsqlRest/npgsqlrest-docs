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
    "Policies": {}
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
| `Partition` | object | `null` | Optional [Partition block](#per-user-rate-limiting-partition) for per-user / per-IP / per-header rate limiting. |

See [Concurrency Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#concurrency-limiter) documentation.

## Per-User Rate Limiting (Partition)

::: tip New in 3.13.0
Rate-limiter policies can now be partitioned at request time, so each request gets its own bucket based on a value derived from `HttpContext` (a claim, an IP, a header, or a static fallback).
:::

The classic use case is **per-user throttling**: each authenticated user gets their own quota instead of all users sharing one global bucket. Without `Partition`, all requests under a policy share a single global bucket.

```jsonc
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

## Related

- [rate_limiter_policy annotation](../annotations/rate-limiter-policy) - Apply rate limiting policies to endpoints
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Server & SSL](./server) - Configure HTTPS and Kestrel web server
- [CORS](./cors) - Configure Cross-Origin Resource Sharing

## See Also

- [RATE_LIMITER_POLICY](/annotations/rate-limiter-policy) - Apply rate limiting to endpoints

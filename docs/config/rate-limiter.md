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
    "Policies": []
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable rate limiting. |
| `StatusCode` | int | `429` | HTTP status code returned when rate limit is exceeded. |
| `StatusMessage` | string | `"Too many requests. Please try again later."` | Response message when rate limit is exceeded. |
| `DefaultPolicy` | string | `null` | Name of the default policy to apply to all endpoints. |
| `Policies` | array | `[]` | List of rate limiting policies. Assign a policy to an endpoint using the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation. |

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
  "Type": "FixedWindow",
  "Enabled": true,
  "Name": "fixed",
  "PermitLimit": 100,
  "WindowSeconds": 60,
  "QueueLimit": 10,
  "AutoReplenishment": true
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"FixedWindow"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `Name` | string | - | Policy name. Use this name with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation to apply this policy to an endpoint. |
| `PermitLimit` | int | `100` | Maximum requests allowed per window. |
| `WindowSeconds` | int | `60` | Window duration in seconds. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish permits. |

See [Fixed Window Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#fixed) documentation.

## Sliding Window Policy

Limits requests using a sliding time window with segments.

```json
{
  "Type": "SlidingWindow",
  "Enabled": true,
  "Name": "sliding",
  "PermitLimit": 100,
  "WindowSeconds": 60,
  "SegmentsPerWindow": 6,
  "QueueLimit": 10,
  "AutoReplenishment": true
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"SlidingWindow"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `Name` | string | - | Policy name. Use this name with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation to apply this policy to an endpoint. |
| `PermitLimit` | int | `100` | Maximum requests allowed per window. |
| `WindowSeconds` | int | `60` | Window duration in seconds. |
| `SegmentsPerWindow` | int | `6` | Number of segments dividing the window. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish permits. |

See [Sliding Window Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#sliding-window-limiter) documentation.

## Token Bucket Policy

Limits requests using the token bucket algorithm.

```json
{
  "Type": "TokenBucket",
  "Enabled": true,
  "Name": "bucket",
  "TokenLimit": 100,
  "TokensPerPeriod": 10,
  "ReplenishmentPeriodSeconds": 10,
  "QueueLimit": 10,
  "AutoReplenishment": true
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"TokenBucket"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `Name` | string | - | Policy name. Use this name with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation to apply this policy to an endpoint. |
| `TokenLimit` | int | `100` | Maximum tokens in the bucket. |
| `TokensPerPeriod` | int | `10` | Number of tokens to add per replenishment period. |
| `ReplenishmentPeriodSeconds` | int | `10` | How often tokens are added to the bucket. |
| `QueueLimit` | int | `10` | Maximum queued requests when limit is reached. |
| `AutoReplenishment` | bool | `true` | Automatically replenish tokens. |

See [Token Bucket Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#token-bucket-limiter) documentation.

## Concurrency Policy

Limits the number of concurrent requests.

```json
{
  "Type": "Concurrency",
  "Enabled": true,
  "Name": "concurrency",
  "PermitLimit": 10,
  "QueueLimit": 5,
  "OldestFirst": true
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Type` | string | - | Must be `"Concurrency"`. |
| `Enabled` | bool | `false` | Enable this policy. |
| `Name` | string | - | Policy name. Use this name with the [rate_limiter_policy](../annotations/rate-limiter-policy) annotation to apply this policy to an endpoint. |
| `PermitLimit` | int | `10` | Maximum concurrent requests. |
| `QueueLimit` | int | `5` | Maximum queued requests when limit is reached. |
| `OldestFirst` | bool | `true` | Process queued requests oldest first. |

See [Concurrency Limiter](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit#concurrency-limiter) documentation.

## Complete Example

Configuration with multiple policies:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "StatusCode": 429,
    "StatusMessage": "Too many requests. Please try again later.",
    "DefaultPolicy": "bucket",
    "Policies": [
      {
        "Type": "FixedWindow",
        "Enabled": true,
        "Name": "fixed",
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      {
        "Type": "SlidingWindow",
        "Enabled": true,
        "Name": "sliding",
        "PermitLimit": 100,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      {
        "Type": "TokenBucket",
        "Enabled": true,
        "Name": "bucket",
        "TokenLimit": 100,
        "TokensPerPeriod": 10,
        "ReplenishmentPeriodSeconds": 10,
        "QueueLimit": 10,
        "AutoReplenishment": true
      },
      {
        "Type": "Concurrency",
        "Enabled": true,
        "Name": "concurrency",
        "PermitLimit": 10,
        "QueueLimit": 5,
        "OldestFirst": true
      }
    ]
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

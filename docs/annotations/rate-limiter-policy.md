---
outline: [2, 3]
title: "RATE_LIMITER_POLICY Annotation"
titleTemplate: NpgsqlRest
description: "Apply rate limiting policies to PostgreSQL REST API endpoints. Control request rates per endpoint with configured policies."
head:
  - - meta
    - name: keywords
      content: npgsqlrest rate limiter, api throttling, request rate limit, endpoint throttle, rate limit policy
  - - meta
    - property: og:title
      content: "NpgsqlRest RATE_LIMITER_POLICY Annotation"
  - - meta
    - property: og:description
      content: "Apply rate limiting policies to control request rates per endpoint."
  - - meta
    - property: og:type
      content: article
---

# RATE_LIMITER_POLICY

::: info Also known as
`rate_limiter_policy`, `rate_limiter` (with or without `@` prefix)
:::

Apply a rate limiting policy to the endpoint. The policy name must match a policy configured in the [Rate Limiter configuration](../config/rate-limiter).

## Syntax

```
@rate_limiter_policy <policy-name>
@rate_limiter <policy-name>
```

## Examples

### Fixed Window Policy

Apply a fixed window rate limiter to an API endpoint:

```sql
comment on function public_api() is
'HTTP GET
@rate_limiter_policy fixed';
```

With configuration:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": [
      {
        "Type": "FixedWindow",
        "Enabled": true,
        "Name": "fixed",
        "PermitLimit": 100,
        "WindowSeconds": 60
      }
    ]
  }
}
```

### Token Bucket Policy

Apply a token bucket rate limiter to an expensive operation:

```sql
comment on function expensive_operation() is
'HTTP POST
@rate_limiter bucket';
```

With configuration:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": [
      {
        "Type": "TokenBucket",
        "Enabled": true,
        "Name": "bucket",
        "TokenLimit": 10,
        "ReplenishmentPeriodSeconds": 60
      }
    ]
  }
}
```

### Combined with Authorization

Apply rate limiting to an authenticated endpoint:

```sql
comment on function protected_resource() is
'HTTP GET
@authorize
@rate_limiter authenticated_limit';
```

With configuration:

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "Policies": [
      {
        "Type": "SlidingWindow",
        "Enabled": true,
        "Name": "authenticated_limit",
        "PermitLimit": 1000,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6
      }
    ]
  }
}
```

## Behavior

- The policy name must match the `Name` field of a policy defined in the [Rate Limiter configuration](../config/rate-limiter#complete-example)
- If the policy name doesn't match any configured policy, rate limiting won't be applied
- Returns `429 Too Many Requests` when limit exceeded (status code and message are [configurable](../config/rate-limiter#settings-reference))
- Policy defines requests per time window based on the [policy type](../config/rate-limiter#policy-types) (FixedWindow, SlidingWindow, TokenBucket, or Concurrency)

## Related

- [Rate Limiter configuration](../config/rate-limiter) - Configure rate limiting policies
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [AUTHORIZE](./authorize) - Require authentication

## See Also

- [Rate Limiter](/config/rate-limiter) - Configure rate limiting policies

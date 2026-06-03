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
    "Policies": {
      "fixed": {
        "Type": "FixedWindow",
        "Enabled": true,
        "PermitLimit": 100,
        "WindowSeconds": 60
      }
    }
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
    "Policies": {
      "bucket": {
        "Type": "TokenBucket",
        "Enabled": true,
        "TokenLimit": 10,
        "ReplenishmentPeriodSeconds": 60
      }
    }
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
    "Policies": {
      "authenticated_limit": {
        "Type": "SlidingWindow",
        "Enabled": true,
        "PermitLimit": 1000,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6
      }
    }
  }
}
```

### Per-User Rate Limiting

Apply per-user rate limiting using a [partitioned policy](../config/rate-limiter#per-user-rate-limiting-partition):

```sql
comment on function user_dashboard() is
'HTTP GET
@authorize
@rate_limiter per_user';
```

With configuration:

```json
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
      }
    }
  }
}
```

Each authenticated user gets their own quota instead of all users sharing one global bucket.

## Behavior

- The policy name must match a key in the `Policies` dictionary defined in the [Rate Limiter configuration](../config/rate-limiter#complete-example)
- If the policy name doesn't match any configured policy, rate limiting won't be applied
- Returns `429 Too Many Requests` when limit exceeded (status code and message are [configurable](../config/rate-limiter#settings-reference))
- Policy defines requests per time window based on the [policy type](../config/rate-limiter#policy-types) (FixedWindow, SlidingWindow, TokenBucket, or Concurrency)
- Policies with a `Partition` block bucket requests per-user / per-IP / per-header instead of using a single global bucket
- The policy applies to **HTTP requests hitting this endpoint's route**. It is not consulted when the endpoint is invoked in-process — via HTTP client type self-calls, proxy self-calls, or MCP `tools/call` (use [`McpOptions.RateLimiterPolicy`](../config/mcp#ratelimiterpolicy) for agent traffic). See [Rate Limiting Scope](../config/rate-limiter#rate-limiting-scope)

## Related

- [Rate Limiter configuration](../config/rate-limiter) - Configure rate limiting policies
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [AUTHORIZE](./authorize) - Require authentication

## See Also

- [Rate Limiter](/config/rate-limiter) - Configure rate limiting policies

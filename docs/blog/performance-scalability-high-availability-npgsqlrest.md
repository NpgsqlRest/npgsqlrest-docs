---
layout: doc
outline: [2, 3]
title: "Performance, Scalability, and High Availability with NpgsqlRest"
titleTemplate: NpgsqlRest
description: "Production-ready API configuration: response caching, retry logic, rate limiting, PostgreSQL multi-host failover, and load balancing. Complete guide with examples."
head:
  - - meta
    - name: keywords
      content: postgresql api caching, api rate limiting, postgresql high availability, postgresql load balancing, npgsql failover, api retry logic, postgresql connection pooling, production api
  - - meta
    - property: og:title
      content: "Performance, Scalability, and High Availability with NpgsqlRest"
  - - meta
    - property: og:description
      content: "Production-ready API config: caching, retry logic, rate limiting, PostgreSQL multi-host failover."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Performance & High Availability with NpgsqlRest"
  - - meta
    - name: twitter:description
      content: "Production-ready API: caching, rate limiting, PostgreSQL failover and load balancing."
---

# Performance, Scalability, and High Availability with NpgsqlRest

<p class="blog-meta">
<span class="tag">Performance</span> · <span class="tag">Scalability</span> · <span class="tag">High Availability</span> · <span class="tag">January 2026</span>
</p>

---

Building production-ready APIs requires more than just functional correctness. You need **caching** to reduce load, **retry logic** to handle transient failures, **rate limiting** to protect your infrastructure, and **high availability** configurations to ensure uptime.

NpgsqlRest provides comprehensive built-in support for all of these concerns. This guide walks through each feature with practical examples you can implement today.

## Caching Strategies

Caching is your first line of defense against unnecessary database load. NpgsqlRest supports two complementary caching layers: **HTTP caching** (browser/CDN level) and **server-side caching** (application level).

### HTTP Cache Headers: The Fastest Cache

The fastest request is the one that never reaches your server. HTTP caching via `Cache-Control` headers lets browsers and CDNs serve responses without touching your infrastructure at all.

When a browser or CDN has a cached response that hasn't expired, **your server receives zero requests**. This is fundamentally different from server-side caching—with HTTP caching, there's no network round-trip, no connection pool usage, nothing.

#### Setting Cache Headers in Annotations

NpgsqlRest allows you to set any HTTP response header directly in comment annotations using the `Header-Name: value` format:

```sql
create function get_product_catalog()
returns json
language sql
begin atomic;
select json_agg(p) from products p where active;
end;

comment on function get_product_catalog() is
'HTTP GET
Cache-Control: public, max-age=3600';
```

This tells browsers and CDNs to cache the response for 1 hour (3600 seconds). You can combine multiple headers:

```sql
comment on function get_static_config() is
'HTTP GET
Cache-Control: public, max-age=86400
ETag: "v1.0"
Vary: Accept-Encoding';
```

Common `Cache-Control` directives:

| Directive | Meaning |
|-----------|---------|
| `public` | Can be cached by browsers and CDNs |
| `private` | Only browser can cache, not CDNs |
| `max-age=N` | Cache for N seconds |
| `no-cache` | Must revalidate before using cached copy |
| `no-store` | Never cache |

For authenticated endpoints, use `private` to prevent CDNs from serving one user's data to another:

```sql
comment on function get_user_dashboard() is
'HTTP GET
@authorize
Cache-Control: private, max-age=300';
```

#### Cache Busting Technique

The challenge with aggressive HTTP caching is invalidation. How do you force clients to fetch fresh data when the underlying data changes?

The standard technique is **cache busting via URL parameters**. Add a version or timestamp parameter that changes when data is updated:

```
GET /api/products?v=1
GET /api/products?v=2    # After data update - treated as new URL
```

The parameter doesn't need to do anything server-side—it simply makes the URL unique, causing browsers and CDNs to treat it as a completely different resource. Your function can ignore it entirely:

```sql
create function get_products(_v text default null)
returns json
language sql
begin atomic;
    select json_agg(p) from products p;
end;

comment on function get_products(text) is
'HTTP GET
Cache-Control: public, max-age=31536000';
```

The `_v` parameter exists only to differentiate cache keys. When you update your products, change `v=1` to `v=2` in your client code, and every user gets fresh data. With this pattern, you can set very long cache times (the example uses 1 year) because you control invalidation through URL changes.

This technique is particularly powerful when combined with CDNs like Cloudflare or CloudFront, which cache at edge locations globally.

### Server-Side Caching

When HTTP caching isn't sufficient—perhaps you need more control over invalidation, or you're dealing with authenticated endpoints that can't be cached by CDNs—NpgsqlRest provides built-in server-side caching.

#### Enabling Server Cache

Enable caching in your configuration:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory"
  }
}
```

Then annotate specific endpoints:

```sql
create function get_app_settings()
returns json
language sql
begin atomic;
select settings from app_config where id = 1;
end;

comment on function get_app_settings() is
'HTTP GET
@cached';
```

When a cached endpoint is hit and the cache is warm, **no database connection is opened**. This is critical for high-traffic endpoints—you're not just saving database CPU cycles, you're preserving your connection pool for requests that actually need it.

#### Cache Keys by Parameter

For endpoints with parameters, specify which parameters form the cache key:

```sql
create function get_user_profile(_user_id int)
returns json
language sql
begin atomic;
select row_to_json(u) from users u where id = _user_id;
end;

comment on function get_user_profile(int) is
'HTTP GET
@cached _user_id';
```

Different `_user_id` values create separate cache entries. A request for user 1 and user 2 are cached independently.

For multiple parameters:

```sql
comment on function get_report(int, text) is
'HTTP GET
@cached _year, _department';
```

#### Cache Expiration

Control how long entries stay cached:

```sql
comment on function get_dashboard_stats() is
'HTTP GET
@cached
@cache_expires_in 5m';
```

Supported formats: `10s` (seconds), `5m` (minutes), `1h` (hour), `1d` (day), `1w` (week).

### Cache Types

NpgsqlRest supports three cache backends, each suited for different deployment scenarios.

#### Memory Cache

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Memory",
    "MemoryCachePruneIntervalSeconds": 60
  }
}
```

Best for:
- Single-instance deployments
- Development environments
- Low-memory scenarios where you don't want external dependencies

Limitation: Each application instance maintains its own cache. If you run multiple instances, they won't share cached data.

#### Redis Cache

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Redis",
    "RedisConfiguration": "localhost:6379,abortConnect=false,ssl=false"
  }
}
```

Best for:
- Multi-instance deployments
- Production environments requiring cache sharing
- Scenarios where cache persistence across restarts matters

#### Hybrid Cache

The most sophisticated option, using Microsoft's `HybridCache`:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Hybrid",
    "HybridCacheUseRedisBackend": true,
    "RedisConfiguration": "localhost:6379,abortConnect=false",
    "HybridCacheDefaultExpiration": "5 minutes",
    "HybridCacheLocalCacheExpiration": "1 minute"
  }
}
```

Hybrid cache provides:
- **L1 (local) cache**: Fast in-memory access for frequently used data
- **L2 (Redis) cache**: Shared storage across instances
- **Stampede protection**: Prevents multiple concurrent requests from hitting the database when cache expires

Without stampede protection, when a popular cached entry expires, every concurrent request tries to refresh it simultaneously—potentially overwhelming your database. Hybrid cache ensures only one request fetches fresh data while others wait.

You can use Hybrid cache without Redis for stampede protection alone:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "Type": "Hybrid",
    "HybridCacheUseRedisBackend": false
  }
}
```

### Cache Invalidation Endpoints

NpgsqlRest can automatically create invalidation endpoints for programmatic cache clearing:

```json
{
  "CacheOptions": {
    "Enabled": true,
    "InvalidateCacheSuffix": "invalidate"
  }
}
```

Usage:

```
GET /api/get-user/?id=123           -> Returns cached user data
GET /api/get-user/invalidate?id=123 -> Clears cache entry
GET /api/get-user/?id=123           -> Fresh data from database
```

The invalidation endpoint:
- Uses the same authentication as the original endpoint
- Accepts the same parameters (to match the cache key)
- Returns `{"invalidated": true}` or `{"invalidated": false}`

This is invaluable when you need to programmatically invalidate cache after data modifications without waiting for expiration.

### Caching Set-Returning Functions

Server-side caching works for functions returning multiple rows:

```sql
create function get_all_users()
returns table(id int, name text)
language sql
begin atomic;
select id, name from users;
end;

comment on function get_all_users() is
'HTTP GET
@cached
@cache_expires_in 5 minutes';
```

Protect against caching excessively large result sets:

```json
{
  "CacheOptions": {
    "MaxCacheableRows": 1000
  }
}
```

Results exceeding this limit are returned but not cached—preventing memory issues from unexpectedly large queries.

## Retry Strategies

Transient failures are inevitable in distributed systems. Database connections drop, servers restart, deadlocks occur. NpgsqlRest provides two levels of retry handling: **connection retries** and **command retries**.

### Connection Retries

Connection retry handles failures when establishing a database connection:

```json
{
  "ConnectionSettings": {
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [1, 3, 6, 12],
      "ErrorCodes": ["08000", "08003", "08006", "08001", "08004", "55P03", "55006", "53300", "57P03", "40001"]
    }
  }
}
```

The `RetrySequenceSeconds` array defines delays between attempts:
- First retry: after 1 second
- Second retry: after 3 seconds
- Third retry: after 6 seconds
- Fourth retry: after 12 seconds

Default error codes cover common transient scenarios:

| Code | Description |
|------|-------------|
| `08000` | General connection error |
| `08003` | Connection lost |
| `08006` | Connection failed |
| `53300` | Too many connections |
| `57P03` | Server starting up |
| `40001` | Serialization failure |

For high-availability deployments where brief connection issues are expected during failovers:

```json
{
  "ConnectionSettings": {
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [0.5, 1, 2, 4, 8, 16, 32],
      "ErrorCodes": ["08000", "08003", "08006", "57P03"]
    }
  }
}
```

### Command Retries

Command retry handles failures during query execution—after the connection is established:

```json
{
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 1, 2, 5, 10],
        "ErrorCodes": [
          "40001", "40P01",
          "08000", "08003", "08006", "08001", "08004",
          "53000", "53100", "53200", "53300", "53400",
          "57P01", "57P02", "57P03",
          "55P03", "55006", "55000"
        ]
      }
    }
  }
}
```

Note the first retry is `0` (immediate)—for serialization failures and deadlocks, immediate retry often succeeds because the conflict is resolved.

#### Multiple Retry Strategies

Define different strategies for different workloads:

```json
{
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 1, 2, 5, 10],
        "ErrorCodes": ["40001", "40P01", "08000", "08003", "08006"]
      },
      "aggressive": {
        "RetrySequenceSeconds": [0, 0.5, 1, 2, 5, 10, 30],
        "ErrorCodes": ["40001", "40P01", "08000", "08003", "08006", "53300", "57P03"]
      },
      "minimal": {
        "RetrySequenceSeconds": [0, 1],
        "ErrorCodes": ["40001", "40P01"]
      }
    }
  }
}
```

Assign strategies per endpoint:

```sql
-- Critical payment processing - aggressive retries
comment on function process_payment() is
'HTTP POST
@retry aggressive';

-- Fast lookup - minimal retries to fail fast
comment on function quick_lookup() is
'HTTP GET
@retry minimal';
```

### PostgreSQL Error Code Classes

Understanding error codes helps you configure appropriate retry behavior:

| Class | Codes | Description |
|-------|-------|-------------|
| 40 | `40001`, `40P01` | Serialization failures, deadlocks—**always retry** |
| 08 | `08000`-`08P01` | Connection issues—retry with backoff |
| 53 | `53000`-`53400` | Resource constraints (connections, memory, disk) |
| 57 | `57P01`-`57P03` | Operator intervention (shutdown, restart) |
| 55 | `55P03`, `55006` | Lock contention |

The full list is available in the [PostgreSQL Error Codes documentation](https://www.postgresql.org/docs/current/errcodes-appendix.html).

## Rate Limiting

Rate limiting protects your API from abuse and ensures fair resource allocation. NpgsqlRest integrates ASP.NET Core's rate limiting middleware with four policy types.

### Enabling Rate Limiting

```json
{
  "RateLimiterOptions": {
    "Enabled": true,
    "StatusCode": 429,
    "StatusMessage": "Too many requests. Please try again later.",
    "DefaultPolicy": null,
    "Policies": []
  }
}
```

### Fixed Window

Limits requests within fixed time intervals:

```json
{
  "Type": "FixedWindow",
  "Enabled": true,
  "Name": "fixed",
  "PermitLimit": 100,
  "WindowSeconds": 60,
  "QueueLimit": 10
}
```

100 requests allowed per 60-second window. When the limit is reached, up to 10 additional requests queue and wait for the next window.

Apply to endpoints:

```sql
comment on function public_api() is
'HTTP GET
@rate_limiter_policy fixed';
```

### Sliding Window

Smoother rate limiting using overlapping segments:

```json
{
  "Type": "SlidingWindow",
  "Enabled": true,
  "Name": "sliding",
  "PermitLimit": 100,
  "WindowSeconds": 60,
  "SegmentsPerWindow": 6
}
```

The window is divided into 6 segments (10 seconds each). As time passes, old segments expire gradually rather than all at once—preventing burst traffic at window boundaries.

### Token Bucket

Allows controlled bursting while maintaining overall rate:

```json
{
  "Type": "TokenBucket",
  "Enabled": true,
  "Name": "bucket",
  "TokenLimit": 100,
  "TokensPerPeriod": 10,
  "ReplenishmentPeriodSeconds": 10
}
```

The bucket holds up to 100 tokens. Every 10 seconds, 10 tokens are added. A burst of 100 requests is allowed, but sustained rate is limited to 1 request per second (10 tokens per 10 seconds).

Ideal for APIs where occasional bursts are acceptable but you want to prevent sustained abuse.

### Concurrency Limiting

Limits simultaneous requests rather than rate:

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

Only 10 requests can execute concurrently. Additional requests queue (up to 5) until a slot opens.

Perfect for expensive operations where you want to limit database load regardless of request rate:

```sql
comment on function generate_large_report() is
'HTTP POST
@rate_limiter concurrency';
```

### Combining Policies

Different endpoints can use different policies:

```sql
-- Public API: strict rate limiting
comment on function public_search() is
'HTTP GET
@rate_limiter_policy fixed';

-- Authenticated users: more generous limits
comment on function user_dashboard() is
'HTTP GET
@authorize
@rate_limiter_policy sliding';

-- Expensive operations: concurrency limited
comment on function export_data() is
'HTTP POST
@authorize
@rate_limiter concurrency';
```

## Thread Pool Optimization

Under high load, the .NET thread pool becomes a critical factor in API performance. By default, the thread pool starts with a small number of threads and grows slowly—adding only one thread every 500 milliseconds when all threads are busy. For high-throughput APIs handling thousands of concurrent requests, this gradual growth creates latency spikes during traffic bursts.

### The Thread Injection Problem

When your API receives a burst of requests, here's what happens:

1. The thread pool has its minimum number of threads (typically equal to CPU cores)
2. All threads become busy handling requests
3. New requests arrive but no threads are available
4. The thread pool waits **500ms** before creating a new thread
5. This repeats for each additional thread needed

If you have 8 CPU cores and suddenly receive 100 concurrent requests, it could take **46 seconds** ((100-8) × 0.5s) for the thread pool to grow large enough—during which time requests queue and latency degrades.

### Configuring Minimum Threads

NpgsqlRest allows you to configure thread pool settings to eliminate this cold-start penalty:

```json
{
  "ThreadPool": {
    "MinWorkerThreads": 100,
    "MinCompletionPortThreads": 100
  }
}
```

With `MinWorkerThreads` set to 100, the thread pool immediately has 100 threads available. New requests don't wait for thread injection—they execute immediately on pre-allocated threads.

### Worker Threads vs Completion Port Threads

The thread pool manages two types of threads:

| Type | Purpose | When to Increase |
|------|---------|-----------------|
| **Worker Threads** | CPU-bound work, synchronous operations | High CPU utilization, synchronous code paths |
| **Completion Port Threads** | Async I/O operations (database queries, HTTP) | Many concurrent async operations |

For database APIs like NpgsqlRest, both matter:
- **Worker threads** handle request processing and synchronous code
- **Completion port threads** handle async database I/O via Npgsql

### High-Throughput Configuration

For APIs expecting thousands of concurrent requests:

```json
{
  "ThreadPool": {
    "MinWorkerThreads": 200,
    "MinCompletionPortThreads": 200,
    "MaxWorkerThreads": 1000,
    "MaxCompletionPortThreads": 1000
  }
}
```

This configuration:
- Pre-allocates 200 threads of each type (no injection delays up to 200 concurrent requests)
- Allows growth up to 1000 threads under extreme load
- Balances memory usage against responsiveness

### Sizing Guidelines

There's no universal formula, but here are starting points:

| Expected Concurrent Requests | MinWorkerThreads | MinCompletionPortThreads |
|------------------------------|------------------|--------------------------|
| Up to 50 | 50 | 50 |
| 50-200 | 100 | 100 |
| 200-500 | 200 | 200 |
| 500-1000 | 300 | 300 |
| 1000+ | 400-500 | 400-500 |

**Key considerations:**

- **Memory**: Each thread consumes ~1MB of stack space. 500 threads ≈ 500MB additional memory
- **Context switching**: Too many threads increases CPU overhead from switching between them
- **Actual concurrency**: Set minimum threads to your expected concurrent request count, not total requests per second
- **Database connections**: Ensure your PostgreSQL `max_connections` and connection pool can handle the concurrency

### When NOT to Increase Thread Pool Size

Don't blindly increase thread counts. The defaults work well when:

- Your requests are truly async (NpgsqlRest uses async Npgsql by default)
- You're not blocking threads with synchronous waits
- Your concurrency matches your CPU cores

Over-provisioning threads wastes memory and can hurt performance through excessive context switching. Always benchmark with realistic load before and after changes.

### Example: Burst Traffic Handling

For an API that normally handles 50 concurrent requests but experiences bursts of 500:

```json
{
  "ThreadPool": {
    "MinWorkerThreads": 100,
    "MinCompletionPortThreads": 100,
    "MaxWorkerThreads": 600,
    "MaxCompletionPortThreads": 600
  }
}
```

This configuration:
- Handles normal load instantly (100 > 50)
- Handles burst starts with some injection delay but grows quickly to 600
- Doesn't waste memory during quiet periods

Combined with the retry and caching strategies above, your API remains responsive even under unexpected load spikes.

## High Availability

For production deployments, single-server databases are a single point of failure. NpgsqlRest leverages Npgsql's multi-host connection support for failover and load balancing across PostgreSQL clusters.

### Multi-Host Connections

Specify multiple hosts in your connection string:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com,replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret"
  }
}
```

Npgsql tries hosts in order. If the primary fails, it automatically connects to the next available host.

### Target Session Attributes

Control which server type handles connections:

```json
{
  "ConnectionSettings": {
    "MultiHostConnectionTargets": {
      "Default": "Any",
      "ByConnectionName": {
        "ReadOnly": "Standby",
        "Primary": "Primary"
      }
    }
  }
}
```

Available targets:

| Target | Behavior |
|--------|----------|
| `Any` | Any available server (default) |
| `Primary` | Only non-standby servers (for writes) |
| `Standby` | Only hot standby servers (for reads) |
| `PreferPrimary` | Primary if available, otherwise any |
| `PreferStandby` | Standby if available, otherwise any |
| `ReadWrite` | Must accept read-write transactions |
| `ReadOnly` | Must not accept read-write transactions |

Npgsql detects server role by querying `pg_is_in_recovery()`, which adds a small overhead to each connection. You can avoid this overhead by using separate named connections and specifying the connection directly in function annotations (covered below in [Read Replica Routing](#read-replica-routing)).

### Load Balancing

For distributing load across multiple servers of the same type, enable load balancing:

```
Host=replica1,replica2,replica3;Load Balance Hosts=true;Target Session Attributes=prefer-standby
```

With `Load Balance Hosts=true`, Npgsql rotates through the host list round-robin style—each new connection starts at a different position, distributing load evenly.

### Read Replica Routing

A common pattern: write to primary, read from replicas. Instead of relying on `Target Session Attributes` (which queries `pg_is_in_recovery()` on each connection), you can define separate named connections pointing directly to your servers:

Configure multiple connection strings:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com;Database=mydb;Username=app;Password=secret",
    "ReadReplica": "Host=replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret;Load Balance Hosts=true"
  },
  "NpgsqlRest": {
    "UseMultipleConnections": true
  },
  "ConnectionSettings": {
    "MultiHostConnectionTargets": {
      "Default": "Primary",
      "ByConnectionName": {
        "ReadReplica": "PreferStandby"
      }
    }
  }
}
```

Route read-heavy queries to replicas:

```sql
comment on function get_analytics_data() is
'HTTP GET
@connection ReadReplica';

comment on function heavy_report() is
'HTTP GET
@connection_name ReadReplica';
```

The `connection` annotation references the connection string name. The endpoint uses that connection instead of the default.

This approach is more efficient than multi-host connections with `Target Session Attributes` because:
- No `pg_is_in_recovery()` query on each connection
- Direct connection to the intended server
- You control exactly which endpoints use which servers

### Production High-Availability Configuration

A complete HA setup with failover, load balancing, caching, and retries:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com,replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret;Pooling=true;Maximum Pool Size=100",
    "ReadReplica": "Host=replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=secret;Load Balance Hosts=true;Pooling=true;Maximum Pool Size=50"
  },
  "ConnectionSettings": {
    "TestConnectionStrings": true,
    "RetryOptions": {
      "Enabled": true,
      "RetrySequenceSeconds": [0.5, 1, 2, 5, 10]
    },
    "MultiHostConnectionTargets": {
      "Default": "PreferPrimary",
      "ByConnectionName": {
        "ReadReplica": "PreferStandby"
      }
    }
  },
  "NpgsqlRest": {
    "UseMultipleConnections": true
  },
  "CommandRetryOptions": {
    "Enabled": true,
    "DefaultStrategy": "default",
    "Strategies": {
      "default": {
        "RetrySequenceSeconds": [0, 0.5, 1, 2, 5],
        "ErrorCodes": ["40001", "40P01", "08000", "08003", "08006", "57P03"]
      }
    }
  },
  "CacheOptions": {
    "Enabled": true,
    "Type": "Hybrid",
    "HybridCacheUseRedisBackend": true,
    "RedisConfiguration": "redis-cluster:6379,abortConnect=false",
    "HybridCacheDefaultExpiration": "5 minutes",
    "InvalidateCacheSuffix": "invalidate",
    "MaxCacheableRows": 1000
  },
  "RateLimiterOptions": {
    "Enabled": true,
    "DefaultPolicy": "standard",
    "Policies": [
      {
        "Type": "SlidingWindow",
        "Enabled": true,
        "Name": "standard",
        "PermitLimit": 1000,
        "WindowSeconds": 60,
        "SegmentsPerWindow": 6
      }
    ]
  }
}
```

This configuration:
- Connects to primary by default, fails over to replicas if needed
- Routes read queries to load-balanced replicas
- Retries transient failures at both connection and command levels
- Caches responses with Redis backend and stampede protection
- Rate limits all endpoints to 1000 requests per minute

### Same Schema Requirement

When using multiple connections, ensure all databases share the same schema. NpgsqlRest builds endpoints from database metadata at startup—the function signatures must match across all connections.

This is naturally true for primary-replica setups (replicas are copies of the primary) but requires attention if using separate databases.

## Putting It All Together

Here's how these features work together for a production API:

```sql
-- Frequently accessed, rarely changes - aggressive caching
create function get_product_catalog()
returns json
language sql
begin atomic;
select json_agg(p) from products p where active;
end;

comment on function get_product_catalog() is
'HTTP GET
@cached
@cache_expires_in 1h
@connection ReadReplica';

-- User-specific, moderate caching
create function get_user_orders(_user_id int)
returns json
language sql security definer
begin atomic;
select json_agg(o) from orders o where user_id = _user_id;
end;

comment on function get_user_orders(int) is
'HTTP GET
@authorize
@cached _user_id
@cache_expires_in 5m
@connection ReadReplica';

-- Critical write operation - retries, rate limiting
create function process_order(_order json)
returns json
language plpgsql security definer
as $$
begin
  -- Order processing logic
  return '{"success": true}'::json;
end;
$$;

comment on function process_order(json) is
'HTTP POST
@authorize
@retry aggressive
@rate_limiter_policy order_limit';

-- Expensive report - concurrency limited, long cache
create function generate_sales_report(_start_date date, _end_date date)
returns json
language sql
begin atomic;
  select json_build_object(
    'period', json_build_object('start', _start_date, 'end', _end_date),
    'data', (select json_agg(r) from sales_summary r where date between _start_date and _end_date)
  );
end;

comment on function generate_sales_report(date, date) is
'HTTP GET
@authorize roles admin,analyst
@cached _start_date, _end_date
@cache_expires_in 1d
@rate_limiter concurrency
@connection ReadReplica';
```

## Summary

NpgsqlRest provides enterprise-grade infrastructure for production APIs:

| Feature | Benefit |
|---------|---------|
| HTTP Caching | Zero server load for cached responses |
| Server Caching | No database connections for cache hits |
| Hybrid Cache | Stampede protection + distributed storage |
| Connection Retries | Handles failover transparently |
| Command Retries | Recovers from transient query failures |
| Rate Limiting | Protects infrastructure from abuse |
| Thread Pool Tuning | Eliminates latency spikes during traffic bursts |
| Multi-Host Connections | Automatic failover between servers |
| Load Balancing | Distributes read load across replicas |

These features work together: cache misses that hit the database benefit from retry logic. Rate limiting prevents cache stampedes before they happen. Load balancing distributes the requests that make it past the cache.

The result is an API that's not just fast under normal conditions, but resilient under adverse ones.

### Development Time Saved

Implementing these features manually in a traditional backend requires significant effort:

| Feature | Manual Implementation | NpgsqlRest |
|---------|----------------------|------------|
| **HTTP Cache Headers** | Middleware + per-endpoint logic (~50-100 LOC) | 1 line annotation |
| **Server-Side Caching** | Cache service + key generation + invalidation logic (~200-400 LOC) | `cached` annotation + JSON config |
| **Redis/Hybrid Cache** | Redis client setup + serialization + stampede protection (~300-500 LOC) | JSON config only |
| **Cache Invalidation Endpoints** | Additional controller actions + cache key matching (~100-200 LOC) | `InvalidateCacheSuffix` config |
| **Connection Retries** | Polly policies + error handling + backoff logic (~150-300 LOC) | JSON config only |
| **Command Retries** | Per-command retry wrapper + error classification (~200-400 LOC) | JSON config + optional annotation |
| **Rate Limiting** | Middleware + policy configuration + storage (~200-400 LOC) | JSON config + annotation |
| **Multi-Host Failover** | Connection management + health checks + failover logic (~300-500 LOC) | Connection string only |
| **Read Replica Routing** | Connection factory + routing logic + context propagation (~200-400 LOC) | `connection` annotation |
| **Thread Pool Tuning** | Startup configuration + monitoring (~50-100 LOC) | JSON config only |

**Conservative estimates:**

- **Manual implementation**: 1,750 - 3,300 lines of code across services, middleware, and configuration
- **NpgsqlRest**: ~50 lines of JSON configuration + a few single-line annotations
- **Time saved**: 2-4 weeks of development, testing, and debugging

Beyond line count, consider what you're *not* dealing with:

- No unit tests for caching logic (NpgsqlRest handles it)
- No integration tests for retry behavior
- No debugging race conditions in cache invalidation
- No maintaining compatibility across library upgrades
- No security audits of custom retry/caching code

The declarative approach means you describe *what* you want, not *how* to implement it. The infrastructure complexity is handled once by NpgsqlRest and reused across all your endpoints.

## Related Documentation

- [Cache Options](../config/cache-options) - Complete cache configuration reference
- [Connection Settings](../config/connection) - Connection and retry configuration
- [Command Retry](../config/command-retry) - Command retry strategies
- [Rate Limiter](../config/rate-limiter) - Rate limiting policies
- [Thread Pool](../config/thread-pool) - Thread pool configuration
- [cached annotation](../annotations/cached) - Per-endpoint caching
- [connection annotation](../annotations/connection) - Per-endpoint connection routing
- [retry_strategy annotation](../annotations/retry-strategy) - Per-endpoint retry strategies
- [rate_limiter_policy annotation](../annotations/rate-limiter-policy) - Per-endpoint rate limiting
- [Npgsql Failover and Load Balancing](https://www.npgsql.org/doc/failover-and-load-balancing.html) - Npgsql multi-host documentation

::: tip SQL File Source
All performance features in this post — caching, retry strategies, rate limiting, timeouts — also work with [SQL file endpoints](/guide/sql-files).
:::

<BlogNav
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Cache Options', href: '/config/cache-options' },
    { text: 'Connection Settings', href: '/config/connection' },
    { text: 'Rate Limiter', href: '/config/rate-limiter' }
  ]"
/>

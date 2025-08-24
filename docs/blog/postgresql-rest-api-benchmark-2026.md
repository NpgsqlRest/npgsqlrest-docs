---
layout: doc
outline: [2, 3]
title: "PostgreSQL REST API Benchmark 2026: 14 Frameworks Compared"
titleTemplate: NpgsqlRest
description: "Performance comparison of 14 REST API frameworks serving PostgreSQL data. NpgsqlRest, PostgREST, Swoole PHP, Go, Rust, Express, FastAPI, Spring Boot and more tested under load."
head:
  - - meta
    - name: keywords
      content: postgresql rest api benchmark, api performance comparison, npgsqlrest vs postgrest, fastapi vs express postgresql, spring boot postgresql performance, swoole php benchmark, rest api framework comparison 2026
  - - meta
    - property: og:title
      content: "PostgreSQL REST API Benchmark 2026: 14 Frameworks Compared"
  - - meta
    - property: og:description
      content: "Performance comparison of 14 REST API frameworks serving PostgreSQL data. See how NpgsqlRest, PostgREST, Swoole PHP, and others perform under load."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "PostgreSQL REST API Benchmark 2026: 14 Frameworks Compared"
  - - meta
    - name: twitter:description
      content: "Performance comparison of 14 REST API frameworks serving PostgreSQL data under various load conditions."
---

# PostgreSQL REST API Benchmark 2026: 14 Frameworks Compared

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Performance</span> · <span class="tag">January 2026</span>
</p>

---

::: info
I wanted to repeat the benchmark from last year for several big reasons:
- First and foremost I wanted to make tests realistic and fair as much as possible. Last year tests were done in a hurry and to be honest, something was fisy with those results.
- Lately, there were some big internal changes in NpgsqlRest, many micro-optimizations and improvements that affected performance.
- I waanted to add more scenarios, and test different aspects (such as system resource usage which are now included).
- Some other frameworks also had major updates, so I wanted to see how they compare now.

Other than that, during the developement and explaration of the [test project](https://github.com/NpgsqlRest/pg_function_load_tests), I found some issues. For example:
- Pause between tests was way too short. Increaed from 5 to 30 seconds to allow TCP TIME_WAIT sockets to clear, JIT warmup, Garbage Collection, etc.
- Logging setup was uneven across frameworks, causing some to log to console/file during tests, impacting performance. Now all logging is disabled.

Other then that, I wanted to make the benchmarks as transparent, fair, realistic and accurate as possible. Everyone can check the source code used for tests, and run run themself if desired with their own setup. Also, anyone can suggest improvements or make PRs with new frameworks, optimizations or new test scenarios, and I would very much welcome that. As development of NpgsqlRest continues, I plan to repeat this benchmark from time to time to keep track of performance changes.

What follows is the detailed AI-generated analysis and report of the benchmark results. But you can also skip to [summary results table](#summary-tables) or to [conclusion sections](#conclusion) directly.

Enjoy!
:::

Following our [2025 benchmark](/blog/postgresql-rest-api-benchmark-2025), we've updated our testing with the latest framework versions and expanded our test scenarios. This year's benchmark includes higher concurrency levels (up to 200 VUs), pure HTTP overhead tests (Minimal Baseline), and POST body parsing benchmarks.

## What We Tested

All frameworks executed the same PostgreSQL functions. This isolates the framework overhead from database performance - every framework runs identical queries against the same PostgreSQL instance. All functions use `generate_series()` for constant, predictable database response times with no table I/O.

**Test Scenarios:**

| Scenario | Endpoint | Function | Description |
|----------|----------|----------|-------------|
| Data Type Serialization | `GET /api/perf-test` | [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4) | Comprehensive test with 23 data types (text, int, numeric, bool, date/time, UUID, JSON, arrays). Returns 1, 10, 100, or 500 records. |
| Minimal Baseline **(new)** | `GET /api/perf-minimal` | [`perf_minimal`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L141) | Pure HTTP routing overhead. Returns `{"status": "ok", "ts": ...}` - no parameters, minimal response. Tested at 100, 200, and 500 VUs. |
| POST Body Parsing **(new)** | `POST /api/perf-post` | [`perf_post`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L105) | Tests JSON request body parsing. Sends nested JSON payload, echoes it back with computed values. Tested at 50 VUs with 10 and 100 records. |
| Nested JSON **(new)** | `GET /api/perf-nested` | [`perf_nested`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L121) | Tests nested object serialization at configurable depth levels. |
| Large Payload **(new)** | `GET /api/perf-large-payload` | [`perf_large_payload`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L153) | Tests chunked transfer and buffer handling with configurable KB-sized responses. |
| Many Parameters **(new)** | `GET /api/perf-many-params` | [`perf_many_params`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L165) | Tests query string parsing with 20 parameters of mixed types. |

**Test Configuration:**
- **Load Tool**: k6 load testing framework
- **Duration**: 60 seconds per test (30 seconds for minimal baseline)
- **Concurrency**: 1, 50, 100, and 200 virtual users (VUs) - up to 500 VUs for minimal baseline
- **Environment**: All services running in Docker containers on the same host
- **Hardware**: Hetzner Cloud CCX33 (General Purpose, x86 AMD) - 8 dedicated vCPUs, 32 GB RAM, 240 GB SSD, 30 TB traffic

**Frameworks Tested:**

| Framework | Language | Version |
|-----------|----------|---------|
| NpgsqlRest (JIT) | .NET | 3.4.7 |
| NpgsqlRest (AOT) | .NET | 3.4.7 |
| PostgREST | Haskell | 14.3 |
| Go (net/http + pgx) | Go | 1.25 |
| Rust (Actix + tokio-postgres) | Rust | 1.91.1 |
| Spring Boot | Java 24 | 4.0.1 |
| .NET Minimal API + Dapper | .NET 10 | - |
| .NET Minimal API + EF Core | .NET 9/10 | - |
| Fastify | Node.js | 5.7.1 |
| Bun | Bun | 1.3.3 |
| Swoole | PHP 8.4 | 6.0 (extension) |
| FastAPI | Python | 0.128.0 |
| Django | Python | 6.0.1 |

## What's New in This Benchmark

This benchmark introduces several improvements over the [previous 2025 benchmark](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202512280753):

### Version Updates

| Framework | Previous Version | New Version | Changed |
|-----------|-----------------|-------------|:-------:|
| NpgsqlRest | 3.2.2 | **3.4.7** | Yes |
| PostgREST | 12.2.8 | **14.3** | Yes |
| Go | 1.24 | **1.25** | Yes |
| Rust | 1.83.0 | **1.91.1** | Yes |
| Bun | 1.1.42 | **1.3.3** | Yes |
| Fastify | 5.6.2 | **5.7.1** | Yes |
| FastAPI | 0.127.1 | **0.128.0** | Yes |
| Django | 6.0 | **6.0.1** | Yes |
| Swoole | PHP 8.4 + Swoole 6.0 | PHP 8.4 + Swoole 6.0 | No |
| Spring Boot | Java 24 + 4.0.1 | Java 24 + 4.0.1 | No |
| .NET Dapper | .NET 10 Preview | .NET 10 Preview | No |
| .NET EF Core | .NET 9 / .NET 10 Preview | .NET 9 / .NET 10 Preview | No |

### New Test Scenarios

We added five new benchmark scenarios (marked "Yes" in the table above):

- **Minimal Baseline**: Reveals true framework HTTP overhead separated from database I/O
- **POST Body Parsing**: Measures JSON request deserialization and response serialization
- **Nested JSON**: Tests nested object serialization performance
- **Large Payload**: Tests chunked transfer and buffer handling
- **Many Parameters**: Tests query string parsing with 20 parameters

Additionally, we extended concurrency testing:
- VU range expanded from 1/50/100 to **1/50/100/200**
- Up to **500 VUs** for minimal baseline tests
- Better reveals framework scaling limits under high load

### Infrastructure Changes

- **Resource Monitoring**: New per-service CPU and memory tracking during tests
- **JIT Warmup Phase**: All frameworks now get a warmup period before benchmarks
- **Extended Sleep Between Tests**: 30 seconds between tests for TCP TIME_WAIT clearance
- **Improved Result Aggregation**: JSON output for programmatic analysis

### Comparing With Previous Results

For detailed comparison with the 2025 benchmark:
- **Previous benchmark branch**: [202512280753](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202512280753)
- **Current benchmark branch**: [202601211416](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416)
- **Raw results**: [202601211416_all.md](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416_all.md)

## Key Findings

### Swoole PHP Dominates Large Payload Scenarios

A major shift from 2025: **Swoole PHP 6.0 now leads in most scenarios involving larger payloads**. At 100 VU with 100 records, Swoole achieves **469.58 req/s** - outperforming all competitors. With 500 records, Swoole maintains its lead at **106.88 req/s**.

### NpgsqlRest Leads High-Concurrency Low-Payload Scenarios

At 100 concurrent users with minimal payload (1 record), **NpgsqlRest JIT achieves 4,588 req/s**, maintaining its lead in low-latency scenarios. The gap between JIT and AOT versions has narrowed significantly in v3.4.7.

### The Top Performers by Scenario

| Scenario | Leader | Performance |
|----------|--------|-------------|
| **1 VU, 1 Record** | Bun | 539.91 req/s |
| **100 VU, 1 Record** | NpgsqlRest JIT | 4,588 req/s |
| **100 VU, 100 Records** | Swoole PHP | 469.58 req/s |
| **100 VU, 500 Records** | Swoole PHP | 106.88 req/s |
| **Minimal Baseline (pure HTTP)** | Go | 20,104 req/s |
| **POST Body Parsing** | Go | 9,628 req/s |

### Performance Tiers at 100 VU, 1 Record

| Tier | Frameworks | Performance Range |
|------|------------|-------------------|
| **Elite** | NpgsqlRest JIT/AOT, Swoole PHP | 4,400-4,600 req/s |
| **Top** | Bun, Go, Fastify, Spring Boot | 4,100-4,400 req/s |
| **High** | .NET Dapper, Rust | 3,900-4,100 req/s |
| **Mid** | .NET EF Core | 3,400-3,500 req/s |
| **Lower** | FastAPI, PostgREST, Django | 1,600-1,850 req/s |

### What Changed From 2025

Several notable performance shifts:

1. **Swoole PHP improved dramatically** - Jumping from mid-tier to top performer in data-heavy scenarios
2. **Bun emerged as single-threaded champion** - Best performance at 1 VU across all payload sizes
3. **NpgsqlRest JIT/AOT gap narrowed** - AOT now performs nearly identically to JIT in most scenarios
4. **PostgREST improved** - Better scaling under high concurrency compared to 2025
5. **Go remains pure HTTP champion** - Unmatched at 20,000+ req/s in minimal baseline tests

### Scaling Behavior

Framework scaling patterns at increasing concurrency:

| Framework | 1 VU | 50 VU | 100 VU | 200 VU | Scaling Factor |
|-----------|------|-------|--------|--------|----------------|
| NpgsqlRest JIT | 480 | 4,380 | 4,588 | 4,563 | **9.5x** |
| Swoole PHP | 471 | 4,160 | 4,423 | 4,485 | **9.5x** |
| Bun | 540 | 4,421 | 4,377 | 4,419 | **8.2x** |
| PostgREST | 271 | 1,818 | 1,749 | 1,663 | **6.5x** |

### Large Payloads Level the Playing Field

With 500 records at 100 VU, database I/O dominates and the performance gap narrows:

| Framework | 500 Records @ 100 VU | Latency |
|-----------|---------------------|---------|
| Swoole PHP | 106.88 req/s | 468ms |
| Go | 90.93 req/s | 550ms |
| Rust | 85.79 req/s | 583ms |
| NpgsqlRest JIT | 82.37 req/s | 607ms |
| FastAPI | 25.36 req/s | 1,977ms |

### Pure HTTP Overhead (Minimal Baseline)

Testing pure HTTP handling without database access reveals framework overhead:

| Framework | 100 VU | 200 VU | 500 VU |
|-----------|--------|--------|--------|
| Go | 20,104 req/s | 20,807 req/s | 20,573 req/s |
| NpgsqlRest JIT | 16,065 req/s | 17,105 req/s | 17,015 req/s |
| .NET Dapper | 14,764 req/s | 15,401 req/s | 15,705 req/s |
| Spring Boot | 14,138 req/s | 14,593 req/s | 14,435 req/s |
| Swoole PHP | 12,042 req/s | 12,309 req/s | 12,297 req/s |
| PostgREST | 5,410 req/s | 4,974 req/s | 5,324 req/s |

Go's lightweight HTTP server achieves **20,000+ req/s** - nearly 4x faster than PostgREST's pure HTTP overhead.

### POST Body Parsing Performance

Testing JSON body parsing adds another dimension:

| Framework | 50 VU, 10 Records | 50 VU, 100 Records |
|-----------|-------------------|---------------------|
| Go | 9,629 req/s | 2,697 req/s |
| Swoole PHP | 7,470 req/s | 2,445 req/s |
| Spring Boot | 7,133 req/s | 1,758 req/s |
| NpgsqlRest JIT | 6,101 req/s | 1,226 req/s |
| Bun | 4,028 req/s | 1,832 req/s |
| PostgREST | 3,479 req/s | 1,156 req/s |

Go's efficient JSON parsing maintains its lead, while Bun shows strong performance with larger payloads relative to smaller ones.

### Python Frameworks Continue to Struggle

Both FastAPI and Django remain at the bottom in most scenarios:

- **FastAPI** at 100 VU with 500 records: **1,977ms average latency**
- **Django** performs better with data serialization but lags in pure throughput

### JIT vs AOT in 2026

NpgsqlRest's JIT and AOT versions now perform nearly identically:

| Scenario | JIT | AOT | Difference |
|----------|-----|-----|------------|
| 100 VU, 1 Record | 4,588 req/s | 4,527 req/s | 1.3% |
| 100 VU, 100 Records | 377 req/s | 375 req/s | 0.5% |
| Minimal Baseline | 16,065 req/s | 15,624 req/s | 2.8% |

For most workloads, the choice between JIT and AOT can now be based on deployment requirements (image size, cold start) rather than performance.

## Why Certain Frameworks Excel

### Swoole PHP's Rise

Swoole 6.0 brings significant improvements:
- Coroutine-based async I/O eliminates blocking
- Efficient memory management for large responses
- Native PostgreSQL driver optimization

### Go's HTTP Dominance

Go's minimal baseline performance (20K+ req/s) demonstrates:
- Extremely low HTTP parsing overhead
- Efficient goroutine scheduling
- Zero-allocation hot paths in net/http

### NpgsqlRest's Architecture

NpgsqlRest continues to excel by eliminating layers:
1. **No ORM overhead** - Direct PostgreSQL protocol via Npgsql
2. **No routing framework** - Endpoints derived from database metadata
3. **No serialization layer** - PostgreSQL handles JSON serialization
4. **Efficient connection pooling** - Npgsql's built-in pooling

## Resource Usage

New in this benchmark: per-service memory and CPU monitoring during test execution.

| Service | Peak Memory | Avg Memory | Avg CPU |
|---------|------------:|-----------:|--------:|
| Go | 75.94 MB | 21.35 MB | 4.84% |
| Swoole PHP | 78.99 MB | 50.92 MB | 4.49% |
| Rust | 168.20 MB | 43.03 MB | 3.79% |
| Bun | 168.00 MB | 59.31 MB | 4.29% |
| .NET Dapper | 192.70 MB | 96.55 MB | 4.19% |
| FastAPI | 198.10 MB | 133.73 MB | 4.29% |
| NpgsqlRest AOT | 237.80 MB | 59.84 MB | 4.30% |
| .NET 10 EF | 256.50 MB | 143.59 MB | 6.16% |
| .NET 9 EF | 276.60 MB | 133.80 MB | 6.36% |
| NpgsqlRest JIT | 321.30 MB | 111.41 MB | 4.42% |
| Fastify | 411.40 MB | 58.96 MB | 3.68% |
| Django | 824.00 MB | 386.77 MB | 11.84% |
| Spring Boot | 1,010.00 MB | 806.79 MB | 5.38% |

### Key Observations

- **Go** has the lowest memory footprint (21 MB average, 76 MB peak)
- **Swoole PHP** achieves top-tier performance with minimal resources (51 MB average)
- **NpgsqlRest AOT** uses half the memory of JIT (60 MB vs 111 MB average)
- **Spring Boot** has the highest memory usage (807 MB average, 1 GB peak)
- **Django** has the highest CPU usage (11.84% average)

The full resource monitoring data is available in the [stats directory](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/_k6/results/202601211416/stats).

## Important Note: JSON and Array Type Handling

When interpreting these results, not all frameworks return identical JSON responses. The differences lie in how each framework handles PostgreSQL's JSON, JSONB, and array types.

| Framework | json | jsonb | int[] | text[] |
|-----------|:----:|:-----:|:-----:|:------:|
| NpgsqlRest (JIT/AOT) | ✅ | ✅ | ✅ | ✅ |
| .NET EF Core / Dapper | ✅ | ✅ | ✅ | ✅ |
| Rust | ✅ | ✅ | ✅ | ✅ |
| Fastify | ✅ | ✅ | ✅ | ✅ |
| Django | ✅ | ❌ | ✅ | ✅ |
| Go | ❌ | ❌ | ✅ | ✅ |
| FastAPI | ❌ | ❌ | ✅ | ✅ |
| PostgREST | ⚠️ | ⚠️ | ✅ | ✅ |
| Bun | ⚠️ | ⚠️ | ✅ | ✅ |
| Spring Boot | ⚠️ | ⚠️ | ✅ | ✅ |
| Swoole PHP | ❌ | ❌ | ❌ | ❌ |

✅ = Properly parsed as native JSON/array
❌ = Returns raw PostgreSQL text format (string)
⚠️ = Unusual format (wrapped in metadata or array)

Swoole PHP's impressive numbers come with a caveat: JSON/JSONB and array fields require additional client-side parsing.

## Conclusion

The 2026 benchmark reveals a more nuanced performance landscape:

- **For low-latency, high-concurrency APIs**: NpgsqlRest JIT remains the top choice at 4,588 req/s
- **For data-heavy workloads**: Swoole PHP now leads with superior large-payload handling
- **For pure HTTP performance**: Go is unmatched at 20,000+ req/s
- **For balanced workloads**: Bun, Go, and Fastify offer excellent all-around performance

The "database as API" approach continues to deliver exceptional results. NpgsqlRest requires **zero application code** - just configuration - while delivering top-tier performance and correct PostgreSQL type handling.

### Lines of Code Comparison

Performance isn't everything. Development time, maintainability, and code complexity matter too. Here's how much code each framework requires to implement the same API endpoints:

| Framework | Lines of Code |
|-----------|--------------|
| PostgREST | 14 (config only) |
| NpgsqlRest | 21 (config only) |
| Fastify | 100 |
| .NET EF | 116 |
| Bun | 133 |
| FastAPI | 136 |
| Spring Boot | 139 |
| .NET Dapper | 140 |
| Django | 203 |
| Swoole PHP | 216 |
| Rust | 291 |
| Go | 347 |

Go may deliver 20,000+ req/s in pure HTTP tests, but that comes at the cost of writing 347 lines of boilerplate code for basic CRUD operations. Every line of code is a potential bug, a maintenance burden, and development time spent.

NpgsqlRest and PostgREST take a different approach: define your API in the database, configure once, and let the framework handle the rest. You get top-tier performance (4,500+ req/s) with just 14-21 lines of configuration - no serialization code, no routing logic, no connection pool management.

The benchmark source code and detailed results are available in the [pg_function_load_tests repository](https://github.com/vb-consulting/pg_function_load_tests/tree/202601211416).

---

## Full Benchmark Results

### Summary Tables

All results in requests per second (req/s). Sorted by 100/1 performance.

#### Data Type Serialization

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | 1/1 | 1/10 | 100/1 | 100/100 | 100/500 |
|-----------|----:|-----:|------:|--------:|--------:|
| NpgsqlRest JIT | 480 | 265 | 🥇 4,588 | 377 | 82 |
| NpgsqlRest AOT | 466 | 262 | 🥈 4,527 | 375 | 82 |
| Swoole PHP | 471 | 🥇 292 | 🥉 4,423 | 🥇 470 | 🥇 107 |
| Bun | 🥇 540 | 243 | 4,377 | 353 | 79 |
| Go | 🥉 484 | 🥈 289 | 4,362 | 🥈 406 | 🥈 91 |
| Fastify | 482 | 260 | 4,172 | 351 | 73 |
| Spring Boot | 464 | 233 | 4,147 | 282 | 61 |
| .NET Dapper | 425 | 244 | 4,101 | 331 | 72 |
| Rust | 🥈 507 | 🥉 285 | 3,940 | 🥉 388 | 🥉 86 |
| .NET 10 EF | 377 | 220 | 3,515 | 331 | 72 |
| .NET 9 EF | 362 | 223 | 3,425 | 330 | 72 |
| FastAPI | 478 | 220 | 1,843 | 111 | 25 |
| PostgREST | 271 | 181 | 1,749 | 342 | 79 |
| Django | 271 | 178 | 1,691 | 307 | 71 |

Column headers = VU/Records (e.g., 100/1 = 100 VU, 1 record). See [detailed results](#data-type-serialization-tests).

#### New Scenarios

| Framework | Min | POST | Nest | Large | Params |
|-----------|----:|-----:|-----:|------:|-------:|
| Go | 🥇 20,104 | 🥇 9,629 | 🥇 3,756 | 🥇 1,618 | 🥇 16,100 |
| NpgsqlRest JIT | 🥈 16,065 | 6,101 | 3,061 | 1,096 | 🥈 11,504 |
| NpgsqlRest AOT | 🥉 15,624 | 6,065 | 🥉 3,073 | 919 | 🥉 11,221 |
| .NET Dapper | 14,764 | 6,089 | 2,989 | 1,397 | 10,702 |
| Spring Boot | 14,138 | 🥉 7,133 | 2,230 | 🥈 1,515 | 10,324 |
| Swoole PHP | 12,042 | 🥈 7,470 | 🥈 3,426 | 🥉 1,500 | 9,458 |
| Rust | 11,761 | 5,400 | 2,824 | 1,509 | 9,231 |
| .NET 10 EF | 9,385 | 4,879 | 2,615 | 1,314 | 7,452 |
| .NET 9 EF | 8,989 | 4,710 | 2,558 | 1,326 | 7,182 |
| Fastify | 8,899 | 4,631 | 2,921 | 1,248 | 7,711 |
| Bun | 7,803 | 4,028 | 2,287 | 1,235 | 3,116 |
| PostgREST | 5,410 | 3,479 | 1,912 | 908 | 3,960 |
| FastAPI | 4,090 | 2,487 | 971 | 1,492 | 2,080 |
| Django | 2,535 | 2,266 | 1,677 | 1,071 | 2,222 |

- **Min** — [Minimal Baseline](#minimal-baseline-pure-http-overhead) (100 VU) — [`perf_minimal`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L141)
- **POST** — [POST Body Parsing](#post-body-parsing) (50 VU, 10 records) — [`perf_post`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L105)
- **Nest** — [Nested JSON Serialization](#nested-json-serialization) (50 VU, depth 1) — [`perf_nested`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L121)
- **Large** — [Large Payload](#large-payload) (25 VU, 100KB) — [`perf_large_payload`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L153)
- **Params** — [Many Parameters](#many-parameters-20-params) (50 VU, 20 params) — [`perf_many_params`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L165)

---

Results are grouped by concurrency level and payload size, sorted by requests per second (highest first).

### Data Type Serialization Tests

#### 1 Virtual User, 1 Record

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| bun-app-v1.3.3 | 539.91/s | 1.84ms | 32,395 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| rust-app-v1.91.1 | 506.53/s | 1.96ms | 30,392 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| go-app-v1.25 | 483.79/s | 2.05ms | 29,028 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| fastify-app-v5.7.1 | 481.94/s | 2.06ms | 28,917 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| npgsqlrest-jit-v3.4.7 | 480.28/s | 2.07ms | 28,817 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| fastapi-app-v0.128.0 | 478.18/s | 2.08ms | 28,692 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| swoole-php-app-v6.0 | 471.18/s | 2.11ms | 28,272 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| npgsqlrest-aot-v3.4.7 | 466.06/s | 2.13ms | 27,964 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| java24-spring-boot-v4.0.1 | 464.36/s | 2.14ms | 27,863 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| net10-minapi-dapper-jit | 425.45/s | 2.34ms | 25,527 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| net10-minapi-ef-jit | 376.73/s | 2.64ms | 22,604 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 361.52/s | 2.75ms | 21,692 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| postgrest-v14.3 | 271.38/s | 3.67ms | 16,284 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| django-app-v6.0.1 | 270.87/s | 3.68ms | 16,254 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_1rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |

#### 1 Virtual User, 10 Records

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| swoole-php-app-v6.0 | 291.51/s | 3.42ms | 17,491 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| go-app-v1.25 | 288.60/s | 3.45ms | 17,317 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| rust-app-v1.91.1 | 284.94/s | 3.50ms | 17,098 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| npgsqlrest-jit-v3.4.7 | 264.71/s | 3.76ms | 15,883 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 262.37/s | 3.80ms | 15,743 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| fastify-app-v5.7.1 | 259.77/s | 3.84ms | 15,587 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| net10-minapi-dapper-jit | 244.13/s | 4.08ms | 14,649 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| bun-app-v1.3.3 | 243.23/s | 4.10ms | 14,594 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| java24-spring-boot-v4.0.1 | 232.71/s | 4.28ms | 13,964 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| net9-minapi-ef-jit | 223.13/s | 4.47ms | 13,389 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| fastapi-app-v0.128.0 | 220.40/s | 4.52ms | 13,225 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| net10-minapi-ef-jit | 219.98/s | 4.53ms | 13,200 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| postgrest-v14.3 | 180.58/s | 5.52ms | 10,835 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| django-app-v6.0.1 | 178.29/s | 5.59ms | 10,698 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_10rec_60svus_1_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |

#### 100 Virtual Users, 1 Record

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| npgsqlrest-jit-v3.4.7 | 4,588.02/s | 10.88ms | 275,381 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 4,526.64/s | 11.02ms | 271,720 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| swoole-php-app-v6.0 | 4,423.22/s | 11.29ms | 265,603 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| bun-app-v1.3.3 | 4,377.29/s | 11.41ms | 262,711 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| go-app-v1.25 | 4,362.06/s | 11.44ms | 261,787 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| fastify-app-v5.7.1 | 4,171.93/s | 11.97ms | 250,370 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| java24-spring-boot-v4.0.1 | 4,146.96/s | 12.03ms | 248,882 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| net10-minapi-dapper-jit | 4,100.54/s | 12.17ms | 246,098 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| rust-app-v1.91.1 | 3,939.83/s | 12.67ms | 236,565 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| net10-minapi-ef-jit | 3,515.31/s | 14.20ms | 210,977 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 3,424.67/s | 14.60ms | 205,781 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| fastapi-app-v0.128.0 | 1,842.81/s | 27.12ms | 110,610 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| postgrest-v14.3 | 1,749.07/s | 28.58ms | 105,038 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| django-app-v6.0.1 | 1,690.72/s | 29.56ms | 101,545 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_1rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |

#### 100 Virtual Users, 100 Records

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| swoole-php-app-v6.0 | 469.58/s | 106.44ms | 28,257 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| go-app-v1.25 | 405.52/s | 123.21ms | 24,378 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| rust-app-v1.91.1 | 387.70/s | 128.79ms | 23,313 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| npgsqlrest-jit-v3.4.7 | 377.42/s | 132.43ms | 22,691 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 374.57/s | 133.40ms | 22,519 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| bun-app-v1.3.3 | 352.79/s | 141.70ms | 21,217 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| fastify-app-v5.7.1 | 351.07/s | 142.62ms | 21,212 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| postgrest-v14.3 | 342.26/s | 145.93ms | 20,578 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| net10-minapi-ef-jit | 331.31/s | 151.40ms | 19,994 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net10-minapi-dapper-jit | 331.16/s | 150.92ms | 19,914 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| net9-minapi-ef-jit | 329.64/s | 151.67ms | 19,836 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| django-app-v6.0.1 | 307.22/s | 162.61ms | 18,480 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |
| java24-spring-boot-v4.0.1 | 281.56/s | 177.62ms | 16,949 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| fastapi-app-v0.128.0 | 111.17/s | 449.98ms | 6,774 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_100rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |

#### 100 Virtual Users, 500 Records

Function: [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L4)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| swoole-php-app-v6.0 | 106.88/s | 468.22ms | 6,459 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| go-app-v1.25 | 90.93/s | 550.42ms | 5,511 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| rust-app-v1.91.1 | 85.79/s | 583.48ms | 5,192 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| npgsqlrest-jit-v3.4.7 | 82.37/s | 606.96ms | 4,991 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 81.89/s | 610.99ms | 4,956 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| postgrest-v14.3 | 78.59/s | 636.29ms | 4,753 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| bun-app-v1.3.3 | 78.55/s | 637.59ms | 4,772 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| fastify-app-v5.7.1 | 73.00/s | 685.34ms | 4,463 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| net10-minapi-dapper-jit | 72.42/s | 691.80ms | 4,391 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| net9-minapi-ef-jit | 72.00/s | 694.45ms | 4,355 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| net10-minapi-ef-jit | 71.98/s | 694.12ms | 4,363 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| django-app-v6.0.1 | 71.16/s | 702.86ms | 4,302 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |
| java24-spring-boot-v4.0.1 | 60.75/s | 822.37ms | 3,683 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| fastapi-app-v0.128.0 | 25.36/s | 1,977.30ms | 1,613 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_500rec_60svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |

---

### Minimal Baseline (Pure HTTP Overhead)

#### 100 Virtual Users

Function: [`perf_minimal`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L141)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| go-app-v1.25 | 20,104.17/s | 2.47ms | 603,258 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| npgsqlrest-jit-v3.4.7 | 16,064.93/s | 3.10ms | 481,990 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 15,623.97/s | 3.19ms | 468,869 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| net10-minapi-dapper-jit | 14,763.56/s | 3.37ms | 442,970 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| java24-spring-boot-v4.0.1 | 14,137.76/s | 3.52ms | 424,203 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| swoole-php-app-v6.0 | 12,042.03/s | 4.13ms | 361,335 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| rust-app-v1.91.1 | 11,760.56/s | 4.22ms | 352,878 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| net10-minapi-ef-jit | 9,384.73/s | 5.31ms | 281,613 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 8,988.95/s | 5.55ms | 269,715 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| fastify-app-v5.7.1 | 8,899.19/s | 5.61ms | 267,058 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| bun-app-v1.3.3 | 7,803.09/s | 6.40ms | 234,250 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| postgrest-v14.3 | 5,410.48/s | 9.23ms | 162,402 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| fastapi-app-v0.128.0 | 4,089.65/s | 12.21ms | 122,737 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| django-app-v6.0.1 | 2,535.28/s | 19.71ms | 76,114 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_minimal_30svus_100_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |

---

### POST Body Parsing

#### 50 Virtual Users, 10 Records

Function: [`perf_post`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L105)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| go-app-v1.25 | 9,628.69/s | 2.58ms | 577,788 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| swoole-php-app-v6.0 | 7,470.15/s | 3.33ms | 448,231 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| java24-spring-boot-v4.0.1 | 7,132.74/s | 3.49ms | 427,988 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| npgsqlrest-jit-v3.4.7 | 6,100.82/s | 4.08ms | 366,070 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| net10-minapi-dapper-jit | 6,088.58/s | 4.09ms | 365,437 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| npgsqlrest-aot-v3.4.7 | 6,065.30/s | 4.11ms | 363,949 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| rust-app-v1.91.1 | 5,399.96/s | 4.61ms | 324,130 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| net10-minapi-ef-jit | 4,879.06/s | 5.11ms | 292,761 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 4,710.24/s | 5.29ms | 282,651 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| fastify-app-v5.7.1 | 4,631.21/s | 5.39ms | 277,906 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| bun-app-v1.3.3 | 4,027.52/s | 6.20ms | 241,687 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| postgrest-v14.3 | 3,478.73/s | 7.17ms | 208,759 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| fastapi-app-v0.128.0 | 2,487.28/s | 10.04ms | 149,259 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| django-app-v6.0.1 | 2,266.37/s | 11.02ms | 136,044 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_post_10rec_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |

---

### Nested JSON Serialization

#### 50 Virtual Users, Depth 1

Function: [`perf_nested`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L121)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| go-app-v1.25 | 3,756.41/s | 6.64ms | 225,426 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| swoole-php-app-v6.0 | 3,426.34/s | 7.27ms | 205,620 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| npgsqlrest-aot-v3.4.7 | 3,073.40/s | 8.12ms | 184,428 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| npgsqlrest-jit-v3.4.7 | 3,060.64/s | 8.15ms | 183,675 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| net10-minapi-dapper-jit | 2,988.63/s | 8.35ms | 179,345 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| fastify-app-v5.7.1 | 2,921.44/s | 8.54ms | 175,319 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| rust-app-v1.91.1 | 2,824.19/s | 8.83ms | 169,476 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| net10-minapi-ef-jit | 2,615.08/s | 9.54ms | 156,947 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 2,557.86/s | 9.76ms | 153,501 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| bun-app-v1.3.3 | 2,286.95/s | 10.92ms | 137,261 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| java24-spring-boot-v4.0.1 | 2,229.81/s | 11.19ms | 133,816 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| postgrest-v14.3 | 1,912.23/s | 13.06ms | 114,792 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| django-app-v6.0.1 | 1,676.67/s | 14.90ms | 100,661 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |
| fastapi-app-v0.128.0 | 970.57/s | 25.74ms | 58,262 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_nested_100rec_1depth_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |

---

### Large Payload

#### 25 Virtual Users, 100KB Payload

Function: [`perf_large_payload`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L153)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| go-app-v1.25 | 1,618.26/s | 7.70ms | 97,107 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| java24-spring-boot-v4.0.1 | 1,514.97/s | 8.23ms | 90,930 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| rust-app-v1.91.1 | 1,508.80/s | 8.27ms | 90,539 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| swoole-php-app-v6.0 | 1,500.22/s | 8.31ms | 90,027 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| fastapi-app-v0.128.0 | 1,491.75/s | 8.36ms | 89,518 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |
| net10-minapi-dapper-jit | 1,396.93/s | 8.93ms | 83,826 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| net9-minapi-ef-jit | 1,326.18/s | 9.41ms | 79,583 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| net10-minapi-ef-jit | 1,313.73/s | 9.50ms | 78,847 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| fastify-app-v5.7.1 | 1,248.43/s | 10.00ms | 74,941 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| bun-app-v1.3.3 | 1,234.55/s | 10.11ms | 74,093 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| npgsqlrest-jit-v3.4.7 | 1,095.93/s | 11.39ms | 65,765 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| django-app-v6.0.1 | 1,070.77/s | 11.66ms | 64,270 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |
| npgsqlrest-aot-v3.4.7 | 919.29/s | 13.58ms | 55,175 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| postgrest-v14.3 | 907.83/s | 13.75ms | 54,499 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_large_100kb_60svus_25_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |

---

### Many Parameters (20 params)

#### 50 Virtual Users

Function: [`perf_many_params`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_postgres/init.sql#L165)

| Framework | Requests/s | Avg Latency | Total Requests | Summary | Source |
|-----------|----------:|------------:|---------------:|---------|--------|
| go-app-v1.25 | 16,100.46/s | 1.54ms | 966,176 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/go-app-v1.25_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/go-app-v1.25) |
| npgsqlrest-jit-v3.4.7 | 11,503.53/s | 2.16ms | 690,265 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-jit-v3.4.7_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-jit-v3.4.7) |
| npgsqlrest-aot-v3.4.7 | 11,220.54/s | 2.22ms | 673,270 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/npgsqlrest-aot-v3.4.7_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/npgsqlrest-aot-v3.4.7) |
| net10-minapi-dapper-jit | 10,701.77/s | 2.33ms | 642,149 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-dapper-jit_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-dapper-jit) |
| java24-spring-boot-v4.0.1 | 10,323.63/s | 2.41ms | 619,498 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/java24-spring-boot-v4.0.1_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/java24-spring-boot-v4.0.1) |
| swoole-php-app-v6.0 | 9,457.64/s | 2.63ms | 567,509 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/swoole-php-app-v6.0_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/swoole-php-app-v6.0) |
| rust-app-v1.91.1 | 9,230.96/s | 2.69ms | 553,984 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/rust-app-v1.91.1_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/rust-app-v1.91.1) |
| fastify-app-v5.7.1 | 7,710.72/s | 3.23ms | 462,679 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastify-app-v5.7.1_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastify-app-v5.7.1) |
| net10-minapi-ef-jit | 7,452.38/s | 3.34ms | 447,165 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net10-minapi-ef-jit_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net10-minapi-ef-jit) |
| net9-minapi-ef-jit | 7,181.52/s | 3.47ms | 430,916 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/net9-minapi-ef-jit_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/net9-minapi-ef-jit) |
| postgrest-v14.3 | 3,960.49/s | 6.30ms | 237,672 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/postgrest-v14.3_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/postgrest-v14.3) |
| bun-app-v1.3.3 | 3,116.21/s | 8.01ms | 187,044 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/bun-app-v1.3.3_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/bun-app-v1.3.3) |
| django-app-v6.0.1 | 2,222.19/s | 11.24ms | 133,359 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/django-app-v6.0.1_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/django-app-v6.0.1) |
| fastapi-app-v0.128.0 | 2,079.91/s | 12.01ms | 124,813 | [summary](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202601211416/src/_k6/results/202601211416/fastapi-app-v0.128.0_manyparams_60svus_50_summary.txt) | [source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202601211416/src/fastapi-app-v0.128.0) |

<BlogNav
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Installation', href: '/guide/installation' },
    { text: 'Configuration Guide', href: '/guide/configuration' }
  ]"
/>

---
layout: doc
outline: [2, 3]
title: "Axum (Rust) — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Axum 0.8.9 — a line-for-line port of the Actix app — lands within 1% of its sibling in the July 2026 PostgreSQL REST API benchmark, on the lowest CPU usage in the field."
---

# Axum 0.8.9 (Rust 1.97 + tokio-postgres)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Rust</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Axum 0.8.9 on Rust 1.97 — new entrant this round |
| **PostgreSQL driver** | tokio-postgres via deadpool-postgres (pool 100) |
| **Concurrency model** | Tokio multi-threaded runtime, workers = cores |
| **Lines of code** | 248 |
| **Podiums** | none — of 38 combinations |
| **Source** | [axum-app-v0.8.9](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/axum-app-v0.8.9) |

**The verdict in one sentence: a line-for-line port of the Actix app produced statistically identical results — for this workload class, choosing between Rust web frameworks is an ergonomics decision, not a performance one.**

## Implementation

This app was added specifically as a controlled experiment: same deadpool-postgres pool, same tokio runtime, same handler bodies as [Actix](/blog/benchmarks-2026-07/actix) — including the same `format!` SQL-interpolation workaround for tokio-postgres type handling. Only the framework layer differs. Where Actix uses attribute macros (`#[get("/api/perf-test")]`), Axum wires plain async functions into a `Router` ([main.rs](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/axum-app-v0.8.9/src/main.rs)):

```rust
async fn get_test_data(
    State(pool): State<Pool>,
    Query(query): Query<QueryParams>,
) -> Json<Vec<TestResult>> { /* identical body to the Actix handler */ }

let app = Router::new()
    .route("/api/perf-test", get(get_test_data))
    .route("/api/perf-minimal", get(perf_minimal))
    .route("/api/perf-post", post(perf_post))
    .route("/api/perf-nested", get(perf_nested))
    .route("/api/perf-large-payload", get(perf_large_payload))
    .route("/api/perf-many-params", get(perf_many_params))
    .with_state(pool);

let listener = tokio::net::TcpListener::bind("0.0.0.0:5301").await.unwrap();
axum::serve(listener, app).await.unwrap();
```

Extractors in the signature instead of macros above it; `with_state` instead of `app_data`. It is also 8 lines shorter (248 vs 256).

## Results

### The twin experiment

The headline table. Same machine, same PostgreSQL functions, same driver, two frameworks:

| Combination | Actix | Axum | Δ |
|---|---:|---:|---:|
| minimal, 100 VU | 12,669 (#15) | 12,644 (#16) | −0.2% |
| perf-test 100 VU / 1 rec | 2,246 (#17) | 2,263 (#15) | **+0.8%** |
| perf-test 50 VU / 10 rec | 1,481 (#6) | 1,493 (#4) | +0.8% |
| POST 100 VU / 10 rec | 3,836 (#9) | 3,842 (#7) | +0.2% |
| params 100 VU | 9,462 (#16) | 9,731 (#15) | +2.8% |
| nested 100 VU / depth 3 | 1,090 (#14) | 1,096 (#5) | +0.6% |
| large 50 VU / 100 KB | 1,300 (#18) | 1,303 (#17) | +0.2% |

Every delta is within run-to-run noise. The nested row is the best illustration of how compressed this field is: 6 req/s separates rank #14 from rank #5. The rank columns look like different frameworks; the throughput columns are the same framework.

### On its own terms

The profile is Actix's profile: mid-table on the server-bound scenarios — minimal at 12,644 (#16) / 12,749 (#14) / 12,574 (#15) across 100/200/500 VU, many-parameters #15 at every level (9,768 req/s at 50 VU) — and top-five once rows get heavy: **#4** at 50 VU/10 records (1,493 req/s), **#5** at 100 VU for both 100 and 500 records, and #5 across all three depths of nested JSON at 100 VU. Like Actix, its minimal baseline is nearly flat from 100 to 500 VU (12,644 → 12,574, −0.6%) while the leaders shed 16–19%.

### Latency

p99 of 3 ms at 1 VU on the single-record perf-test, 23 ms on the minimal baseline at 100 VU — one millisecond inside its sibling. It held the sub-1s p99 SLO in 11 of 16 perf-test combinations, the field's standard result. Worst tail: 4,384 ms at 200 VU × 500 records, mid-pack for that DB-saturated combo.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 145 MB | 25 MB | **49%** |

The lowest average CPU in the entire benchmark — on a four-core (400%) budget, Axum used less than half of one core. Its 25 MB average memory matches Go and is 1 MB shy of Swoole's field-best 24 MB. Peak memory (145 MB) even came in below Actix's 167 MB. Whatever the throughput ranks say, this is the cheapest-running HTTP service in the field per unit of work delivered alongside its sibling.

## Analysis

The conclusion a data analyst draws from the twin table is unambiguous: **the Rust web framework you pick will not change your API's throughput on database-call workloads.** Actix and Axum share tokio and diverge at the routing/extraction layer, and that layer measures at +0.8% on the headline combo — noise. The costs that dominate (driver round-trip, JSON pass-through) sit below both frameworks; the differences that remain (macro attributes vs `Router` composition, `web::Data` vs `State` extractors, ecosystem, error-handling style) are exactly the things benchmarks can't rank. Pick on ergonomics.

The same is true of the efficiency story: the two lowest CPU averages in the field belong to this pair (49% and 58%), with memory profiles in Go/Swoole territory. If the deciding factor is cost per instance rather than peak req/s, the Rust pair's mid-table ranks undersell them.

**January → July movement:** none to report — Axum is new this round, so there is no January position to compare. Its reference point is its sibling: see [Actix's](/blog/benchmarks-2026-07/actix) January movement, which now describes both of them.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/axum-app-v0.8.9)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Spring Boot →](/blog/benchmarks-2026-07/spring-boot)

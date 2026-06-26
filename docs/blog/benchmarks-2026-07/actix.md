---
layout: doc
outline: [2, 3]
title: "Actix-web (Rust) — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Actix-web 4.14 with tokio-postgres in the July 2026 PostgreSQL REST API benchmark: mid-table throughput everywhere, delivered on the second-lowest CPU usage in the field."
---

# Actix-web 4.14 (Rust 1.97 + tokio-postgres)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Rust</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Actix-web 4.14 on Rust 1.97 |
| **PostgreSQL driver** | tokio-postgres via deadpool-postgres (pool 100) |
| **Concurrency model** | Tokio multi-threaded runtime, workers = cores |
| **Lines of code** | 256 (second-most after Go's 303) |
| **Podiums** | none — of 38 combinations |
| **Source** | [rust-app-v1.97.0](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/rust-app-v1.97.0) |

**The verdict in one sentence: Rust's flagship web framework finished mid-table in every scenario — and did it at 58% average CPU, working less than half as hard as most of the field.**

## Implementation

Attribute-macro routing, serde structs for all twenty-three output columns, deadpool for connections. One caveat is right there in the source: for several PostgreSQL type paths the app builds SQL with `format!` string interpolation instead of fully parameterized queries — a workaround for tokio-postgres type handling ([main.rs](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/rust-app-v1.97.0/src/main.rs)):

```rust
#[get("/api/perf-test")]
async fn get_test_data(
    pool: web::Data<Pool>,
    query: web::Query<QueryParams>,
) -> Result<web::Json<Vec<TestResult>>> {
    let client = pool.get().await.unwrap();

    // Build SQL with inline values for types that tokio-postgres
    // can't handle as parameters
    let json_escaped = query._json.replace("'", "''");

    let sql = format!(
        "SELECT ... FROM public.perf_test({}, '{}', ... '{}'::jsonb, ...)",
        query._records, text_escaped, /* ... */ json_escaped, /* ... */
    );
    let rows = client.query(&sql, &[]).await.unwrap();
```

To be honest about what that means: inlining values skips parameter binding on those paths, which is slightly favorable to Actix relative to the fully parameterized implementations, and it is not what a production Rust app should ship. It also didn't buy a podium.

## Results

### Where it held its own

Actix's pattern is consistent: the heavier the rows, the better its rank. On the comprehensive serialization scenario (perf-test) it climbs from the high teens on 1-record requests into the top five once real payloads are involved:

| perf-test | 10 records | 100 records | 500 records |
|---|---:|---:|---:|
| 50 VU | 1,481 req/s (#6) | 170 (#5) | 35 (#5) |
| 200 VU | 1,431 req/s (#4) | 168 (#5) | 35 (#6) |

POST body parsing lands #7–#9 across all six combinations (4,099 req/s at 50 VU/10 records), and nested JSON at depth 2 reaches #5 (1,345 req/s at 50 VU).

The most interesting number is the one that looks boring: the minimal baseline holds **12,669 → 12,666 → 12,607 req/s** from 100 to 500 VU — a 0.5% drop across a 5× concurrency increase, while the leaders shed 16–19% over the same range. Actix doesn't rank higher at 500 VU (#14) so much as the field falls back toward it.

### Where it didn't

The server-bound scenarios are mid-table throughout: minimal is #15/#16/#14 across the three VU levels (12,669 req/s at 100 VU — 75% of Go's 16,882), many-parameters is #16 at all three levels (9,591 req/s at 50 VU), and the 100 KB large-payload combos sit #17–#18. The 1-record perf-test under concurrency is the weakest spot: 2,352 (#16) at 50 VU, 2,246 (#17) at 100 VU, 2,241 (#15) at 200 VU.

### Latency

Clean at the front: p99 of 3 ms at 1 VU, 24 ms on the minimal baseline at 100 VU. At the very heaviest combination (200 VU × 500 records) its p99 of 6,383 ms is among the three highest tails in the field — though throughput there (35 req/s) matches the pack, so this is queueing at a DB-saturated combo rather than a server pathology. It held the sub-1s p99 SLO in 11 of 16 perf-test combinations, the same as almost every framework tested.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 167 MB | 59 MB | 58% |

This is the row the throughput ranks hide. On a four-core budget (400% available), Actix averaged 58% — the second-lowest CPU consumption in the entire field, behind only its sibling [Axum](/blog/benchmarks-2026-07/axum) at 49%. The Node/Bun/Deno group that outran it on minimal burned 92–110% CPU to get there, and the .NET pair 128–150%. Actix delivered mid-pack throughput while mostly idle, which matters if the API shares a box with anything else.

## Analysis

Readers who expect Rust to top every chart will find this page surprising, and the explanation is worth being precise about: **at DB-API workloads the bottleneck is the driver round-trip and JSON pass-through, not the language.** Every framework here calls the same PostgreSQL functions; Rust's compute advantage has almost nothing to bite on when the work per request is one pooled query and a serialization pass of JSON the database already built. What the language does buy is the resource profile above — and the flat degradation curve under concurrency.

The sibling story confirms it: [Axum](/blog/benchmarks-2026-07/axum), a line-for-line port of this app, lands within 0.8% at the 100 VU/1-record perf-test (2,246 → 2,263 req/s). Two different Rust frameworks, one result — the framework layer is not where the time goes.

The cost side: 256 lines of code, second only to Go's 303, most of it the hand-written `TestResult` struct and row-scanning for twenty-three columns.

**January → July movement:** rankings only — the fairness overhaul (workers = cores for event-loop frameworks, equalized pools) makes absolute numbers incomparable between rounds. Actix was #2 of 14 on the single-request perf-test in January and is #8 of 20 now; on the minimal baseline it went from #7 of 14 to #15 of 20. The slide is mostly other people's gains: the Node/Bun/Deno group, single-process in January, now runs one worker per core and jumped ahead on the server-bound charts. Its mid-pack standing under concurrent load (#9 of 14 at 50 VU/1 record in January, #16 of 20 now) was true then and is true now.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/rust-app-v1.97.0)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Axum →](/blog/benchmarks-2026-07/axum)

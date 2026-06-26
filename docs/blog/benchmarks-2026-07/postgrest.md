---
layout: doc
outline: [2, 3]
title: "PostgREST — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "PostgREST 14.14 in the July 2026 PostgreSQL REST API benchmark: a complete REST API from 12 lines of configuration, a fixed connection-pool handicap, and honest last places."
---

# PostgREST 14.14

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Database-first</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | PostgREST 14.14 (Haskell / GHC runtime) |
| **PostgreSQL driver** | Built-in pool — `db-pool = 100` (the default is 10) |
| **Concurrency model** | GHC green threads — no configuration |
| **Lines of code** | **12 (config only)** — the lowest in the benchmark |
| **Podiums** | none — 0 of 38 combinations |
| **Source** | [postgrest-v14.14](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/postgrest-v14.14) |

**The verdict in one sentence: twelve lines of configuration buy a complete REST API that keeps pace wherever the database does the work — and trails the field everywhere the server does.**

## Implementation

There is no application. The entire service is [postgrest.conf](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/postgrest-v14.14/postgrest.conf); functions are called as `/rpc/perf_test?_records=...` instead of the `/api/perf-test` style the coded services use:

```ini
db-uri       = "postgres://testuser:testpass@postgres:5432/testdb"
db-schema    = "public"
db-anon-role = "testuser"

# Match the 100-connection pool every other service uses (default is only 10)
db-pool = 100

log-level = "crit"
```

The `db-pool` line is this round's fix: in January PostgREST ran its default of 10 connections while the field had ~100 — a silent 10× handicap on the resource every scenario contends for.

## Results

### Where config-only holds up

On the heaviest payloads, where connection availability and database time dominate, PostgREST sits in the top third of the field:

| perf-test | 100 records | 500 records |
|---|---:|---:|
| 50 VU | 169 (#7) | 35 (#8) |
| 100 VU | 168 (#6) | 35 (#6) |
| 200 VU | 168 (#6) | 35 (#5) |

At 200 VU/500 records its #5 places it ahead of both Rust frameworks and all four JavaScript runtimes — proof that with a full-size pool, the Haskell runtime moves heavy rows as well as most hand-written services.

### Where it trails

Everywhere the request itself is the work, PostgREST is #19 or #20 of 20:

| Scenario | Result |
|---|---|
| perf-test, 1 record | 1,363 req/s at 50 VU falling to 1,237 at 200 VU (#20 at every concurrent level) |
| Minimal baseline | 6,986 req/s at 100 VU (#19) — only Django below it |
| Many parameters | 3,726 req/s at 50 VU (#19) — each `_pN` becomes a parsed, type-checked function argument |
| Large payload | 729 req/s at 25 VU/100 KB and 164 at 25 VU/500 KB (#20 in all four combos) — roughly half of the #19 result |

Large payloads are the sore spot: the field clusters at 1,287–1,427 req/s on the 100 KB combos; PostgREST manages 727–729.

### Latency

The 1-record tails tell the same story as the throughput table: p99 of 151 ms at 50 VU, 342 ms at 100 VU, and 755 ms at 200 VU — an order of magnitude above the leaders' 25–48 ms band at 50 VU. It was also the only service to break 1 s p99 on a large-payload combination (1,189 ms at 50 VU/500 KB). On the heavy perf-test combos, where it ranks well, its tails match the pack (2,515 ms at 200 VU/100 rec, mid-field).

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 112 MB | 57 MB | 103.0% |

Third-smallest peak footprint of all 20 services, behind only Swoole (44 MB) and Go (59 MB). A complete REST layer in 57 MB average is a respectable bill for zero application code.

## Analysis

PostgREST's value is density, not speed. Twelve lines of configuration — the [lines-of-code winner](/blog/benchmarks-2026-07/analysis#performance-per-line-of-code) by a wide margin — produce six working endpoints plus a full REST surface (filtering, embedding, JWT auth) this benchmark never exercises. Every coded service on these pages spends 100–300 lines to match what one config file does. The trade is a fixed per-request tax that no configuration removes: last place in every small-request category, at every concurrency level.

But the tax is not inherent to the *approach*. [NpgsqlRest](/blog/benchmarks-2026-07/npgsqlrest), the other config-only competitor (21 lines), serves the same database-first idea at 15,549 req/s on the minimal baseline where PostgREST posts 6,986, and 2,615 req/s on 1-record perf-test where PostgREST posts 1,322 — roughly 2× on both, from a config file of comparable size. Database-first is not the bottleneck; this particular request pipeline is.

**January → July movement:** the `db-pool` 10 → 100 fix is the headline change, and its signature is visible in the heavy combinations, where PostgREST now holds #5–#8 instead of queueing on a starved pool; the small-request categories stayed at the bottom, as in January. Rankings only — the methodology changed too much for absolute comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Configuration](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/postgrest-v14.14)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next:** [NpgsqlRest Deep Dive →](/blog/benchmarks-2026-07/npgsqlrest)

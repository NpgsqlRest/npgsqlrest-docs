---
layout: doc
outline: [2, 3]
title: "Go (net/http) — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Go 1.26 with net/http and pgx in the July 2026 PostgreSQL REST API benchmark: 17 gold medals, five category wins, and 25 MB of memory."
---

# Go 1.26 (net/http + pgx)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Go</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Go 1.26, `net/http` standard library |
| **PostgreSQL driver** | pgx v5.10.0 (`pgxpool`, max 100 connections) |
| **Concurrency model** | Goroutines — all cores, no configuration |
| **Lines of code** | 303 (the most of any framework tested) |
| **Podiums** | 🥇 17 · 🥈 13 · 🥉 3 — of 38 combinations |
| **Source** | [go-app-v1.26](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/go-app-v1.26) |

**The verdict in one sentence: Go won every category that measures the HTTP server, and paid for it in application code.**

## Implementation

Plain standard library — no framework at all. Handlers parse query parameters manually, call the function through pgx, scan rows into structs, and marshal with `encoding/json`:

```go
pool, err = pgxpool.New(ctx,
    "host=postgres port=5432 user=testuser password=testpass dbname=testdb pool_max_conns=100")

http.HandleFunc("/api/perf-test", handleTestData)
http.HandleFunc("/api/perf-minimal", handleMinimal)
// ...
http.ListenAndServe(":5200", nil)
```

There is no router library, no middleware stack, no serialization layer beyond struct tags. That is both the source of Go's numbers and the source of its 303 lines — every parameter of `perf_test`'s sixteen inputs and twenty-three output columns is written out by hand ([main.go](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/go-app-v1.26/main.go)).

## Results

### Where it dominated

Go took **first place in every combination** of three whole scenarios, and the top of a fourth:

| Scenario | Result |
|---|---|
| Minimal baseline | 🥇 at 100/200/500 VU — peak **16,882 req/s**, the highest single number in the entire benchmark |
| Many parameters | 🥇 at all three VU levels — 15,449 req/s at 50 VU |
| Large payload | 🥇 in 3 of 4 combinations — 1,427 req/s serving 100 KB responses |
| POST body parsing | 🥇 at 10 records for all VU levels (7,598 req/s at 50 VU) |
| Nested JSON | 🥇 or 🥈 everywhere — and uniquely flat across depth (2,106 → 1,971 req/s from depth 1 to 3, a 6% drop where most frameworks lose 30%+) |

The nested-depth result deserves a highlight: `encoding/json` passes PostgreSQL's already-serialized JSON through with minimal reprocessing, so deeper nesting costs Go almost nothing.

### Where it didn't

The comprehensive serialization scenario (perf-test) tells a more nuanced story. At 1 VU Go is #1 (927 req/s — the fastest single-request path in the field). But under concurrency it settles into #6 at around 2,950 req/s, behind FastAPI's worker pool and the Bun/Deno pair, and behind NpgsqlRest's SQL-file variants:

| perf-test, 1 record | 1 VU | 50 VU | 100 VU | 200 VU |
|---|---:|---:|---:|---:|
| req/s | 🥇 927 | 3,049 (#6) | 2,948 (#6) | 2,943 (#6) |

Its scaling factor of 3.3× (1 → 200 VU) is one of the lowest in the field — not because Go stops scaling, but because its single-VU baseline is so high that there is less headroom to multiply. On heavier rows (10–500 records) it recovers to #2 at every concurrency level, behind only Swoole.

### Latency

Go's latency profile is the cleanest in the benchmark: p99 of **2 ms** at 1 VU, 21 ms on the minimal baseline at 100 VU, and the field's most graceful degradation under payload weight. Like every framework tested, it exceeds 1 s p99 on the 100+ VU × 100+ record combinations — those are DB-payload physics, not server behavior.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 59 MB | **25 MB** | 90% |

Second-most frugal service in the benchmark (only Swoole used less), while winning five categories. Go's throughput-per-megabyte is in a league shared only with Swoole and the Rust pair — a fifth of NpgsqlRest JIT's average footprint and a twentieth of the Node cluster deployments.

## Analysis

Go's January reputation — *the pure HTTP champion* — survived the fairness overhaul completely intact, which is itself informative: Go gained nothing from the worker equalization because it never needed deployment tuning to use the whole machine. What January called a framework advantage was partly a configuration advantage for Go; with that equalized, Go still wins the server-bound categories outright.

The trade-off is spelled out in the [lines-of-code comparison](/blog/benchmarks-2026-07/analysis#performance-per-line-of-code): 303 lines, every one hand-written, to expose six endpoints. Go asks you to be the framework. For teams willing to pay that, this round shows exactly what they buy: the fastest HTTP layer in the field, running in 25 MB.

**January → July movement:** held #1 in minimal, params, and POST; ceded the perf-test crown it never held (that was NpgsqlRest's in January, and is [FastAPI's](/blog/benchmarks-2026-07/fastapi) now); took the large-payload title from [Swoole](/blog/benchmarks-2026-07/swoole). Rankings only — the methodology changed too much for absolute comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/go-app-v1.26)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Swoole PHP →](/blog/benchmarks-2026-07/swoole)

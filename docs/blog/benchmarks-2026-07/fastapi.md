---
layout: doc
outline: [2, 3]
title: "FastAPI — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "FastAPI 0.139.0 in the July 2026 PostgreSQL REST API benchmark: from bottom tier to winning the flagship scenario at every concurrent load level — because of one deployment flag."
---

# FastAPI 0.139.0 (uvicorn + asyncpg)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Python</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | FastAPI 0.139.0 on Python 3.14, uvicorn 0.51 with uvloop + httptools, orjson responses |
| **PostgreSQL driver** | asyncpg 0.31.0 — per-worker pool, workers × 12 ≈ 100 aggregate connections |
| **Concurrency model** | Async event loop, one uvicorn worker per core (`--workers $(nproc)`) |
| **Lines of code** | 123 |
| **Podiums** | 🥇 4 · 🥈 3 · 🥉 16 — of 38 combinations |
| **Source** | [fastapi-app-v0.139.0](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/fastapi-app-v0.139.0) |

**The verdict in one sentence: the biggest ranking move of the round belongs to FastAPI — from bottom tier in January to winning the flagship scenario at every concurrent load level — and the cause was a deployment flag, not the framework.**

## Implementation

Standard async FastAPI ([app.py](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/fastapi-app-v0.139.0/app.py)): typed `Query(...)` parameters, an asyncpg pool per worker, `ORJSONResponse` as the default serializer. The line that decided this round's story is in the Dockerfile:

```dockerfile
# Workers = CPU cores so the single-threaded event loop can use the whole machine,
# matching natively multi-threaded runtimes (Go, Rust, .NET, JVM).
CMD uvicorn app:app --workers ${WORKERS:-$(nproc)} --loop uvloop --http httptools \
    --no-access-log --log-level warning
```

```python
pool = await asyncpg.create_pool(..., min_size=2, max_size=POOL_MAX_SIZE)  # 12 per worker
```

In January this service ran **one uvicorn worker** on an 8-core machine. Everything else about the application is ordinary FastAPI.

## Results

### The headline: perf-test

FastAPI won the comprehensive 23-datatype serialization scenario at **every concurrent load level**, by the largest margins of any category winner in the round:

| perf-test, 1 record | 1 VU | 50 VU | 100 VU | 200 VU |
|---|---:|---:|---:|---:|
| req/s | 854 (#2) | 🥇 5,048 | 🥇 5,109 | 🥇 5,053 |

That is 45% ahead of the #2 at 100 VU (NpgsqlRest SQL-files AOT, 3,524) and 73% ahead of Go (2,948, #6). Its scaling factor — 854 → 5,109 from 1 to 100 VU, a **6.0×** multiplier — is the best in the field: eight independent event loops, each with its own connection pool, and almost no shared state to contend on.

On heavier rows it stays on the podium at every concurrency: #3 behind Swoole and Go at 10, 100, and 500 records (1,576 / 182 / 39 req/s at 50 VU). Large payloads were quietly excellent too — 342 req/s at 50 VU/500 KB (#1, its fourth gold), 1,402 at 50 VU/100 KB (#2) — and nested JSON was #3 across all six combinations.

### Where the bill arrives

Python's per-request costs did not disappear; they moved:

| Scenario | Result |
|---|---|
| Many parameters | 5,996 req/s at 50 VU (#18) — validating 20 typed query params through `Query(...)` is expensive; only PostgREST and Django are slower |
| Minimal baseline | 11,610 req/s at 100 VU (#17) — mid-to-lower table when there is no payload to win on |
| perf-test at 1 VU, heavy rows | 270 (#18) at 10 rec, 64 (#19) at 100 rec, 12 (#20) at 500 rec — single-request row materialization is the slowest in the field; concurrency across workers is what hides it |

The 1 VU column deserves emphasis: FastAPI is simultaneously #2 at 1 record and #20 at 500 records. Per-row `dict(row)` conversion in Python is slow; eight parallel workers mask it completely at 50+ VU, where the same workload ranks #3.

### Latency

At its winning combinations FastAPI also posted the field's best tails: p99 of **25 ms** at 50 VU/1 rec and **54 ms** at 100 VU/1 rec — the lowest of all 20 services on both, roughly half of Go's 48/97 ms. At 1 VU it matches the leaders at 2 ms. The params weakness shows in latency too: 126 ms p99 at 200 VU, versus 40–50 ms for the top tier.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 282 MB | 237 MB | **200.4%** |

Throughput is bought with hardware: alongside Django (229.6%), FastAPI posted the highest CPU usage in the field — two of four pinned cores busy on average, roughly double Go's 90% for comparable flagship-scenario numbers. Memory is moderate for an 8-process Python deployment: 282 MB peak, well under the Node cluster services, but ten times Swoole's average.

## Analysis

The single most transferable lesson of this benchmark round is on this page: **deployment configuration can matter more than framework choice.** The framework did not get 6× faster between January and July — its process count did. A single-worker uvicorn deployment on multi-core hardware silently forfeits most of the machine, and January's "FastAPI is slow" ranking was measuring that forfeit, not the framework. If you run FastAPI in production, `--workers`, uvloop, and a per-worker asyncpg pool are not optimizations; they are the baseline.

The honest counterweight: FastAPI now occupies the podium by spending more CPU than anyone except Django, its 16 bronzes are mostly third places behind Swoole and Go, and scenarios dominated by parsing (params) or bare routing (minimal) still rank it in the bottom quartile. Python's per-request cost is real — this round shows it can be parallelized away exactly where payload work dominates, and nowhere else.

**January → July movement:** bottom tier → #1 in the comprehensive perf-test at every concurrent load level, taking the crown NpgsqlRest held in January; params and minimal stayed low-table. Rankings only — the methodology changed too much for absolute comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/fastapi-app-v0.139.0)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Django →](/blog/benchmarks-2026-07/django)

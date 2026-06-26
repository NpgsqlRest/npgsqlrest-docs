---
layout: doc
outline: [2, 3]
date: "2026-07-15"
title: "PostgreSQL REST API Benchmark, July 2026: 20 Services, 760 Tests, One Question"
titleTemplate: NpgsqlRest
description: "The July 2026 PostgreSQL REST API benchmark series: 16 frameworks and 6 NpgsqlRest configurations tested under equalized conditions. Methodology, fairness changes, and per-framework deep dives."
---

# PostgreSQL REST API Benchmark, July 2026

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Performance</span> · <span class="tag">Series Introduction</span> · <span class="tag">July 2026</span>
</p>

**20 services. 760 tests. 33 hours of serialized, isolated measurement. Zero failed requests.**

This is the introduction to a series analyzing the July 2026 run of the [pg_function_load_tests](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327) benchmark — the most controlled round we have run to date. Every number in this series is reproducible from the [raw dataset](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv) committed alongside the code that produced it.

## What exactly did we test

Every service in this benchmark does the same job: **accept an HTTP request, execute a PostgreSQL function, and return the result as JSON.** The functions themselves ([init.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)) use `generate_series()` and in-memory computation only — no table I/O — so database response time is constant and predictable. What varies between services is everything *around* the query: HTTP parsing, routing, parameter binding, connection pooling, result materialization, and JSON serialization.

**That difference — framework overhead — is the entire subject of this benchmark.** We are measuring the cost of the application server, not the database.

Six scenarios exercise different parts of that pipeline:

| Scenario | What it stresses |
|----------|------------------|
| **perf-test** | End-to-end serialization of 23 PostgreSQL data types, 1–500 records |
| **minimal** | Pure HTTP routing overhead (near-empty response) |
| **post** | JSON request body parsing |
| **nested** | Nested JSON object serialization at depth 1–3 |
| **large** | Large response handling (100–500 KB payloads) |
| **params** | Query string parsing (20 typed parameters) |

Each scenario runs at multiple concurrency levels (1 to 500 virtual users) and payload sizes — 38 combinations, executed against all 20 services: **760 measured tests**, every one preceded by an untimed warmup run of the same test.

The 20 services span 16 distinct frameworks in 10 languages, plus six NpgsqlRest configurations tested side by side:

- **Python**: Django 6.0.7, FastAPI 0.139.0
- **JavaScript/TypeScript runtimes**: Fastify 5.10.0 and Express 5.2.1 on Node.js 24, Bun 1.3.14, Deno 2.9.2
- **Compiled**: Go 1.26 (net/http), Actix-web and Axum on Rust 1.97
- **JVM**: Spring Boot 4.1.0 on Java 25
- **PHP**: Swoole 6.2.1 on PHP 8.5
- **.NET 10**: Minimal API with EF Core, Minimal API with Dapper
- **Database-first**: PostgREST 14.14
- **NpgsqlRest**: 3.4.7 and 3.21.0, routine source and the new SQL file source, AOT and JIT builds

## Why we ran this round

Three reasons, in honest order of motivation:

1. **NpgsqlRest changed a lot.** Between 3.4.7 (the January round) and 3.21.0 sit eighteen minor releases, many micro-optimizations — and one entirely new endpoint source: [SQL files](https://npgsqlrest.github.io/guide/sql-files), which execute raw SQL statements directly instead of calling functions. We wanted to know what that costs — or saves. (Spoiler: the answer surprised us. See the [NpgsqlRest deep dive](/blog/benchmarks-2026-07/npgsqlrest).)
2. **The January round had fairness problems we only understood later.** Some frameworks ran one worker on an 8-core machine while others ran sixteen. Some had 100 database connections, some had 10, one had 4. The warmup phase turned out to be silently broken. Fixing all of this (details below) meant re-ranking everything.
3. **Framework comparisons are interesting.** Express, Axum, and Deno joined by popular demand, completing three natural experiments: two Node frameworks on the same driver, two Rust frameworks on the same stack, and three JavaScript runtimes running near-identical code.

## How we tested: the fairness overhaul

This round's methodology changes are significant enough that **absolute numbers are not comparable to the January 2026 round** — only rankings and relative gaps are. Where this series compares rounds, it compares positions, never req/s.

Everything below is in the [repository](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327) and documented in its README:

**Equal CPU budget.** Single-threaded event-loop frameworks now run one worker per core — uvicorn and gunicorn `--workers`, Node.js `cluster`, `SO_REUSEPORT` process groups for Bun and Deno — matching what natively multi-threaded runtimes (Go, Rust, .NET, JVM) get for free. Swoole, which previously ran `cpu×2` workers, was reduced to `cpu`. In January, part of the ranking measured *deployment configuration*; now it measures the framework.

**Equal database budget.** Every service gets an aggregate pool of ~100 connections; multi-worker services split it evenly. This fixed two silent handicaps: Django had been running on psycopg defaults (4 connections per worker) and PostgREST on its default `db-pool = 10`.

**CPU partitioning.** PostgreSQL is pinned to cores 0–1, the k6 load generator to cores 2–3, and the service under test to cores 4–7. The measured service never competes with the database or the load generator for CPU — previously, the faster a framework was, the more CPU the load generator stole from it.

**Test isolation.** Only one service is tested at a time, and all 19 idle services are frozen with `docker pause` during each test — no idle JVM garbage collection ticks, no connection pool keepalives, no scheduler noise — while preserving their JIT-warmed state. 30 seconds of quiet separate consecutive tests.

**Real warmup, honest load shape.** Every measured test is preceded by a 10-second untimed run of the *same* script and parameters, so JIT compilers, connection pools, and PostgreSQL plan caches are warm for the exact code path being measured. The measured run then ramps to its target concurrency in 10 seconds and holds it for a full 60 (the January round's "hold" was a ramp the entire time — a 200 VU test averaged roughly half its label).

**Serialization parity.** Spring Boot's PostgreSQL `json`/`jsonb` values are now serialized as raw JSON via a custom Jackson serializer, the way a production deployment would configure it — previously its responses carried a metadata wrapper that inflated payloads relative to every other framework.

**Honest bookkeeping.** Every test's start, end, and k6 exit code are recorded. Resource usage (sampled every second) is windowed to each service's actual test periods — the "average CPU" column finally means what it says. The complete dataset — throughput, latency percentiles (median/p90/p95/p99/max), bytes transferred, failure counts — ships as [results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv) in the results branch.

**Hardware:** Hetzner Cloud CCX33 — 8 dedicated vCPU (AMD x86), 32 GB RAM, Ubuntu 26.04. Load generator: k6, on the same host but on dedicated cores.

**Run integrity:** 760 of 760 tests completed with **zero failed HTTP requests**. 103 tests exceeded the p99 < 1 s latency objective on the heaviest payload combinations — uniformly across all 20 services — which is a finding about physics, not failures; the [overall analysis](/blog/benchmarks-2026-07/analysis) covers it.

## The tests themselves

Nothing is hidden: every request the load generator sent traces to a PostgreSQL function, a k6 script, and (for the NpgsqlRest SQL-file variants) a raw `.sql` statement — all in the repository.

The database work is deliberately synthetic. For example, the minimal-baseline function is nothing but:

```sql
create function public.perf_minimal()
returns table(status text, ts timestamptz)
stable language sql as
$$
select 'ok'::text as status, now() as ts
$$;
```

while [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L4) generates rows covering 23 PostgreSQL data types — text, integers, numerics, booleans, dates, timestamps, intervals, UUIDs, json/jsonb, and arrays — from `generate_series()`, so the database cost is identical for every framework and every run.

Each k6 scenario ramps to its target concurrency and holds it, verifying every single response:

```js
export const options = {
    thresholds: {
        http_req_failed: [{ threshold: "rate<0.01", abortOnFail: true }],
        http_req_duration: ["p(99)<1000"],
    },
    scenarios: {
        breaking: {
            executor: "ramping-vus",
            stages: [
                { duration: ramp, target: target },      // ramp up (10s)
                { duration: duration, target: target },  // hold at target (60s)
            ],
        },
    },
};

export default function () {
    const res = http.get(url);
    check(res, {
        [`${tag} status is 200`]: (r) => r.status === 200,
        [`${tag} response has all data records`]: (r) => JSON.parse(r.body).length == records,
        // ... field-level response validation
    });
}
```

Every scenario, with its function and load script:

| Scenario | PostgreSQL function | k6 script | Raw SQL twin |
|---|---|---|---|
| perf-test | [`perf_test`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L4) | [script.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/script.js) | [perf-test.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-test.sql) |
| minimal | [`perf_minimal`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L141) | [minimal-baseline.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/scenarios/minimal-baseline.js) | [perf-minimal.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-minimal.sql) |
| post | [`perf_post`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L105) | [post-body.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/scenarios/post-body.js) | [perf-post.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-post.sql) |
| nested | [`perf_nested`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L121) | [nested-json.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/scenarios/nested-json.js) | [perf-nested.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-nested.sql) |
| large | [`perf_large_payload`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L153) | [large-payload.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/scenarios/large-payload.js) | [perf-large-payload.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-large-payload.sql) |
| params | [`perf_many_params`](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql#L165) | [many-params.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/scenarios/many-params.js) | [perf-many-params.sql](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_sql_files/perf-many-params.sql) |

The orchestration lives in [run-all.sh](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/scripts/run-all.sh) (test loop, warmup, pausing) and [run-benchmark.sh](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/run-benchmark.sh) (resource monitoring); [docker-compose.yml](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/docker-compose.yml) + [docker-compose.server.yml](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/docker-compose.server.yml) define the 20 services and the CPU partitioning.

## The series

**Start here:**

- [Overall Analysis — winners by category, tiers, scaling, efficiency](/blog/benchmarks-2026-07/analysis)
- [NpgsqlRest Deep Dive — 3.4.7 vs 3.21.0, routine vs SQL files, AOT vs JIT](/blog/benchmarks-2026-07/npgsqlrest)

**Per-framework analysis:**

- [Go (net/http)](/blog/benchmarks-2026-07/go) · [Swoole PHP](/blog/benchmarks-2026-07/swoole) · [FastAPI](/blog/benchmarks-2026-07/fastapi) · [Django](/blog/benchmarks-2026-07/django)
- [Fastify](/blog/benchmarks-2026-07/fastify) · [Express](/blog/benchmarks-2026-07/express) · [Bun](/blog/benchmarks-2026-07/bun) · [Deno](/blog/benchmarks-2026-07/deno)
- [Actix-web](/blog/benchmarks-2026-07/actix) · [Axum](/blog/benchmarks-2026-07/axum) · [Spring Boot](/blog/benchmarks-2026-07/spring-boot) · [.NET 10](/blog/benchmarks-2026-07/dotnet) · [PostgREST](/blog/benchmarks-2026-07/postgrest)

**Reference:**

- [Raw Results — full tables for every scenario and combination](/blog/benchmarks-2026-07/results)
- [Benchmark source code and dataset (GitHub, branch 202607131327)](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327)

::: info Transparency note
The analysis in this series was generated with AI assistance from the raw benchmark dataset, then reviewed and edited. Anyone can verify every claim: the dataset, the code that produced it, and the report generator are all in the repository. Corrections and pull requests are welcome.
:::

---

**Next:** [Overall Analysis →](/blog/benchmarks-2026-07/analysis)

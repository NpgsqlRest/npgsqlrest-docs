---
layout: doc
outline: [2, 3]
title: "Swoole PHP — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Swoole 6.2.1 on PHP 8.5 in the July 2026 PostgreSQL REST API benchmark: 14 gold medals on the heavy-payload combinations, 44 MB of peak memory, and a large-payload crown lost to Go."
---

# Swoole 6.2.1 (PHP 8.5 + PDO)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">PHP</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Swoole 6.2.1 on PHP 8.5 (official `phpswoole/swoole` Alpine image) |
| **PostgreSQL driver** | PDO `pdo_pgsql` via `Swoole\Database\PDOPool`, ~12 connections per worker (~100 aggregate) |
| **Concurrency model** | Coroutines over forked worker processes — `worker_num = swoole_cpu_num()` |
| **Lines of code** | 198 |
| **Podiums** | 🥇 14 · 🥈 8 · 🥉 0 — of 38 combinations |
| **Source** | [swoole-php-app-v6.2.1](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/swoole-php-app-v6.2.1) |

**The verdict in one sentence: Swoole won everything that moves real data under real concurrency — 14 golds, second only to Go's 17 — and did it in less memory than any other service in the benchmark.**

## Implementation

A single [server.php](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/swoole-php-app-v6.2.1/server.php): one long request handler dispatching on path, prepared statements through PDO, `json_encode` out. The two fairness-relevant settings are worker count and pool size:

```php
$server->set([
    // Workers = CPU cores (was cpu*2): same core budget as every other service
    'worker_num' => swoole_cpu_num(),
    'enable_coroutine' => true,
]);

$pool = new \Swoole\Database\PDOPool(
    (new \Swoole\Database\PDOConfig())->withDriver('pgsql') /* ... */,
    // Pool is per worker process (forked): workers x size ~= 100 aggregate
    max(2, intdiv(100, swoole_cpu_num()))
);
```

Both comments mark January corrections: Swoole previously ran twice as many workers as everyone else and kept 100 connections *per worker*. This round it gets the same core and connection budget as the rest of the field.

## Results

### Where it dominated

Swoole took first place in **every perf-test combination of 10 or more records under concurrent load** — nine golds in the benchmark's heaviest scenario, plus both single-user heavy combos (111 req/s at 1 VU/100 rec, 24 at 1 VU/500 rec):

| perf-test | 50 VU | 100 VU | 200 VU |
|---|---:|---:|---:|
| 10 records | 🥇 1,834 | 🥇 1,801 | 🥇 1,764 |
| 100 records | 🥇 215 | 🥇 212 | 🥇 212 |
| 500 records | 🥇 45 | 🥇 45 | 🥇 45 |

The margin over Go (#2 in all nine) is consistently 13–15%. This is the coroutine scheduler earning its keep: the heavier the rows, the longer each request holds a connection, and the more overlapping I/O waits pay off.

Three more golds came from nested JSON (1,997 at 50 VU/depth 2; 1,949 and 1,894 at 100 VU/depths 2–3), trading first and second with Go across all six combos. POST was strong too: 7,200 req/s at 50 VU/10 rec (#4), rising to #2 at 100 VU (6,992) and 200 VU (6,533).

### Where it didn't

Small requests are Swoole's weak flank — per-request PHP overhead dominates when there is no payload to amortize it:

| Scenario | Result |
|---|---|
| Minimal baseline | 10,794 req/s at 100 VU (#18) — only PostgREST and Django below it |
| Many parameters | 8,447–8,565 req/s (#17) — binding 20 typed params through PDO is not cheap |
| Large payload | 1,287 req/s at 25 VU/100 KB (#19) — the crown it wore in January, now Go's |
| perf-test, 1 record | ~2,430 req/s at 50–200 VU (#14) |

The large-payload reversal is the round's clearest fairness artifact: with `cpu×2` workers in January, twice as many processes were pushing 100 KB responses; on an equal worker budget, Go's write path wins outright. Rankings only — the absolute numbers are not comparable across rounds.

### Latency

Where Swoole wins throughput, it also wins tail latency: p99 of 537 ms at 50 VU/100 rec (Go, next best, 618 ms) and 3,705 ms at 200 VU/500 rec — the lowest in the field on both. It held p99 < 1 s in 12 of 16 perf-test combinations, tied with Bun for the most (every other service held 11), squeaking under at 50 VU/500 rec with 999 ms. At 1 VU everything sits at 3 ms.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| **44 MB** | **24 MB** | 65.6% |

The most memory-frugal service of all 20 — lowest peak and lowest average — while winning 14 combinations. It also posted one of the lowest CPU averages in the field. 1,834 req/s of 10-record serialization from a runtime averaging 24 MB is the best throughput-per-megabyte story in the benchmark, ahead of even Go (25 MB avg, 90% CPU).

## Analysis

Swoole's profile is unusually legible: it is a *payload* specialist. Every gold sits in a combination where the response body is large enough that connection hold time and serialization dominate, and coroutines can overlap the waiting. Every weak result sits where the request itself is the work — routing, query-string parsing, tiny responses — and PHP's per-request cost shows through. If your API returns real result sets, this round says Swoole is the fastest thing in the field at it; if it returns pings, it is bottom-quartile.

The fairness overhaul cut both ways. Halving its workers from `cpu×2` to `cpu` cost it the large-payload title; capping its aggregate pool at ~100 connections did not dent its heavy perf-test dominance at all. And it achieved all of this with the smallest memory footprint of the round — there is no efficiency trade hiding behind the medals.

**January → July movement:** kept its heavy perf-test crown (all nine 10+ record concurrent combos, then and now); lost the large-payload title to [Go](/blog/benchmarks-2026-07/go), falling out of that podium entirely after the worker equalization; stayed near the bottom on the minimal baseline. Rankings only — the methodology changed too much for absolute comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/swoole-php-app-v6.2.1)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [FastAPI →](/blog/benchmarks-2026-07/fastapi)

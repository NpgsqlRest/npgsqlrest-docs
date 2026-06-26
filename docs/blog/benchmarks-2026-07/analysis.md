---
layout: doc
outline: [2, 3]
title: "Overall Analysis — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Winners by category, performance tiers, scaling behavior, latency objectives, resource efficiency, and performance per line of code across 20 PostgreSQL REST API services."
---

# Overall Analysis: What 760 Tests Say

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Analysis</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series. Methodology and fairness changes are covered in the [introduction](/blog/benchmarks-2026-07/); every number below is reproducible from [results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv).

## Five findings

1. **Go won everything that measures the HTTP server itself** — all three minimal-baseline combinations, all three params combinations, most of large-payload and POST: 17 gold medals of 38 combinations, more than twice anyone else. On 25 MB of average memory.
2. **FastAPI won the headline scenario** — first place in comprehensive data-type serialization (perf-test) at every concurrency level, after finishing bottom-tier in January. Nothing about FastAPI changed; its *deployment* did (1 worker → 8). The single largest ranking movement in the benchmark's history is a configuration diff.
3. **NpgsqlRest's SQL file source is the fastest zero-code path ever measured here** — +33% over the routine source on small payloads, #2 and #3 in the field on perf-test, ahead of hand-written same-driver .NET code by >50%. Full analysis in the [deep dive](/blog/benchmarks-2026-07/npgsqlrest).
4. **Sibling frameworks are statistically identical.** Actix vs Axum: +0.8%. Fastify vs Express: −1.4%. EF Core vs Dapper (perf-test): +1.1%. Bun vs Deno (minimal): +2.5%. Once deployment and pools are equalized, the driver and the runtime decide; the framework layer above them is noise at this workload.
5. **Swoole is the efficiency phenomenon**: 14 gold medals — every heavy perf-test combination — on the smallest memory footprint of the entire field (44 MB peak).

## Winners by category

Reference combos per scenario; medals count across *all* 38 combinations follows.

| Category | 🥇 | 🥈 | 🥉 |
|---|---|---|---|
| Minimal baseline (100 VU) | Go 16,882 | Deno 16,436 | Fastify 16,243 |
| perf-test (100 VU, 1 rec) | FastAPI 5,109 | NpgsqlRest Files AOT 3,524 | NpgsqlRest Files JIT 3,467 |
| perf-test heavy (100 VU, 500 rec) | Swoole 45 | Go 39 | FastAPI 38 |
| POST body (50 VU, 10 rec) | Go 7,598 | Bun 7,461 | Deno 7,238 |
| Nested JSON (50 VU, d1) | Go 2,106 | Swoole 2,092 | FastAPI 2,030 |
| Large payload (25 VU, 100 KB) | Go 1,427 | Deno 1,418 | FastAPI 1,416 |
| Many params (50 VU) | Go 15,449 | Bun 15,156 | Deno 14,797 |

**Podium totals across all 38 combinations:**

| Service | 🥇 | 🥈 | 🥉 |
|---|---:|---:|---:|
| Go 1.26 | 17 | 13 | 3 |
| Swoole PHP 6.2.1 | 14 | 8 | 0 |
| FastAPI 0.139.0 | 4 | 3 | 16 |
| Deno 2.9.2 | 2 | 3 | 6 |
| Bun 1.3.14 | 1 | 5 | 6 |
| NpgsqlRest SQL Files (AOT/JIT) | 0 | 5 | 5 |

Two services own 31 of 38 golds — but in disjoint territories. Go rules everything server-bound; Swoole rules everything payload-bound. They are almost never in each other's way.

## The headline ranking, with tiers

perf-test at 100 VU, 1 record — the closest thing to "a typical API lookup under load":

| Tier | Service | req/s |
|---|---|---:|
| **Leader** | FastAPI | 5,109 |
| **Chasers** | NpgsqlRest SQL Files AOT / JIT | 3,524 / 3,467 |
| **The pack** (within 20%) | Deno · Bun · Go · Spring Boot · NpgsqlRest Routine ×4 · Fastify · Express · Swoole | 3,047 – 2,431 |
| **Trailing** | Axum · .NET Dapper · Actix · .NET EF | 2,263 – 2,230 |
| **Bottom** | Django · PostgREST | 1,911 / 1,322 |

Three observations a ranking alone hides:

- The **pack is dense**: positions 4 through 14 span 25%. Small implementation choices (driver pipelining, JSON pass-through) matter more than language here.
- The **Rust pair trailing** Go, Bun and even Spring Boot will surprise readers — but at 1-record requests this is a driver round-trip benchmark, and tokio-postgres's path through this workload is simply slower than pgx's or Npgsql's. The [Actix](/blog/benchmarks-2026-07/actix) and [Axum](/blog/benchmarks-2026-07/axum) pages dig in, including their remarkable CPU efficiency (the lowest in the field — they do these numbers half-asleep).
- **PostgREST last** despite this round *fixing* its connection pool handicap — see [its page](/blog/benchmarks-2026-07/postgrest) for the honest breakdown.

## Scaling behavior

Requests/s at 1 record as concurrency grows, with the 1→200 VU multiplier:

| Service | 1 VU | 50 VU | 100 VU | 200 VU | Factor |
|---|---:|---:|---:|---:|---:|
| FastAPI | 854 | 5,048 | 5,109 | 5,053 | **6.0×** |
| NpgsqlRest Files AOT | 658 | 3,568 | 3,524 | 3,481 | **5.4×** |
| NpgsqlRest Files JIT | 753 | 3,621 | 3,467 | 3,453 | **4.8×** |
| Deno | 676 | 3,065 | 3,047 | 3,120 | **4.6×** |
| Bun | 738 | 3,068 | 3,016 | 3,140 | **4.3×** |
| Go | 927 | 3,049 | 2,948 | 2,943 | **3.3×** |

Two patterns. First, **everyone saturates by 50 VU** and holds flat to 200 — no service in the field degrades under 4× more concurrency than its saturation point, which is a collective compliment to 2026's server runtimes. Second, the scaling factor mostly measures the *inverse* of single-request speed: Go's "low" 3.3× reflects the field's best 1 VU baseline (927), not a scaling problem.

## Latency: the p99 story

All 760 tests recorded full latency distributions (median/p90/p95/p99/max — in the [dataset](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)). The benchmark's latency objective was p99 < 1 s per test. Results:

- **657 of 760 tests met it.** The 103 that did not are *the same combinations for every service*: 100+ records at 50+ VU — where a 100-record, 23-column JSON response at 200 concurrent users is simply more bytes than 4 cores serialize in under a second at p99. Physics, not framework failures.
- Held per service: 11 of 16 perf-test combinations for eighteen services; **Bun and Swoole held 12** — the only two to keep p99 under 1 s at 50 VU × 500 records.
- At sane payloads the field is tight: on minimal at 100 VU, every service's p99 sits between 21 ms (Go) and 43 ms except Django and PostgREST.
- **Zero failed requests, anywhere.** 20-for-20 services survived every load level without a single 5xx or dropped connection — the `restart: unless-stopped` safety nets went unused.

## Resource efficiency

Peak/average memory and CPU, measured only during each service's active test windows:

| Service | Peak MB | Avg MB | Avg CPU |
|---|---:|---:|---:|
| Swoole PHP | 44 | 24 | 66% |
| Go | 59 | 25 | 90% |
| PostgREST | 112 | 57 | 103% |
| Axum | 145 | 25 | **49%** |
| NpgsqlRest AOT (best of 3) | 155 | 62 | 110% |
| Actix-web | 167 | 59 | **58%** |
| .NET 10 EF | 214 | 124 | 150% |
| NpgsqlRest JIT (best of 3) | 225 | 124 | 129% |
| .NET 10 Dapper | 244 | 102 | 128% |
| FastAPI | 282 | 237 | **200%** |
| Bun | 340 | 229 | 110% |
| Django | 671 | 281 | **230%** |
| Deno | 740 | 500 | 105% |
| Spring Boot | 756 | 404 | 98% |
| Express (8 workers) | 1,094 | 577 | 109% |
| Fastify (8 workers) | 1,177 | 600 | 92% |

The fairness overhaul's price tag is visible here: **equal cores cost the interpreted runtimes their memory story**. Eight Node processes cost Fastify and Express over a gigabyte at peak; FastAPI's crown came with the field's second-highest CPU burn. Meanwhile Swoole delivers 14 golds from 44 MB, and the Rust pair posts mid-table throughput at *half the CPU of anyone else* — the two most efficient architectures in the field by throughput-per-resource, one interpreted, one compiled.

Bun deserves a line: 340 MB for 8 processes versus Deno's 740 MB and Node's ~1,100 MB for the same work is the clearest runtime-efficiency signal in the JavaScript quartet.

## Performance per line of code

Lines of application code (or configuration, where no code exists) to implement the identical six endpoints, against headline throughput:

| Service | Lines | perf-test 100 VU/1 rec |
|---|---:|---:|
| PostgREST | **12** (config) | 1,322 |
| NpgsqlRest Routine | **21** (config) | 2,617 |
| Fastify / Express | 102 / 103 | 2,583 / 2,578 |
| .NET EF / FastAPI / Dapper | 105 / 123 / 129 | 2,230 / 5,109 / 2,255 |
| NpgsqlRest SQL Files | **140** (config + the SQL itself) | 3,467–3,524 |
| Bun / Deno | 140 / 143 | 3,016 / 3,047 |
| Spring Boot / Django / Swoole | 165 / 183 / 198 | 2,710 / 1,911 / 2,431 |
| Axum / Actix / Go | 248 / 256 / 303 | 2,263 / 2,246 / 2,948 |

The pattern from January holds and sharpens: **the top of the throughput chart and the bottom of the effort chart are the same neighborhood.** NpgsqlRest's 21-line configuration outruns Go's 303 hand-written lines on this scenario; its SQL-file variant — where the only "code" is the SQL you'd write anyway — sits #2 in the entire field. Go remains the honest counter-example: when you *do* pay the 303 lines, you buy categories nothing else wins.

## January → July: ranking movements

Absolute numbers are not comparable across rounds (see [methodology](/blog/benchmarks-2026-07/)); positions are:

| Service | January | July | Why |
|---|---|---|---|
| FastAPI | Bottom tier | **#1 perf-test** | workers 1 → 8 |
| Swoole | Large-payload champion | Mid-pack on large, still heavy-perf-test king | workers cpu×2 → cpu |
| NpgsqlRest | #1 perf-test (routine) | #2–3 (SQL files) | New source; FastAPI's fix outpaced it |
| Bun | "Single-threaded champion" | Pack member | Everyone got workers |
| PostgREST | Bottom tier | Bottom tier | Pool fix helped less than hoped |
| Go | Minimal/params/POST king | Unchanged | Never depended on configuration |

The honest summary: **about half of January's ranking signal was deployment configuration, not framework capability.** This round removed that variable. What remains — driver efficiency, serialization architecture, runtime memory models — is what these pages analyze.

## Limitations, stated plainly

- One run per combination; no variance bars. The 30-second quiet gaps, per-test warmups, and paused-idle isolation minimize drift, but a delta under ~3% between adjacent services should be read as a tie.
- 4 dedicated cores per service. Rankings could shift at 16+ cores, particularly for the JVM.
- Closed-loop load (k6 VUs) measures max throughput well but understates latency under a fixed arrival rate; an open-model scenario is on the wishlist for next round.
- The workload is deliberately database-shaped (function call in, JSON out). CPU-bound application logic would favor the compiled languages far more than these tables do.

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [NpgsqlRest Deep Dive](/blog/benchmarks-2026-07/npgsqlrest) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next:** [Raw Results →](/blog/benchmarks-2026-07/results)

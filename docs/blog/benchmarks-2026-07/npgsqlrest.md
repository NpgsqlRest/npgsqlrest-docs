---
layout: doc
outline: [2, 3]
title: "NpgsqlRest Deep Dive — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Six NpgsqlRest configurations benchmarked head to head: 3.4.7 vs 3.21.0, routine source vs the new SQL file source, AOT vs JIT. The SQL file source is up to 33% faster."
---

# NpgsqlRest Deep Dive: Six Configurations, Three Questions

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">NpgsqlRest</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

This round tested six NpgsqlRest configurations side by side — same database, same endpoints, same load — to answer three questions with data instead of intuition:

1. **Did eighteen releases of features cost any performance?** (3.4.7 vs 3.21.0)
2. **What does the new [SQL file source](https://npgsqlrest.github.io/guide/sql-files) cost — or save?** (routine vs file endpoints)
3. **Is the AOT build still the memory winner, and does JIT still hold a speed edge?**

## At a glance

| Variant | Version | Endpoint source | Build | Port |
|---|---|---|---|---|
| Routine AOT 3.4.7 | 3.4.7 | PostgreSQL functions | Native AOT | 5005 |
| Routine JIT 3.4.7 | 3.4.7 | PostgreSQL functions | CoreCLR JIT | 5006 |
| Routine AOT 3.21.0 | 3.21.0 | PostgreSQL functions | Native AOT | 5007 |
| Routine JIT 3.21.0 | 3.21.0 | PostgreSQL functions | CoreCLR JIT | 5008 |
| **SQL Files AOT 3.21.0** | 3.21.0 | **Raw `.sql` statements** | Native AOT | 5009 |
| **SQL Files JIT 3.21.0** | 3.21.0 | **Raw `.sql` statements** | CoreCLR JIT | 5010 |

All six run from configuration alone — [21 lines of appsettings.json](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/npgsqlrest-routine-jit-v3.21.0/appsettings.json) for the routine variants; the file variants add [six plain `.sql` files](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_sql_files) whose statements are kept identical to the function bodies. Before the run, we byte-compared responses between routine and file endpoints across every deterministic scenario: **identical**. Whatever performance difference appears below is machinery, not output.

**The verdict in one sentence: version upgrades were performance-neutral, AOT still halves memory — and the SQL file source turned out to be up to a third faster than calling functions.**

## Question 1: 3.4.7 → 3.21.0 — did features cost speed?

No. Across 38 combinations the routine-source variants of both versions are statistically inseparable:

| perf-test, 1 record | 3.4.7 JIT | 3.21.0 JIT | Δ |
|---|---:|---:|---:|
| 100 VU | 2,620 req/s | 2,617 req/s | −0.1% |
| Minimal baseline, 100 VU | 15,374 | 15,280 | −0.6% |
| Minimal baseline, 100 VU (AOT) | 15,327 | 15,549 | +1.4% |

Every delta between versions lands inside run-to-run noise. Eighteen minor releases — the SQL file source itself, the MCP server, the SQL test runner, watch mode, Dart client generation — added **zero measurable overhead** to the hot path. That is the finding: not faster, but feature growth without performance decay, which is rarer.

*(A methodological confession: our pre-run smoke tests on ARM/emulated hardware suggested 3.21.0 was 6–13% faster. Native x86 falsified that. Preliminary numbers on non-target hardware are noise — treat them accordingly.)*

## Question 2: Routine vs SQL files — the finding of the round

The SQL file source executes the statement directly; the routine source wraps it in a PostgreSQL function call. Same database work — the functions are `language sql` and inlinable — so we expected parity. Instead:

| perf-test, JIT 3.21.0 | Routine | SQL Files | Δ |
|---|---:|---:|---:|
| 50 VU, 1 record | 2,701 | 3,621 | **+34%** |
| 100 VU, 1 record | 2,617 | 3,467 | **+32%** |
| 200 VU, 1 record | 2,593 | 3,453 | **+33%** |
| 100 VU, 10 records | 1,438 | 1,457 | +1.3% |
| 100 VU, 100 records | 166 | 166 | 0% |
| 100 VU, 500 records | 35 | 35 | 0% |

And on the 20-parameter query-string scenario:

| params | Routine | SQL Files | Δ |
|---|---:|---:|---:|
| 50 VU | 11,435 | 14,437 | **+26%** |
| 200 VU | 12,254 | 12,692 | +3.6% |

The gradient tells the story. The advantage is enormous where requests are small and frequent (1 record: +33%), shrinks as payloads grow (10 records: +1%), and disappears entirely when response size dominates (100+ records: 0%). The gap also correlates with parameter count. This is the signature of **fixed per-request invocation overhead** in the routine path — command construction and parameter wrapping around the function call — being amortized away as each request carries more data. It is *not* PostgreSQL function-call overhead: these functions inline, and the 100-record parity proves the database does identical work in both paths.

**Practical implication:** for small-payload, high-frequency endpoints — exactly the profile of most CRUD and lookup APIs — the SQL file source is the fastest way to run NpgsqlRest, and it lifted these variants to **#2 and #3 in the entire 20-service field** on the headline perf-test scenario at 100–200 VU, behind only [FastAPI's](/blog/benchmarks-2026-07/fastapi) 8-worker pool.

**A question this opens for the next round:** with a consistent 30% gap established, a raw-query control in another stack (Dapper executing the statement directly instead of calling the function) would isolate how much of the routine path's cost is general to PostgreSQL clients versus specific to NpgsqlRest's routine machinery.

## Question 3: AOT vs JIT

Throughput: parity, with nuance at the extremes.

| Scenario | AOT (file, 3.21.0) | JIT (file, 3.21.0) |
|---|---:|---:|
| perf-test 1 VU, 1 rec | 658 req/s | **753 req/s** (+14%) |
| perf-test 200 VU, 1 rec | **3,481** | 3,453 |
| Minimal 100 VU | **15,776** | 15,556 |

JIT keeps a measurable single-connection edge (its tiered compilation optimizes the hottest path further than AOT's ahead-of-time code), while AOT matches or edges it under real concurrency. But the decisive difference is memory:

| Variant | Peak MB | Avg MB |
|---|---:|---:|
| Routine AOT 3.4.7 | 156 | 62 |
| SQL Files AOT 3.21.0 | 155 | 62 |
| Routine AOT 3.21.0 | 168 | 65 |
| Routine JIT 3.4.7 | 230 | 124 |
| SQL Files JIT 3.21.0 | 225 | 125 |
| Routine JIT 3.21.0 | 280 | 129 |

**AOT runs on half the memory of JIT** — 62 MB average versus ~125 MB — consistent across versions and endpoint sources. The January guidance stands, now with more data behind it: pick AOT for density, containers, and cold starts; pick JIT if single-connection latency is the last percent you need. Throughput will not decide this for you.

## Against the field

Context from the [overall analysis](/blog/benchmarks-2026-07/analysis), using the same-driver .NET baselines as the fairest comparison — NpgsqlRest and the [.NET Minimal API apps](/blog/benchmarks-2026-07/dotnet) all sit on Npgsql:

| perf-test, 100 VU, 1 record | req/s |
|---|---:|
| FastAPI (field leader) | 5,109 |
| **NpgsqlRest SQL Files AOT** | **3,524** (#2) |
| **NpgsqlRest SQL Files JIT** | **3,467** (#3) |
| NpgsqlRest Routine JIT | 2,617 |
| .NET 10 Minimal API + Dapper (hand-written) | 2,255 |
| .NET 10 Minimal API + EF Core (hand-written) | 2,230 |

The routine source — the *slower* NpgsqlRest path — outperforms hand-written Dapper endpoints on the same driver by 16%. The file source beats them by more than 50%. The zero-code approach is not a convenience trade-off here; it is faster than writing the code yourself, because the generic pipeline skips materialization work that per-endpoint code tends to accumulate.

On pure routing (minimal baseline) the field compresses: NpgsqlRest lands 15,280–15,776 req/s (#6–#12 in a pack where #3–#12 span 6%), behind [Go's](/blog/benchmarks-2026-07/go) 16,882. Nested, large-payload, and POST scenarios sit mid-pack — payload-dominated categories where most of the field converges anyway (see [Raw Results](/blog/benchmarks-2026-07/results)).

## The other zero-code platform: PostgREST head-to-head

NpgsqlRest and [PostgREST](/blog/benchmarks-2026-07/postgrest) are the only two services in this field where the API is *defined in the database* and the entire "application" is a configuration file — 12 lines for PostgREST, 21 for NpgsqlRest. That makes this the benchmark's only same-paradigm comparison, and it splits cleanly by workload type (NpgsqlRest = best variant per scenario, reference combos):

| Scenario | PostgREST | NpgsqlRest | Ratio |
|---|---:|---:|---:|
| Minimal baseline (100 VU) | 6,986 | 15,776 | **2.3×** |
| perf-test (100 VU, 1 rec) | 1,322 | 3,524 | **2.7×** |
| Many params (50 VU) | 3,726 | 14,437 | **3.9×** |
| Large payload (25 VU, 100 KB) | 729 | 1,368 | **1.9×** |
| POST body (50 VU, 10 rec) | 3,867 | 4,058 | 1.05× |
| Nested JSON (50 VU, d1) | 1,633 | 1,640 | 1.00× |
| Avg memory | **57 MB** | 62 MB (AOT) | ~parity |

The pattern is consistent with everything else in this series: where the response payload dominates (nested, POST with echo), the two are indistinguishable — both delegate JSON construction to PostgreSQL and ship bytes. Where the *server* dominates — routing, query-string parsing, small rapid responses — NpgsqlRest is 2–4× ahead, with the params scenario (20 typed parameters per request) showing the widest gap in the entire comparison.

Memory is honest parity: PostgREST's Haskell runtime averages 57 MB, NpgsqlRest AOT 62 MB. Both are in the field's most frugal tier.

The fair conclusion: the database-first paradigm is not intrinsically slow — one implementation of it sits at #2 in the field-wide headline ranking while the other sits at #20. Paradigm sets the floor of effort; implementation sets the ceiling of performance.

## Cost of ownership

From the [lines-of-code comparison](/blog/benchmarks-2026-07/analysis#performance-per-line-of-code): the routine variants need **21 lines of configuration** and zero application code. The SQL file variants add the six `.sql` files — statements you would have written anyway — for a total of 140 physical lines. The hand-written alternatives implementing the same six endpoints range from 102 (Fastify) to 303 (Go).

## Verdict

- **Upgrade freely**: 3.21.0 carries eighteen releases of features at zero hot-path cost.
- **Prefer the SQL file source** for small-payload, high-frequency endpoints: up to +33% throughput, #2 in the field, and the source format (a plain SQL file) is the simplest one yet.
- **AOT for memory** (62 MB average — half of JIT), **JIT for single-connection latency**. Throughput is a tie.
- The zero-code pipeline outran same-driver hand-written .NET endpoints in every configuration tested.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Routine-source configuration](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/npgsqlrest-routine-jit-v3.21.0)
- [SQL-file-source configuration](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/npgsqlrest-file-jit-v3.21.0)
- [The raw SQL endpoint files](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_sql_files)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next:** [Overall Analysis →](/blog/benchmarks-2026-07/analysis)

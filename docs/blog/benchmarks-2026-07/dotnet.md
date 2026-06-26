---
layout: doc
outline: [2, 3]
title: ".NET 10 Minimal API: EF Core vs Dapper — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: ".NET 10 Minimal API with EF Core vs Dapper in the July 2026 PostgreSQL REST API benchmark: the ORM tax is 1.1% on real workloads — and 16.5% on the trivial baseline."
---

# .NET 10 Minimal API — EF Core vs Dapper

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">.NET</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | EF Core | Dapper |
|---|---|---|
| **Version** | .NET 10 Minimal API (JIT), EF Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3) | .NET 10 Minimal API (JIT), Dapper 2.1.79 + Npgsql 10.0.3 |
| **PostgreSQL driver** | Npgsql via the EF provider | `NpgsqlDataSource` directly (pool max 100) |
| **Concurrency model** | Kestrel, async — all cores | Kestrel, async — all cores |
| **Lines of code** | 105 | 129 |
| **Podiums** | none — of 38 combinations | none — of 38 combinations |
| **Source** | [net10-minapi-ef-jit](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/net10-minapi-ef-jit) | [net10-minapi-dapper-jit](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/net10-minapi-dapper-jit) |

**The verdict in one sentence: on workloads where the database does real work, the "EF is slow" claim measures at 1.1% — it only becomes visible when the database does almost nothing.**

## Implementation

Two deliberately identical Minimal API apps, differing only in the data-access line. EF Core runs raw SQL through `SqlQuery<T>` with an interpolated string that EF converts into a parameterized query ([Program.cs](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/net10-minapi-ef-jit/Program.cs)):

```csharp
// EF Core — DbContext per request, FormattableString → parameters
app.MapGet("/api/perf-test", (DbContext dbContext, /* 16 query params */) =>
    dbContext.Database.SqlQuery<Result>($"""
        SELECT row_num, text_val, ... , nullable_int
        FROM public.perf_test({_records}, {_text}, ... {_jsonb}::jsonb, ...)
        """));
```

```csharp
// Dapper — singleton NpgsqlDataSource, named parameters
app.MapGet("/api/perf-test", async (NpgsqlDataSource dataSource, /* 16 query params */) =>
{
    await using var connection = await dataSource.OpenConnectionAsync();
    return await connection.QueryAsync<Result>(
        "SELECT ... FROM public.perf_test(@_records, @_text, ... @_jsonb::jsonb, ...)",
        new { _records, _text, /* ... */ });
});
```

Both are fully parameterized, both use the same `RawJsonConverter` to pass `json`/`jsonb` through untouched, and both sit on the same Npgsql 10.0.3 wire protocol. The variable under test is the layer in between. (EF is, ironically, the shorter app: 105 lines vs 129.)

## Results

### Where the gap vanishes

On the comprehensive serialization scenario (perf-test) the two are statistically interchangeable — and at the lightest load EF is actually ahead:

| perf-test, 1 record | 1 VU | 50 VU | 100 VU | 200 VU |
|---|---:|---:|---:|---:|
| EF Core | **620 (#14)** | 2,296 (#17) | 2,230 (#18) | 2,217 (#18) |
| Dapper | 582 (#18) | 2,283 (#18) | **2,255 (#16)** | 2,237 (#16) |

The headline delta at 100 VU/1 record is **+1.1% for Dapper** (2,230 → 2,255). At 1 VU it flips: EF leads by 6.5%. On heavier rows they trade fractions — at 100 VU EF posts 1,431 vs 1,422 (10 records) and 167 vs 164 req/s (100 records). Anyone claiming an ORM tax on function-call workloads in .NET 10 will not find it in this table.

### Where the gap is real

Strip the workload down to a trivial function call and a measurable gap appears:

| Minimal baseline | 100 VU | 200 VU | 500 VU |
|---|---:|---:|---:|
| EF Core | 13,203 (#14) | 12,747 (#15) | 12,187 (#16) |
| Dapper | **15,378 (#9)** | **14,043 (#10)** | **12,695 (#11)** |
| Dapper advantage | +16.5% | +10.2% | +4.2% |

Many-parameters shows the same shape: Dapper 12,161 (#9) vs EF 11,210 (#14) at 50 VU, +8.5%. Our working hypothesis — stated as hypothesis, not measurement — is per-request DbContext overhead: EF resolves a scoped `DbContext` and its infrastructure on every request, a fixed cost that is invisible behind a 23-column serialization query but is a meaningful slice of a request that does almost no database work. Consistent with that, the gap shrinks (16.5% → 4.2%) as concurrency rises and both apps increasingly wait on the same connection pool instead of their own machinery.

### Latency

Identical at the front: p99 of 3 ms for both at 1 VU/1 record. On the minimal baseline at 100 VU, Dapper's p99 is 23 ms to EF's 26 ms — the same 3-ms courtesy gap as the throughput story. Both held the sub-1s p99 SLO in 11 of 16 perf-test combinations, the field-standard result, and both recorded zero failed requests across all 38 combinations.

## Resource usage

| | Peak memory | Avg memory | Avg CPU |
|---|---:|---:|---:|
| EF Core | 214 MB | 124 MB | 150% |
| Dapper | 244 MB | 102 MB | 128% |

A mild surprise: Dapper peaks *higher* (244 vs 214 MB) while averaging lower (102 vs 124 MB) — EF's context pooling smooths allocation at the cost of a higher steady state. Both sit comfortably mid-field: heavier than the Rust pair and Go, a fraction of the Node clusters, and EF's 150% average CPU is the higher of the two — the extra machinery shows up on the meter even where it doesn't show up in req/s.

## Analysis

This page is one experiment with two readings. Reading one: **for APIs that call PostgreSQL functions and return real payloads, EF Core costs nothing measurable over Dapper** — 1.1% at the headline combo, inverted at single-request load. Reading two: the classic "EF is slow" folklore isn't fabricated; it's a description of the wrong denominator. When the request does trivial work, fixed per-request overhead is the workload, and there Dapper's leaner path is worth 10–16%. Both readings are true; which one applies to you depends on whether your endpoints look like `perf-minimal` or like anything real.

These two apps are also the natural baseline for [NpgsqlRest](/blog/benchmarks-2026-07/npgsqlrest), which runs the same Npgsql driver under Kestrel: on the minimal baseline at 100 VU, NpgsqlRest routine JIT (15,280 req/s) lands within 0.7% of hand-written Dapper — a useful calibration for what the automatic approach gives up, which is roughly nothing.

**January → July movement:** rankings only — absolute numbers are not comparable across the methodology overhaul. The .NET 9 EF service was retired this round, leaving the two .NET 10 apps. The ordering survived: on the minimal baseline Dapper was #4 of 14 in January and is #9 of 20 now, EF #8 of 14 then and #14 of 20 now — both displaced by the cluster-equalized Node/Bun/Deno group, with Dapper ahead of EF on the trivial workload in both rounds. One thing did change: in January Dapper also led the .NET 10 EF app at nearly every perf-test combination; this round they are statistically inseparable there.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [EF Core application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/net10-minapi-ef-jit)
- [Dapper application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/net10-minapi-dapper-jit)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [PostgREST →](/blog/benchmarks-2026-07/postgrest)

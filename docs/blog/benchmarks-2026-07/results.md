---
layout: doc
outline: [2, 3]
title: "Raw Results — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Complete result tables for the July 2026 PostgreSQL REST API benchmark: throughput matrices, scaling, latency distribution, resource usage, and lines of code for all 20 services."
---

# Raw Results

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Raw Data</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

Every table below is generated directly from the run dataset by
[generate-report.py](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/generate-report.py).
For deeper digging:

- [results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv) — one row per test: throughput, latency percentiles (avg/med/p90/p95/p99/max), bytes transferred, failures
- [results.json](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.json) — the same, with run metadata
- [Per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — 760 individual text reports
- [Detailed per-combination tables](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327_all.md) — every scenario × VU × payload combination, sorted by throughput
- [test_log.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/test_log.csv) — start/end timestamps and exit code for all 760 tests

**Run:** 2026-07-13, Hetzner CCX33 (8 dedicated vCPU, 32 GB), server profile — 10s warmup + 10s ramp + 60s hold per test, 30s quiet gaps, idle services paused. All throughput values are requests/s. The language/runtime of each service is marked in small print next to its name. 🥇🥈🥉 mark the top three per column.

## Data Type Serialization (perf-test)

### Throughput matrix

Requests/s by concurrency, one table per record count (sorted by the 100 VU column).

#### 1 record

| Framework | 1 VU | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|---:|
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 🥈 854 | 🥇 5,048 | 🥇 5,109 | 🥇 5,053 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 658 | 🥉 3,568 | 🥈 3,524 | 🥈 3,481 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 753 | 🥈 3,621 | 🥉 3,467 | 🥉 3,453 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 676 | 3,065 | 3,047 | 3,120 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 738 | 3,068 | 3,016 | 3,140 |
| Go 1.26 <sub><small>Go</small></sub> | 🥇 927 | 3,049 | 2,948 | 2,943 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 🥉 773 | 2,772 | 2,710 | 2,704 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 626 | 2,704 | 2,620 | 2,604 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 595 | 2,682 | 2,618 | 2,620 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 670 | 2,701 | 2,617 | 2,593 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 608 | 2,700 | 2,615 | 2,623 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 752 | 2,644 | 2,583 | 2,582 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 611 | 2,642 | 2,578 | 2,552 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 765 | 2,432 | 2,431 | 2,436 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 718 | 2,364 | 2,263 | 2,221 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 582 | 2,283 | 2,255 | 2,237 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 720 | 2,352 | 2,246 | 2,241 |
| .NET 10 EF <sub><small>C#</small></sub> | 620 | 2,296 | 2,230 | 2,217 |
| Django 6.0.7 <sub><small>Python</small></sub> | 358 | 2,005 | 1,911 | 1,887 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 427 | 1,363 | 1,322 | 1,237 |

#### 10 records

| Framework | 1 VU | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|---:|
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥈 433 | 🥇 1,834 | 🥇 1,801 | 🥇 1,764 |
| Go 1.26 <sub><small>Go</small></sub> | 🥇 458 | 🥈 1,621 | 🥈 1,583 | 🥈 1,549 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 270 | 🥉 1,576 | 🥉 1,535 | 🥉 1,533 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 411 | 1,474 | 1,457 | 1,429 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 🥉 425 | 1,466 | 1,457 | 1,408 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 389 | 1,478 | 1,456 | 1,417 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 367 | 1,493 | 1,454 | 1,430 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 348 | 1,481 | 1,451 | 1,431 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 409 | 1,489 | 1,446 | 1,416 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 314 | 1,481 | 1,439 | 1,422 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 340 | 1,462 | 1,438 | 1,414 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 332 | 1,473 | 1,434 | 1,411 |
| .NET 10 EF <sub><small>C#</small></sub> | 323 | 1,468 | 1,431 | 1,406 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 372 | 1,450 | 1,429 | 1,378 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 298 | 1,464 | 1,422 | 1,415 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 376 | 1,464 | 1,420 | 1,391 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 344 | 1,440 | 1,419 | 1,385 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 331 | 1,446 | 1,419 | 1,384 |
| Django 6.0.7 <sub><small>Python</small></sub> | 225 | 1,437 | 1,414 | 1,406 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 232 | 1,109 | 1,077 | 1,053 |

#### 100 records

| Framework | 1 VU | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|---:|
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥇 111 | 🥇 215 | 🥇 212 | 🥇 212 |
| Go 1.26 <sub><small>Go</small></sub> | 🥉 98.80 | 🥈 187 | 🥈 184 | 🥈 184 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 63.87 | 🥉 182 | 🥉 181 | 🥉 182 |
| Django 6.0.7 <sub><small>Python</small></sub> | 62.96 | 174 | 173 | 171 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 95.82 | 169 | 169 | 167 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 74.48 | 169 | 168 | 168 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 91.86 | 170 | 168 | 168 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 98.08 | 169 | 167 | 167 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 90.92 | 168 | 167 | 167 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 85.59 | 168 | 167 | 166 |
| .NET 10 EF <sub><small>C#</small></sub> | 91.06 | 169 | 167 | 166 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 93.82 | 168 | 167 | 165 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 🥈 107 | 169 | 166 | 167 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 98.08 | 167 | 166 | 166 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 92.40 | 169 | 166 | 167 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 88.03 | 164 | 165 | 164 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 89.35 | 169 | 164 | 166 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 88.29 | 164 | 163 | 164 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 82.46 | 165 | 163 | 163 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 83.14 | 165 | 162 | 161 |

#### 500 records

| Framework | 1 VU | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|---:|
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥇 24.40 | 🥇 45.45 | 🥇 44.99 | 🥇 44.89 |
| Go 1.26 <sub><small>Go</small></sub> | 21.56 | 🥈 39.20 | 🥈 38.87 | 🥈 38.66 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 12.16 | 🥉 38.62 | 🥉 38.32 | 🥉 37.96 |
| Django 6.0.7 <sub><small>Python</small></sub> | 14.45 | 36.63 | 36.03 | 35.95 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 20.50 | 35.40 | 35.32 | 34.94 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 17.30 | 35.20 | 35.31 | 35.05 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 20.40 | 35.46 | 35.08 | 34.87 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 🥈 21.71 | 34.96 | 35.00 | 34.79 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 21.61 | 35.19 | 34.99 | 34.40 |
| .NET 10 EF <sub><small>C#</small></sub> | 21.09 | 35.03 | 34.96 | 34.74 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 18.31 | 35.03 | 34.93 | 34.52 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 🥉 21.69 | 35.00 | 34.92 | 34.72 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 21.55 | 34.87 | 34.75 | 34.72 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 19.12 | 34.09 | 34.33 | 34.20 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 19.64 | 34.48 | 34.32 | 34.12 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 18.76 | 34.57 | 34.19 | 34.01 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 20.28 | 35.13 | 34.17 | 34.39 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 18.40 | 34.48 | 34.05 | 33.84 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 21.67 | 35.34 | 34.00 | 34.47 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 21.63 | 35.12 | 33.37 | 34.76 |

### Scaling behavior

Scaling at 1 record(s): requests/s per VU level.

| Framework | 1 VU | 50 VU | 100 VU | 200 VU | Scaling |
|-----------|---:|---:|---:|---:|---:|
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 854 | 5,048 | 5,109 | 5,053 | 🥇 **6.0x** |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 658 | 3,568 | 3,524 | 3,481 | 🥉 **5.4x** |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 753 | 3,621 | 3,467 | 3,453 | **4.8x** |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 738 | 3,068 | 3,016 | 3,140 | **4.3x** |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 676 | 3,065 | 3,047 | 3,120 | **4.6x** |
| Go 1.26 <sub><small>Go</small></sub> | 927 | 3,049 | 2,948 | 2,943 | **3.3x** |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 773 | 2,772 | 2,710 | 2,704 | **3.6x** |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 608 | 2,700 | 2,615 | 2,623 | **4.4x** |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 595 | 2,682 | 2,618 | 2,620 | **4.5x** |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 626 | 2,704 | 2,620 | 2,604 | **4.3x** |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 670 | 2,701 | 2,617 | 2,593 | **4.0x** |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 752 | 2,644 | 2,583 | 2,582 | **3.5x** |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 611 | 2,642 | 2,578 | 2,552 | **4.3x** |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 765 | 2,432 | 2,431 | 2,436 | **3.2x** |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 720 | 2,352 | 2,246 | 2,241 | **3.3x** |
| .NET 10 Dapper <sub><small>C#</small></sub> | 582 | 2,283 | 2,255 | 2,237 | **3.9x** |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 718 | 2,364 | 2,263 | 2,221 | **3.3x** |
| .NET 10 EF <sub><small>C#</small></sub> | 620 | 2,296 | 2,230 | 2,217 | **3.7x** |
| Django 6.0.7 <sub><small>Python</small></sub> | 358 | 2,005 | 1,911 | 1,887 | 🥈 **5.6x** |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 427 | 1,363 | 1,322 | 1,237 | **3.2x** |

### Latency under heaviest load

Latency distribution at 200vu/500rec (ms).

| Framework | avg | med | p90 | p95 | p99 | max |
|-----------|----:|----:|----:|----:|----:|----:|
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥇 1,578.4 | 🥇 1,453.9 | 🥇 2,752.2 | 🥇 3,078.8 | 🥇 3,704.8 | 🥇 5,223.5 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 2,058.1 | 🥈 1,490.1 | 4,720.7 | 5,440.8 | 6,528.4 | 8,992.7 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 2,054.9 | 🥉 1,495.2 | 4,614.3 | 5,508.8 | 6,944.2 | 9,811.8 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 🥉 1,693.3 | 1,512.1 | 3,150.8 | 3,562.1 | 4,595.6 | 7,356.9 |
| Go 1.26 <sub><small>Go</small></sub> | 🥈 1,664.7 | 1,518.6 | 🥈 2,929.4 | 🥈 3,279.3 | 🥈 3,931.0 | 8,316.9 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 1,725.8 | 1,569.0 | 3,059.2 | 3,415.1 | 4,448.7 | 6,555.3 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 1,767.2 | 1,580.0 | 3,220.7 | 3,564.0 | 4,650.3 | 7,351.0 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 1,748.6 | 1,585.0 | 3,031.4 | 3,413.1 | 4,238.1 | 5,849.9 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 2,163.4 | 1,591.9 | 4,566.0 | 5,214.5 | 6,383.1 | 8,304.7 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 1,761.4 | 1,596.3 | 3,147.1 | 3,550.4 | 4,390.2 | 6,879.8 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 1,758.5 | 1,606.9 | 3,088.0 | 3,432.1 | 4,265.8 | 7,646.2 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 1,724.9 | 1,608.5 | 3,003.2 | 🥉 3,344.0 | 4,246.6 | 5,922.0 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 1,757.1 | 1,610.8 | 3,059.7 | 3,481.3 | 4,383.5 | 🥈 5,555.5 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 1,750.1 | 1,610.9 | 🥉 2,959.7 | 3,409.2 | 4,215.5 | 5,960.8 |
| .NET 10 EF <sub><small>C#</small></sub> | 1,749.6 | 1,619.9 | 3,039.0 | 3,466.4 | 4,313.6 | 6,088.2 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 1,753.6 | 1,620.5 | 3,063.9 | 3,405.5 | 🥉 3,989.6 | 6,747.2 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 1,779.9 | 1,628.3 | 3,069.0 | 3,508.6 | 4,219.7 | 🥉 5,677.2 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 1,822.0 | 1,634.6 | 3,180.6 | 3,556.7 | 5,184.5 | 9,820.9 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 1,781.7 | 1,637.2 | 3,144.6 | 3,420.0 | 4,156.1 | 5,753.0 |
| Django 6.0.7 <sub><small>Python</small></sub> | 2,057.7 | 1,767.6 | 3,702.4 | 4,173.9 | 5,167.1 | 6,223.4 |

## Cross-Scenario Summary

| Framework | Minimal | Post | Nested | Large | Params |
|-----------|---:|---:|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 16,882 | 🥇 7,598 | 🥇 2,106 | 🥇 1,427 | 🥇 15,449 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥈 16,436 | 🥉 7,238 | 1,655 | 🥈 1,418 | 🥉 14,797 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 🥉 16,243 | 4,111 | 1,676 | 1,389 | 12,494 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 16,140 | 4,097 | 1,649 | 1,390 | 12,418 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 16,106 | 🥈 7,461 | 1,657 | 1,408 | 🥈 15,156 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 15,776 | 4,058 | 1,640 | 1,365 | 14,437 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 15,556 | 4,050 | 1,636 | 1,368 | 14,169 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 15,549 | 4,041 | 1,640 | 1,359 | 11,435 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 15,378 | 4,018 | 1,649 | 1,363 | 12,161 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 15,374 | 4,042 | 1,646 | 1,360 | 11,497 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 15,327 | 4,077 | 1,646 | 1,359 | 11,389 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 15,280 | 4,066 | 1,637 | 1,364 | 11,563 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 14,803 | 4,015 | 1,661 | 1,362 | 13,802 |
| .NET 10 EF <sub><small>C#</small></sub> | 13,203 | 3,938 | 1,642 | 1,358 | 11,210 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 12,669 | 4,099 | 1,666 | 1,289 | 9,591 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 12,644 | 4,079 | 1,663 | 1,289 | 9,768 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 11,610 | 6,713 | 🥉 2,030 | 🥉 1,416 | 5,996 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 10,794 | 7,200 | 🥈 2,092 | 1,287 | 8,447 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 6,986 | 3,867 | 1,633 | 729 | 3,726 |
| Django 6.0.7 <sub><small>Python</small></sub> | 2,601 | 2,492 | 1,963 | 1,338 | 2,411 |

Reference combos: Minimal = 100vu, Post = 50vu/10rec, Nested = 50vu/100rec/d1, Large = 25vu/100kb, Params = 50vu.

## Minimal Baseline (minimal)

| Framework | 100vu | 200vu | 500vu |
|-----------|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 16,882 | 🥇 15,736 | 🥇 13,613 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥈 16,436 | 🥉 15,140 | 🥈 13,487 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 16,106 | 14,777 | 🥉 13,483 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 16,140 | 15,001 | 13,235 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 🥉 16,243 | 🥈 15,214 | 13,180 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 15,776 | 14,339 | 13,032 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 15,280 | 13,965 | 12,856 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 14,803 | 13,952 | 12,853 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 15,556 | 14,170 | 12,787 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 15,549 | 14,080 | 12,783 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 15,378 | 14,043 | 12,695 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 15,327 | 14,045 | 12,692 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 15,374 | 14,020 | 12,683 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 12,669 | 12,666 | 12,607 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 12,644 | 12,749 | 12,574 |
| .NET 10 EF <sub><small>C#</small></sub> | 13,203 | 12,747 | 12,187 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 11,610 | 11,534 | 10,941 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 10,794 | 10,778 | 10,706 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 6,986 | 6,811 | 6,450 |
| Django 6.0.7 <sub><small>Python</small></sub> | 2,601 | 2,481 | 2,331 |

## POST Body Parsing (post)

#### 10 records

| Framework | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 7,598 | 🥇 7,198 | 🥇 6,595 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 7,200 | 🥈 6,992 | 🥈 6,533 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 🥈 7,461 | 🥉 6,897 | 6,469 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥉 7,238 | 6,890 | 🥉 6,512 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 6,713 | 6,071 | 6,225 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 4,097 | 3,852 | 3,632 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 4,079 | 3,842 | 3,678 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 4,111 | 3,839 | 3,664 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 4,099 | 3,836 | 3,661 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 4,041 | 3,831 | 3,612 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 4,077 | 3,827 | 3,655 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 4,066 | 3,827 | 3,638 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 4,042 | 3,822 | 3,652 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 4,018 | 3,810 | 3,660 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 4,050 | 3,797 | 3,650 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 4,058 | 3,793 | 3,669 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 4,015 | 3,788 | 3,640 |
| .NET 10 EF <sub><small>C#</small></sub> | 3,938 | 3,760 | 3,614 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 3,867 | 3,654 | 3,469 |
| Django 6.0.7 <sub><small>Python</small></sub> | 2,492 | 2,298 | 2,250 |

#### 100 records

| Framework | 50 VU | 100 VU | 200 VU |
|-----------|---:|---:|---:|
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥇 1,347 | 🥇 1,315 | 1,252 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 🥉 1,342 | 🥈 1,308 | 🥇 1,286 |
| Go 1.26 <sub><small>Go</small></sub> | 1,338 | 🥉 1,301 | 🥉 1,270 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥈 1,343 | 1,290 | 🥈 1,273 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 1,302 | 1,279 | 1,244 |
| Django 6.0.7 <sub><small>Python</small></sub> | 1,284 | 1,268 | 1,223 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 548 | 537 | 521 |
| .NET 10 EF <sub><small>C#</small></sub> | 542 | 535 | 517 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 548 | 535 | 527 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 542 | 535 | 522 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 543 | 534 | 525 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 547 | 534 | 523 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 545 | 533 | 517 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 546 | 533 | 523 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 546 | 533 | 514 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 546 | 533 | 522 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 545 | 533 | 515 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 544 | 532 | 526 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 545 | 532 | 520 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 544 | 525 | 522 |


## Nested JSON (nested)

#### 50 VU (100 records)

| Framework | depth 1 | depth 2 | depth 3 |
|-----------|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 2,106 | 🥈 1,991 | 🥇 1,971 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥈 2,092 | 🥇 1,997 | 🥈 1,960 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 🥉 2,030 | 🥉 1,945 | 🥉 1,904 |
| Django 6.0.7 <sub><small>Python</small></sub> | 1,963 | 1,900 | 1,869 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 1,676 | 1,334 | 1,142 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 1,666 | 1,345 | 1,136 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 1,663 | 1,344 | 1,140 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 1,661 | 1,331 | 1,131 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 1,657 | 1,327 | 1,127 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 1,655 | 1,327 | 1,125 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 1,649 | 1,335 | 1,126 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 1,649 | 1,337 | 1,138 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 1,646 | 1,339 | 1,133 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 1,646 | 1,335 | 1,132 |
| .NET 10 EF <sub><small>C#</small></sub> | 1,642 | 1,333 | 1,127 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 1,640 | 1,333 | 1,132 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 1,640 | 1,337 | 1,139 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 1,637 | 1,334 | 1,138 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 1,636 | 1,332 | 1,135 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 1,633 | 1,310 | 1,125 |

#### 100 VU (100 records)

| Framework | depth 1 | depth 2 | depth 3 |
|-----------|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 2,005 | 🥈 1,930 | 🥈 1,884 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥈 1,992 | 🥇 1,949 | 🥇 1,894 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 🥉 1,950 | 🥉 1,884 | 🥉 1,847 |
| Django 6.0.7 <sub><small>Python</small></sub> | 1,879 | 1,848 | 1,800 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 1,606 | 1,317 | 1,096 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 1,601 | 1,306 | 1,089 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 1,600 | 1,300 | 1,092 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 1,600 | 1,305 | 1,090 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 1,594 | 1,299 | 1,087 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 1,590 | 1,302 | 1,096 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 1,589 | 1,300 | 1,084 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 1,587 | 1,299 | 1,091 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 1,584 | 1,301 | 1,087 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 1,584 | 1,296 | 1,092 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 1,581 | 1,299 | 1,095 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 1,579 | 1,298 | 1,092 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 1,578 | 1,289 | 1,081 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 1,575 | 1,300 | 1,091 |
| .NET 10 EF <sub><small>C#</small></sub> | 1,568 | 1,287 | 1,091 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 1,567 | 1,287 | 1,085 |


## Large Payload (large)

| Framework | 25vu/100kb | 25vu/500kb | 50vu/100kb | 50vu/500kb |
|-----------|---:|---:|---:|---:|
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 🥉 1,416 | 🥈 334 | 🥈 1,402 | 🥇 342 |
| Go 1.26 <sub><small>Go</small></sub> | 🥇 1,427 | 🥇 335 | 🥇 1,415 | 🥈 341 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 1,408 | 🥉 334 | 🥉 1,399 | 🥉 340 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥈 1,418 | 331 | 1,389 | 338 |
| Django 6.0.7 <sub><small>Python</small></sub> | 1,338 | 322 | 1,329 | 327 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 1,368 | 317 | 1,368 | 323 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 1,362 | 317 | 1,354 | 322 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 1,363 | 317 | 1,367 | 321 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 1,289 | 316 | 1,300 | 321 |
| .NET 10 EF <sub><small>C#</small></sub> | 1,358 | 304 | 1,358 | 321 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 1,365 | 316 | 1,362 | 321 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 1,289 | 315 | 1,303 | 320 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 1,390 | 316 | 1,380 | 319 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 1,287 | 316 | 1,298 | 318 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 1,389 | 315 | 1,382 | 317 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 1,359 | 310 | 1,358 | 316 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 1,364 | 312 | 1,365 | 316 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 1,360 | 313 | 1,361 | 316 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 1,359 | 310 | 1,364 | 315 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 729 | 164 | 727 | 170 |

## Many Parameters (params)

| Framework | 50vu | 100vu | 200vu |
|-----------|---:|---:|---:|
| Go 1.26 <sub><small>Go</small></sub> | 🥇 15,449 | 🥇 14,975 | 🥇 13,866 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 🥈 15,156 | 🥈 14,453 | 🥈 13,118 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 🥉 14,797 | 🥉 14,010 | 🥉 13,086 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 14,437 | 13,574 | 12,692 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 14,169 | 13,686 | 12,603 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 11,563 | 13,133 | 12,456 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 11,389 | 13,051 | 12,445 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 11,497 | 13,067 | 12,374 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 13,802 | 13,374 | 12,357 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 11,435 | 13,008 | 12,254 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 12,494 | 11,753 | 11,773 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 12,418 | 11,581 | 11,656 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 12,161 | 11,118 | 11,067 |
| .NET 10 EF <sub><small>C#</small></sub> | 11,210 | 10,403 | 10,471 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 9,768 | 9,731 | 9,783 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 9,591 | 9,462 | 9,735 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 8,447 | 8,501 | 8,565 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 5,996 | 6,157 | 6,119 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 3,726 | 3,675 | 3,649 |
| Django 6.0.7 <sub><small>Python</small></sub> | 2,411 | 2,296 | 2,188 |

## Resource Usage (during test windows only)

| Service | Peak Memory (MB) | Avg Memory (MB) | Avg CPU (%) |
|---------|----------------:|----------------:|------------:|
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 🥇 44.3 | 🥇 23.6 | 🥉 65.59 |
| Go 1.26 <sub><small>Go</small></sub> | 🥈 58.8 | 🥉 25.1 | 90.16 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 🥉 112.0 | 56.6 | 102.98 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 144.7 | 🥈 24.9 | 🥇 48.84 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 154.8 | 62.4 | 113.54 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 155.6 | 61.8 | 106.88 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 167.4 | 58.9 | 🥈 57.85 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 168.1 | 65.2 | 110.39 |
| .NET 10 EF <sub><small>C#</small></sub> | 214.1 | 123.7 | 150.25 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 225.0 | 124.9 | 133.58 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 230.2 | 124.2 | 125.93 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 243.5 | 102.2 | 127.99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 280.5 | 128.7 | 128.98 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 282.4 | 236.8 | 200.43 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 340.0 | 228.6 | 109.63 |
| Django 6.0.7 <sub><small>Python</small></sub> | 671.2 | 281.0 | 229.61 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 740.1 | 500.5 | 104.84 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 756.1 | 404.4 | 97.57 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 1,093.6 | 576.7 | 108.88 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 1,176.6 | 600.1 | 91.68 |

## Test Completion

| Service | Script | Exit code |
|---------|--------|----------:|
| Django 6.0.7 <sub><small>Python</small></sub> | script.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | script.js | 99 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | script.js | 99 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | script.js | 99 |
| Go 1.26 <sub><small>Go</small></sub> | script.js | 99 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | script.js | 99 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | script.js | 99 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | script.js | 99 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | script.js | 99 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | script.js | 99 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | script.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | script.js | 99 |
| .NET 10 EF <sub><small>C#</small></sub> | script.js | 99 |
| .NET 10 Dapper <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | script.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | script.js | 99 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | script.js | 99 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | script.js | 99 |
| Go 1.26 <sub><small>Go</small></sub> | script.js | 99 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | script.js | 99 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | script.js | 99 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | script.js | 99 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | script.js | 99 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | script.js | 99 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | script.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | script.js | 99 |
| .NET 10 EF <sub><small>C#</small></sub> | script.js | 99 |
| .NET 10 Dapper <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | script.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | script.js | 99 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | script.js | 99 |
| Go 1.26 <sub><small>Go</small></sub> | script.js | 99 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | script.js | 99 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | script.js | 99 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | script.js | 99 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | script.js | 99 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | script.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | script.js | 99 |
| .NET 10 EF <sub><small>C#</small></sub> | script.js | 99 |
| .NET 10 Dapper <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | script.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | script.js | 99 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | script.js | 99 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | script.js | 99 |
| Go 1.26 <sub><small>Go</small></sub> | script.js | 99 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | script.js | 99 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | script.js | 99 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | script.js | 99 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | script.js | 99 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | script.js | 99 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | script.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | script.js | 99 |
| .NET 10 EF <sub><small>C#</small></sub> | script.js | 99 |
| .NET 10 Dapper <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | script.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | script.js | 99 |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | script.js | 99 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | script.js | 99 |
| Go 1.26 <sub><small>Go</small></sub> | script.js | 99 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | script.js | 99 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | script.js | 99 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | script.js | 99 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | script.js | 99 |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | script.js | 99 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | script.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | script.js | 99 |
| .NET 10 EF <sub><small>C#</small></sub> | script.js | 99 |
| .NET 10 Dapper <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | script.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | scenarios/minimal-baseline.js | 99 |
| Django 6.0.7 <sub><small>Python</small></sub> | scenarios/minimal-baseline.js | 99 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | scenarios/minimal-baseline.js | 99 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | scenarios/minimal-baseline.js | 99 |
| PostgREST 14.14 <sub><small>Haskell</small></sub> | scenarios/minimal-baseline.js | 99 |

## Lines of Code

| Framework | Lines of Code |
|-----------|--------------:|
| PostgREST 14.14 <sub><small>Haskell</small></sub> | 12 (config only) |
| NpgsqlRest Routine AOT 3.21.0 <sub><small>C#</small></sub> | 21 (config only) |
| NpgsqlRest Routine AOT 3.4.7 <sub><small>C#</small></sub> | 21 (config only) |
| NpgsqlRest Routine JIT 3.21.0 <sub><small>C#</small></sub> | 21 (config only) |
| NpgsqlRest Routine JIT 3.4.7 <sub><small>C#</small></sub> | 21 (config only) |
| Fastify 5.10.0 <sub><small>Node.js</small></sub> | 102 |
| Express 5.2.1 <sub><small>Node.js</small></sub> | 103 |
| .NET 10 EF <sub><small>C#</small></sub> | 105 |
| FastAPI 0.139.0 <sub><small>Python</small></sub> | 123 |
| .NET 10 Dapper <sub><small>C#</small></sub> | 129 |
| Bun 1.3.14 <sub><small>Bun/TS</small></sub> | 140 |
| NpgsqlRest SQL Files AOT 3.21.0 <sub><small>C#</small></sub> | 140 (config only) |
| NpgsqlRest SQL Files JIT 3.21.0 <sub><small>C#</small></sub> | 140 (config only) |
| Deno 2.9.2 <sub><small>Deno/TS</small></sub> | 143 |
| Spring Boot 4.1.0 <sub><small>Java</small></sub> | 165 |
| Django 6.0.7 <sub><small>Python</small></sub> | 183 |
| Swoole PHP 6.2.1 <sub><small>PHP</small></sub> | 198 |
| Axum 0.8.9 <sub><small>Rust</small></sub> | 248 |
| Actix-web 1.97.0 <sub><small>Rust</small></sub> | 256 |
| Go 1.26 <sub><small>Go</small></sub> | 303 |

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [NpgsqlRest Deep Dive](/blog/benchmarks-2026-07/npgsqlrest)

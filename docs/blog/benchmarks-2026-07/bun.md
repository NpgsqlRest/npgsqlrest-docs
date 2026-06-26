---
layout: doc
outline: [2, 3]
title: "Bun — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Bun 1.3.14 in the July 2026 PostgreSQL REST API benchmark: a POST gold, five silvers behind Go, the best latency-SLO record in the field, and 340 MB for eight processes."
---

# Bun 1.3.14 (postgres.js)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Bun</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Bun 1.3.14 |
| **PostgreSQL driver** | postgres.js 3.4.9 — 12 connections per worker, ~96 aggregate |
| **Concurrency model** | 8 self-spawned processes sharing port 3104 via `SO_REUSEPORT` |
| **Lines of code** | 140 |
| **Podiums** | 🥇 1 · 🥈 5 · 🥉 6 — of 38 combinations |
| **Source** | [bun-app-v1.3.14](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/bun-app-v1.3.14) |

**The verdict in one sentence: with everyone finally multi-process, Bun's identity changed — it is no longer the fast runtime, it is the framework-free app with the fast driver and a memory footprint a quarter the size of the Node clusters.**

## Implementation

No framework at all — `Bun.serve` with a hand-rolled path dispatch, and postgres.js tagged-template queries. The multi-process layout uses `Bun.spawn` plus `reusePort`, so the kernel load-balances accepts across 8 identical processes ([app.ts](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/bun-app-v1.3.14/app.ts)):

```ts
const WORKERS = parseInt(process.env.WORKERS || '') || navigator.hardwareConcurrency;

if (WORKERS > 1 && !process.env.BUN_WORKER) {
    const children = [];
    for (let i = 0; i < WORKERS; i++) {
        children.push(Bun.spawn([process.execPath, import.meta.path], {
            env: { ...process.env, BUN_WORKER: '1' },
        }));
    }
    await Promise.all(children.map((c) => c.exited));
    process.exit(0);
}

const sql = postgres({ /* ... */ max: Math.max(2, Math.floor(100 / WORKERS)) });

Bun.serve({
    port: 3104,
    reusePort: true,
    async fetch(request) { /* dispatch on pathname, return Response */ }
});
```

140 lines for six endpoints — more than Fastify's 102 because routing and query-string parsing are manual, far less than Go's 303 because postgres.js maps rows to objects automatically.

## Results

### Where the driver won

Bun's twelve podiums cluster exactly where postgres.js's pipeline outruns node-postgres — request bodies, many typed parameters, big rows:

| Scenario | Result |
|---|---|
| POST, 200 VU / 100 rec | 🥇 **1,286 req/s** — Bun's gold, ahead of Swoole (1,273) and Go (1,270) |
| POST, 50 VU / 10 rec | 🥈 7,461 req/s — vs Fastify 4,111 / Express 4,097 on the same JSON body |
| Params, all levels | 🥈 15,156 / 14,453 / 13,118 — behind only Go at every VU level |
| Large payload | 🥉 in 3 of 4 combinations (334, 1,399, 340 req/s) |
| Minimal, 500 VU | 🥉 13,483 req/s |

The POST comparison is the quartet story in one row: near-identical application code, identical PostgreSQL function, and Bun moves 81% more requests than the node-postgres pair because the driver, not the runtime, is the differentiator.

### Where it fell back

On the minimal baseline Bun is last of the JS quartet at 100 VU — 16,106 (#5) against Deno's 16,436, Fastify's 16,243, Express's 16,140 — a 2% spread that rounds to a four-way tie. The genuine weak spot is heavy-row serialization on perf-test: 1,450 (#16) at 50 VU / 10 records, 1,378 (#19) at 200 VU / 10 records, and #17–#19 on the 100-record cells. Nested JSON at depth 2–3 lands #16–#20. Where PostgreSQL returns wide, typed rows, postgres.js's row-scanning path gives back what it gained on the write path.

### Latency

Bun holds the field's best SLO record, tied with Swoole: **12 of 16** perf-test combinations under 1 s p99, where every other service managed 11. The combination it uniquely holds is 50 VU / 500 records at 991 ms — nine milliseconds inside the budget. Elsewhere: 22 ms p99 on minimal at 100 VU, 12 ms on params at 50 VU. The trade-off shows at the extreme: 5,184 ms p99 at 200 VU / 500 records, a fatter tail than Deno's 4,220 ms in the same cell.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| **340 MB** | 229 MB | 110% |

The quartet's memory winner, and it is not close: eight Bun processes peaked at 340 MB against Deno's 740 MB, Express's 1,094 MB, and Fastify's 1,177 MB — about 42 MB per process where the V8 clusters spend ~140. Same worker count, same aggregate pool, 3.5× less RAM than Fastify for statistically similar baseline throughput.

## Analysis

January's "single-threaded champion" story is obsolete — not because Bun got slower, but because the field stopped fighting with one core tied behind its back. In this round's equalized deployment, Bun's own single-VU numbers rank #7 on perf-test (738 req/s at 1 VU / 1 record, with Go back on top at 927), and the crowns it held in January went to the compiled runtimes, as expected once pools and process counts were equalized. Rankings only — absolute numbers are not comparable across rounds.

What defines Bun now is a different, arguably more useful profile: the postgres.js driver advantage on POST and params (silver behind only Go), the tied-best p99 SLO record, and the smallest memory bill of any JS deployment by a factor of two to three. Against Deno — same driver, near-identical code — Bun trails by 2.5% on minimal at 200 VU (14,777 vs 15,140) while using less than half the memory. That is the actual decision surface between them; throughput is not.

**January → July movement:** ceded the 1 VU crowns (now #7 there); gained a POST gold at 200 VU / 100 records and a sweep of params silvers; became the quartet's efficiency pick rather than its speed pick.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/bun-app-v1.3.14)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Deno →](/blog/benchmarks-2026-07/deno)

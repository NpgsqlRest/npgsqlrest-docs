---
layout: doc
outline: [2, 3]
title: "Fastify — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Fastify 5.10.0 on Node.js 24 in the July 2026 PostgreSQL REST API benchmark: a minimal-baseline podium, a statistical dead heat with Express, and the memory bill for eight V8 processes."
---

# Fastify 5.10.0 (Node.js 24 + node-postgres)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Fastify</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Fastify 5.10.0 on Node.js 24 |
| **PostgreSQL driver** | node-postgres (`pg`) 8.22.0 — 12 connections per worker, ~96 aggregate |
| **Concurrency model** | `node:cluster`, one worker per core (`os.availableParallelism()`) — 8 processes |
| **Lines of code** | 102 (the fewest of any hand-written app in the field) |
| **Podiums** | 🥈 1 · 🥉 1 — of 38 combinations |
| **Source** | [fastify-app-v5.10.0](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/fastify-app-v5.10.0) |

**The verdict in one sentence: Fastify is the best of the Node pair by a hair, podiums on the minimal baseline — and everything else about its result sheet is really a report about the `pg` driver and the cost of clustering V8.**

## Implementation

This round's fairness overhaul is visible in the first ten lines of [app.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/fastify-app-v5.10.0/app.js): the single-threaded event loop is multiplied by `node:cluster` so it can use the whole machine, like the natively multi-threaded runtimes always could. Each worker gets its own `pg` pool, sized so the aggregate stays at roughly 100 connections:

```js
const WORKERS = parseInt(process.env.WORKERS || '') || os.availableParallelism();

if (cluster.isPrimary) {
    for (let i = 0; i < WORKERS; i++) {
        cluster.fork();
    }
    cluster.on('exit', () => cluster.fork());
} else {
    // Pool is per cluster worker; workers x max ~= 100 aggregate
    const pool = new Pool({ /* ... */ max: Math.max(2, Math.floor(100 / WORKERS)) });

    const fastify = Fastify({ logger: false });
    fastify.get('/api/perf-minimal', async (request, reply) => {
        const result = await pool.query('SELECT status, ts FROM public.perf_minimal()');
        return result.rows;
    });
    // ... five more handlers ...
    fastify.listen({ port: 3101, host: '0.0.0.0' });
}
```

Six endpoints in 102 lines — async handlers returning `result.rows` directly, with Fastify's serializer doing the rest. Nothing else was tuned.

## Results

### Where it podiumed

The minimal baseline is Fastify's scenario. At 200 VU only Go was faster:

| Minimal baseline | 100 VU | 200 VU | 500 VU |
|---|---:|---:|---:|
| req/s | 16,243 (#3) | **15,214 (#2)** | 13,180 (#5) |

And this is where the quartet story starts. Fastify, Express, Bun and Deno ran near-identical application code this round, and on the minimal baseline at 100 VU they landed within about 2% of each other: Fastify 16,243, Express 16,140, Bun 16,106, Deno 16,436. The runtime and the framework mattered far less than January's single-process deployments suggested.

### Where the driver set the ceiling

Once the request carries a JSON body or twenty typed parameters, Fastify's numbers stop tracking Bun/Deno — not because of the framework, but because Fastify rides node-postgres while Bun and Deno ride postgres.js:

| Combination | Fastify (pg) | Bun (postgres.js) | Deno (postgres.js) |
|---|---:|---:|---:|
| POST, 50 VU / 10 rec | 4,111 (#6) | 7,461 (#2) | 7,238 (#3) |
| Params, 50 VU | 12,494 (#7) | 15,156 (#2) | 14,797 (#3) |
| perf-test, 50 VU / 1 rec | 2,644 (#12) | 3,068 (#4) | 3,065 (#5) |

Same JSON body, same PostgreSQL function, roughly 81% more throughput on POST for the postgres.js pair. On the comprehensive perf-test scenario Fastify sits mid-field throughout — 2,583 (#12) at 100 VU / 1 record, 1,384 (#18) at 200 VU / 10 records.

### Latency

Clean where it is fast: p99 of 3 ms at 1 VU on perf-test, 22 ms on the minimal baseline at 100 VU, 13 ms on params at 50 VU. Fastify held p99 under 1 s in 11 of 16 perf-test combinations — the field's standard score (only Bun and Swoole managed 12). Its heaviest-load tail is comparatively tidy: 4,156 ms p99 at 200 VU / 500 records, against Express's 6,944 ms in the same cell.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| **1,177 MB** | 600 MB | 92% |

The highest peak memory of all 20 services — the direct cost of running 8 V8 processes, each with its own heap, JIT state, and pool. Bun's 8-process deployment peaked at 340 MB, Deno's at 740 MB, Express's at 1,094 MB. Throughput-per-megabyte is where Fastify's result sheet looks worst: Go delivered more requests from 59 MB peak.

## Analysis

The headline finding is negative, and it is the most useful one on this page: **the "Fastify is much faster than Express" folk wisdom did not survive contact with equal deployment.** At 200 VU on the minimal baseline the gap is 15,214 vs 15,001 — Express is 1.4% behind, within run-to-run noise. The only combination with a visible Fastify edge is the 1 VU sequential path (752 vs 611 req/s on perf-test), where per-request framework overhead is not amortized; under concurrency it evaporates. When both frameworks spend their time waiting on the same driver and the same PostgreSQL function, the router benchmark deltas that separate them in synthetic hello-world tests are simply not reachable.

Within the quartet, Fastify's differentiators are therefore not speed: it shares the Node ecosystem and the `pg` driver's POST/params ceiling with Express, and it pays the largest memory bill of the four. What it delivers is the shortest implementation in the entire benchmark — 102 lines for six endpoints — and a podium spot on the baseline.

**January → July movement:** rankings only — January ran Fastify as a single process, so absolute numbers describe a different deployment and are not comparable. With one worker per core, Fastify ranks #2–#3 on the minimal baseline and mid-field wherever the driver dominates; the January picture of event-loop frameworks trailing the compiled field was largely a deployment artifact, not a framework property.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/fastify-app-v5.10.0)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Express →](/blog/benchmarks-2026-07/express)

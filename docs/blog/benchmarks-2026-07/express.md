---
layout: doc
outline: [2, 3]
title: "Express — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Express 5.2.1 on Node.js 24 debuts in the July 2026 PostgreSQL REST API benchmark and finishes statistically indistinguishable from Fastify across nearly every combination."
---

# Express 5.2.1 (Node.js 24 + node-postgres)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Express</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Express 5.2.1 on Node.js 24 — **new entrant this round** |
| **PostgreSQL driver** | node-postgres (`pg`) 8.22.0 — 12 connections per worker, ~96 aggregate |
| **Concurrency model** | `node:cluster`, one worker per core (`os.availableParallelism()`) — 8 processes |
| **Lines of code** | 103 |
| **Podiums** | none of 38 combinations — best finish #4, on all three minimal-baseline levels |
| **Source** | [express-app-v5.2.1](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/express-app-v5.2.1) |

**The verdict in one sentence: the most-used Node framework was conspicuously missing in January, and its debut shows why the omission mattered — Express 5 on an equal deployment gives up nothing measurable to Fastify at database-API workloads.**

## Implementation

Added by popular demand, and deliberately written as a line-for-line sibling of the Fastify app: same `node:cluster` primary, same per-worker `pg` pool sized to a ~100-connection aggregate, same six handlers ([app.js](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/express-app-v5.2.1/app.js)):

```js
if (cluster.isPrimary) {
    for (let i = 0; i < WORKERS; i++) {
        cluster.fork();
    }
    cluster.on('exit', () => cluster.fork());
} else {
    const pool = new Pool({ /* ... */ max: Math.max(2, Math.floor(100 / WORKERS)) });

    const app = express();
    app.use(express.json());

    app.get('/api/perf-minimal', async (req, res) => {
        const result = await pool.query('SELECT status, ts FROM public.perf_minimal()');
        res.json(result.rows);
    });
    // ... five more handlers ...
    app.listen(3102, '0.0.0.0');
}
```

103 lines against Fastify's 102. Express 5's native async-handler support means no wrapper utilities, no `next(err)` boilerplate — the code reads identically to the Fastify version with `res.json()` in place of a return.

## Results

### The dead heat with Fastify

This is the page's central table. Across scenarios, Express and Fastify are one ranking slot and a rounding error apart:

| Combination | Express | Fastify | Gap |
|---|---:|---:|---:|
| Minimal, 100 VU | 16,140 (#4) | 16,243 (#3) | −0.6% |
| Minimal, 200 VU | 15,001 (#4) | 15,214 (#2) | −1.4% |
| Minimal, 500 VU | 13,235 (#4) | 13,180 (#5) | **+0.4%** |
| POST, 50 VU / 10 rec | 4,097 (#8) | 4,111 (#6) | −0.3% |
| Params, 50 VU | 12,418 (#8) | 12,494 (#7) | −0.6% |
| Large, 25 VU / 100 KB | 1,390 (#5) | 1,389 (#6) | **+0.1%** |

The sign flips depending on the cell — at 500 VU on the minimal baseline Express is ahead. The largest gap anywhere in the 38 combinations is the 1 VU perf-test path: 611 vs 752 req/s, 19% behind Fastify. That is the one combination where per-request framework overhead is paid sequentially instead of being hidden behind concurrent database waits; everywhere else the difference stays within about ±1.5%.

### Where the driver capped it

Like Fastify, Express inherits node-postgres's ceiling on body-heavy work: 4,097 req/s on POST at 50 VU / 10 records against 7,461 for Bun and 7,238 for Deno running postgres.js — the same JSON body through a different driver pipeline. On perf-test it holds #13 at 100 VU / 1 record (2,578 req/s), five req/s behind Fastify's #12.

### Latency

p99 of 23 ms on the minimal baseline at 100 VU, 14 ms on params at 50 VU, and 11 of 16 perf-test combinations under 1 s p99 — the field-standard score. One honest blemish: at the heaviest combination (200 VU / 500 records) Express posted the fattest tail in the field, 6,944 ms p99, despite a median (1,495 ms) that was third-best in that cell. The middle of its distribution is excellent under crush load; the last percentile is not.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| **1,094 MB** | 577 MB | 109% |

Second-highest peak in the field, 83 MB under Fastify's 1,177 MB — eight V8 processes cost about a gigabyte regardless of which router runs inside them. The quartet's postgres.js pair did the same job in 340 MB (Bun) and 740 MB (Deno).

## Analysis

Express's debut is the cleanest demonstration of the quartet finding: at DB-API workloads, **the framework layer above the driver is noise.** Four near-identical apps — Fastify, Express, Bun, Deno — converged within ~2% on the minimal baseline (16,243 / 16,140 / 16,106 / 16,436 at 100 VU). What actually separated them was the driver (node-postgres vs postgres.js, worth ~80% on POST throughput) and the memory model (340 MB to 1,177 MB peak for the same 8-process layout). Express's middleware chain, the historic performance scapegoat, cost roughly one percent against Fastify — measurable only if you squint, and inverted in several cells.

The practical reading for the largest framework community in the Node ecosystem: if your API is a thin layer over PostgreSQL, there is no throughput case for migrating off Express 5. There is, however, a case for caring about the driver underneath it and about whether you can afford a gigabyte of peak RSS for a clustered deployment.

**January → July movement:** none to report — Express was not in the January round, which is precisely why it was added. Note that this round's numbers are not comparable to January's for any framework: the fairness overhaul (one worker per core, equalized pools) changed absolute figures across the board, so only rankings carry over.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/express-app-v5.2.1)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Bun →](/blog/benchmarks-2026-07/bun)

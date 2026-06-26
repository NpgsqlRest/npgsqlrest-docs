---
layout: doc
outline: [2, 3]
title: "Deno — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Deno 2.9.2 debuts in the July 2026 PostgreSQL REST API benchmark: #2 on the minimal baseline behind only Go, two POST golds, and the npm postgres.js driver running unmodified."
---

# Deno 2.9.2 (npm:postgres)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Deno</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Deno 2.9.2 — **new entrant this round**, completing the JS-runtime trio |
| **PostgreSQL driver** | postgres.js 3.4.9 via `npm:` specifier — 12 connections per worker, ~96 aggregate |
| **Concurrency model** | 8 self-spawned processes sharing port 3105 via `SO_REUSEPORT` (`--unstable-net`) |
| **Lines of code** | 143 |
| **Podiums** | 🥇 2 · 🥈 3 · 🥉 6 — of 38 combinations |
| **Source** | [deno-app-v2.9.2](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/deno-app-v2.9.2) |

**The verdict in one sentence: a first-round entrant that finished #2 on the minimal baseline — ahead of Bun and both Node frameworks, behind only Go — running the same npm driver as Bun, unmodified, through node-compat.**

## Implementation

No framework — `Deno.serve` with manual dispatch, structurally identical to the Bun app. Two Deno-specific details are worth recording. First, `npm:postgres@3.4.9` worked without a single code change through Deno's Node compatibility layer. Second, `reusePort` in `Deno.serve` requires the `--unstable-net` flag — a real deployment note from this round, since without it the 8-worker layout silently cannot share the port ([app.ts](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/deno-app-v2.9.2/app.ts)):

```ts
import postgres from 'npm:postgres@3.4.9';

// --unstable-net is required for SO_REUSEPORT (reusePort) in Deno.serve
const PERMISSIONS = ['--unstable-net', '--allow-net', '--allow-env', '--allow-read', '--allow-sys'];

if (WORKERS > 1 && !Deno.env.get('DENO_WORKER')) {
    const children = [];
    for (let i = 0; i < WORKERS; i++) {
        children.push(new Deno.Command(Deno.execPath(), {
            args: ['run', ...PERMISSIONS, new URL(import.meta.url).pathname],
            env: { DENO_WORKER: '1' },
        }).spawn());
    }
    await Promise.all(children.map((c) => c.status));
    Deno.exit(0);
}

Deno.serve({ port: 3105, hostname: '0.0.0.0', reusePort: true }, async (request) => {
    /* dispatch on pathname, return Response */
});
```

143 lines — three more than Bun, the difference being the permissions plumbing above.

## Results

### Where it medaled

Deno's eleven podiums span four of the six scenarios, with the minimal baseline as the headline:

| Scenario | Result |
|---|---|
| Minimal baseline | 🥈 **16,436** at 100 VU and 🥈 13,487 at 500 VU, 🥉 15,140 at 200 VU — best of the JS quartet, behind only Go everywhere |
| POST, 100-record bodies | 🥇 1,347 (50 VU) and 🥇 1,315 (100 VU) — outright wins over the whole field |
| POST, 50 VU / 10 rec | 🥉 7,238 — vs Fastify 4,111 / Express 4,097 with the same JSON body |
| Many parameters | 🥉 at all three levels: 14,797 / 14,010 / 13,086 |
| Large payload | 🥈 1,418 at 25 VU / 100 KB |

The 100 VU minimal number deserves emphasis: 16,436 req/s beat Bun (16,106), Fastify (16,243), and Express (16,140) — a debut entrant taking the JS crown, 2.6% behind Go's 16,882.

### Where it didn't

The same postgres.js row-scanning weakness that caps Bun caps Deno: on perf-test's wide typed rows it falls to 164 (#20) at 50 VU / 100 records and 1,391 (#16) at 200 VU / 10 records, and nested JSON at depth 3 lands #19–#20. At 1 VU it is mid-field (676, #10, on perf-test 1 record). Where serialization weight dominates, the trio's driver choice cuts both ways.

### Latency

p99 of 22 ms on minimal at 100 VU and 14 ms on params at 50 VU — indistinguishable from the rest of the quartet where it counts. Deno held 11 of 16 perf-test combinations under 1 s p99, missing Bun's field-best 12 by a single cell: 50 VU / 500 records came in at 1,061 ms where Bun squeaked under at 991 ms. At the very heaviest load its tail is the better of the pair — 4,220 ms p99 at 200 VU / 500 records vs Bun's 5,184 ms.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| **740 MB** | 500 MB | 105% |

Middle of the quartet: well under the V8 clusters (Fastify 1,177 MB, Express 1,094 MB) but 2.2× Bun's 340 MB peak for the same 8-process layout and driver. Memory is the one axis where Deno's otherwise winning quartet scorecard clearly loses to Bun.

## Analysis

Deno completes the quartet experiment, and its debut is what makes the conclusion decisive: four near-identical apps across two JS engines (V8 and JavaScriptCore) and two drivers converged within ~2% on the minimal baseline. **The JS runtime wars are effectively a three-way tie on throughput.** Deno edges Bun by 2.5% on minimal at 200 VU (15,140 vs 14,777) and takes the quartet's only outright golds (POST at 100-record bodies), but pays double Bun's memory; the Node pair matches both on the baseline and loses ~45% on POST because of node-postgres, not because of Node. Choose on ecosystem, memory budget, and tooling — the built-in TypeScript, the permission model, the `npm:` compatibility that made this 143-line app possible — because req/s will not decide it for you.

Two operational notes for anyone reproducing the layout: the `--unstable-net` requirement for `reusePort` means the multi-process pattern is not yet on Deno's stable surface, and the self-spawn via `Deno.Command` needs `--allow-run` in the container's CMD.

**January → July movement:** none — Deno is new this round. The standing caveat applies regardless: the fairness overhaul changed absolute numbers for every framework, so only this round's rankings are meaningful for future comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/deno-app-v2.9.2)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Actix-web →](/blog/benchmarks-2026-07/actix)

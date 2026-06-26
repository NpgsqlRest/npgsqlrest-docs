---
layout: doc
outline: [2, 3]
title: "Django — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Django 6.0.7 in the July 2026 PostgreSQL REST API benchmark: last in most categories, a surprising #4 in nested JSON and heavy payloads, and finally measured on equal terms."
---

# Django 6.0.7 (gunicorn + psycopg 3)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Python</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Django 6.0.7 on Python 3.14, gunicorn 26 with uvicorn workers (ASGI) |
| **PostgreSQL driver** | psycopg 3.3.4 with `psycopg_pool` — 8 workers × 12 connections ≈ 100 aggregate |
| **Concurrency model** | Synchronous views, one gunicorn worker per core (`-w $(nproc)`) |
| **Lines of code** | 183 |
| **Podiums** | none — 0 of 38 combinations |
| **Source** | [django-app-v6.0.7](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/django-app-v6.0.7) |

**The verdict in one sentence: you don't pick Django for req/s — but measured on equal terms it is no longer an outlier, and in the payload-heavy combinations it is genuinely good.**

## Implementation

Plain synchronous views with raw cursors ([views.py](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/django-app-v6.0.7/app/views.py)) — no ORM models, no middleware (`MIDDLEWARE = []`), a single installed app. The fairness-relevant change lives in [settings.py](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/django-app-v6.0.7/app/settings.py):

```python
'OPTIONS': {
    # Pool is per gunicorn worker; workers x max_size ~= 100 aggregate
    # to match the single-pool services (psycopg_pool default max is only 4).
    'pool': {'min_size': 2, 'max_size': int(os.getenv('POOL_MAX_SIZE', '12'))},
},
```

```dockerfile
CMD gunicorn app.asgi:application -k uvicorn.workers.UvicornWorker \
    -w ${WORKERS:-$(nproc)} -b 0.0.0.0:8000 --log-level warning
```

In January, Django ran 4 workers on psycopg's default pool of 4 connections each. Note this is already a stripped-down Django — a production deployment with sessions, auth, and a middleware stack would sit below every number on this page.

## Results

### The floor

Wherever the request itself is the work, Django is last of 20 — at every concurrency level:

| Scenario | Result |
|---|---|
| Minimal baseline | 2,601 req/s at 100 VU (#20) — the only service below 6,000; the leader (Go) is 6.5× ahead |
| Many parameters | 2,411 req/s at 50 VU (#20) |
| POST, 10 records | 2,492 req/s at 50 VU (#20) |
| perf-test, 1 record | 358 req/s at 1 VU (#20); 2,005 at 50 VU (#19), ahead of only PostgREST |

The pattern is uniform: routing, request-object construction, and Python-side value conversion put a hard per-request ceiling of roughly 2,000–2,600 req/s on four cores, regardless of scenario.

### The bright spots

Two results break the caricature. First, **nested JSON: #4 of 20 in all six combinations** — 1,963 / 1,900 / 1,869 req/s at 50 VU across depths 1–3 — behind only Go, Swoole, and FastAPI, and ahead of both Rust frameworks and every Node runtime. Its depth penalty (−4.8% from depth 1 to 3) is the smallest in the field, better even than Go's −6.4%: `JsonResponse` passes PostgreSQL's pre-serialized JSON through without reprocessing.

Second, the heavy perf-test combinations, where payload dwarfs per-request overhead:

| perf-test | 50 VU | 100 VU | 200 VU |
|---|---:|---:|---:|
| 100 records | 174 (#4) | 173 (#4) | 171 (#4) |
| 500 records | 37 (#4) | 36 (#4) | 36 (#4) |

Again #4, behind only Swoole, Go, and FastAPI. Add 100-record POST (#6, 1,284 req/s at 50 VU) and 500 KB payloads (#5, 322–327 req/s) and a consistent picture emerges: when the database does the work, Django keeps pace with the top quartile.

### Latency

The per-request ceiling shows up as the field's worst small-request tails: p99 of 82 ms on the minimal baseline at 100 VU, where the leaders sit at 21–23 ms, and 5 ms at 1 VU where the field posts 2–3 ms. In its strong combinations the picture inverts — 57 ms p99 on nested depth 1 at 50 VU is fourth-best, and its heavy perf-test tails track the leaders.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 671 MB | 281 MB | **229.6%** |

The highest average CPU of all 20 services — more than Go and Swoole combined and change — and the third-highest peak memory, though still well under the Node cluster deployments (Express 1,094 MB, Fastify 1,177 MB). Django works hard for its numbers.

## Analysis

The point of including Django was never to watch it win; it was to measure what a full-featured, batteries-included framework actually costs when everything around it is fair. January's setup — 4 workers, 4-connection default pools — understated it; this round's 8 workers × 12 connections is a configuration Django's own documentation would endorse. On those terms, ~2,400 req/s on trivial endpoints is the honest price of the framework, and #4 in the field on payload-heavy work is the honest reward: Django's overhead is per-request, not per-byte.

The fair conclusion cuts both ways. If your API's job is high-frequency small requests, Django costs you roughly 5× the throughput of the mid-field at maximum CPU burn. If your API returns real result sets — reports, nested documents, wide rows — the gap to the leaders shrinks to 15–20%, and everything Django ships in the box comes essentially free.

**January → July movement:** still last or near-last in the server-bound categories, exactly as in January — the pool fix raised its ceiling, not its rank. The heavy-payload #4 placements are where equal pooling finally let it show something. Rankings only — the methodology changed too much for absolute comparisons.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/django-app-v6.0.7)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [Fastify →](/blog/benchmarks-2026-07/fastify)

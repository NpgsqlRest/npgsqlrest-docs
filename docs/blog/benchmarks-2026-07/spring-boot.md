---
layout: doc
outline: [2, 3]
title: "Spring Boot 4 (Java 25) — PostgreSQL REST API Benchmark, July 2026"
titleTemplate: NpgsqlRest
description: "Spring Boot 4.1.0 on Java 25 with virtual threads in the July 2026 PostgreSQL REST API benchmark: a single-request bronze, solid mid-pack throughput, and a 756 MB peak footprint."
---

# Spring Boot 4.1.0 (Java 25 + JDBC/HikariCP)

<p class="blog-meta">
<span class="tag">Benchmark</span> · <span class="tag">Java</span> · <span class="tag">July 2026</span>
</p>

Part of the [PostgreSQL REST API Benchmark, July 2026](/blog/benchmarks-2026-07/) series.

## At a glance

| | |
|---|---|
| **Version** | Spring Boot 4.1.0 on Java 25, Spring MVC + `JdbcTemplate` |
| **PostgreSQL driver** | pgJDBC + HikariCP (pool 100) |
| **Concurrency model** | Virtual threads (`spring.threads.virtual.enabled=true`) |
| **Lines of code** | 165 |
| **Podiums** | 🥉 1 — of 38 combinations |
| **Source** | [java25-spring-boot-v4.1.0](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/java25-spring-boot-v4.1.0) |

**The verdict in one sentence: with virtual threads and one serializer fix, Spring Boot runs solidly mid-pack in every scenario — the bill arrives as the heaviest single-process memory footprint in the field.**

## Implementation

A single `@RestController` with `JdbcTemplate` and parameterized `?::type` casts. The interesting code this round isn't the controller — it's a 39-line serializer. Spring Boot 4 serves HTTP responses with Jackson 3 (`tools.jackson`), and by default Jackson bean-serializes pgJDBC's `PGobject`, so a `jsonb` column comes back as `{"null":false,"type":"jsonb","value":"{\"key\":\"value\"}"}` — inflated payloads that no production app would ship and no fair benchmark can compare. This round adds the serializer a production app would configure ([PGobjectSerializer.java](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/java25-spring-boot-v4.1.0/src/main/java/com/example/demo/PGobjectSerializer.java)):

```java
public class PGobjectSerializer extends ValueSerializer<PGobject> {
    @Override
    public void serialize(PGobject value, JsonGenerator gen, SerializationContext context) {
        String v = value.getValue();
        if (v == null) { gen.writeNull(); return; }
        String type = value.getType();
        if ("json".equals(type) || "jsonb".equals(type)) {
            gen.writeRawValue(v);   // raw JSON pass-through, like every other framework
        } else {
            gen.writeString(v);     // e.g. interval as its PostgreSQL text value
        }
    }
}
```

Registered as a `JacksonModule` bean, it makes `json`/`jsonb` pass through as raw JSON — serialization parity with the rest of the field, and smaller payloads than January's wrapper objects.

## Results

### Where it was strong

| Scenario | Result |
|---|---|
| perf-test, 1 VU / 1 record | 🥉 **773 req/s (#3)** — behind only Go (927) and FastAPI (854) |
| perf-test 1 record, 50–200 VU | #7 at every level: 2,772 / 2,710 / 2,704 req/s |
| perf-test 50 VU / 10 records | 1,489 req/s (#5) |
| Many parameters | 13,802 (#6) at 50 VU · 13,374 (#6) at 100 VU |
| Minimal at 500 VU | 12,853 req/s (#8) — it climbs the board as concurrency rises |

That bronze is the JVM's single-request path at full JIT warmth: parameter binding, twenty-three-column serialization, and back in a p99 of 3 ms. The #7-at-every-VU-level consistency on the 1-record perf-test is the virtual-threads story working as advertised — throughput holds within 2.5% from 50 to 200 VU.

### Where it wasn't

POST body parsing is the weak scenario: 4,015 req/s (#17) at 50 VU/10 records and #17 again at 100 VU. The minimal baseline sits #13 at 100 and 200 VU (14,803 / 13,952 req/s) — behind the Node/Bun/Deno pack it trails by ~9%, ahead of both Rust apps. Nested JSON loses about a third of its throughput from depth 1 to 3 (1,661 → 1,131 req/s at 50 VU, #8 → #15) where Go and Swoole stay nearly flat.

### Latency

p99 of 3 ms at 1 VU, and 23 ms on the minimal baseline at 100 VU — the same band as the leaders (Go: 21 ms). Tails stay orderly under load: 148 ms at 200 VU on the 1-record perf-test, and its worst heavy-combo tail (4,215 ms at 200 VU × 500 records) is mid-pack. It held the sub-1s p99 SLO in 11 of 16 perf-test combinations, the field's standard result. Notably, HikariCP's 100-connection pool on virtual threads showed no starvation behavior anywhere: zero failed requests across all 760 tests in the round, this service included.

## Resource usage

| Peak memory | Avg memory | Avg CPU |
|---:|---:|---:|
| 756 MB | 404 MB | 98% |

The heaviest single-process footprint in the benchmark. Only the Express (1,094 MB) and Fastify (1,177 MB) deployments peaked higher — and each of those is a cluster of four Node processes; this is one JVM. Put differently: Spring Boot occupies Node-cluster territory on memory from a single process, sixteen times Go's 25 MB average for adjacent mid-table throughput. CPU, at 98% of a 400% budget, is unremarkable — it's RAM where the JVM charges rent.

## Analysis

Spring Boot's profile this round is coherence itself: #5–#8 wherever the database does real work, #13–#17 wherever the HTTP layer is the whole test. That split says the JDBC + HikariCP + virtual-threads pipeline is genuinely competitive — it's the per-request framework machinery (MVC dispatch, message conversion) that keeps it out of minimal-baseline contention. For the workloads this benchmark models — an API that actually calls PostgreSQL — the parts that matter rank well.

The serialization-parity fix deserves the last word on methodology: January's numbers were generated while shipping bloated `PGobject` wrappers, penalizing Spring Boot on every json-bearing payload. This round it competes on equal terms, which is the fairer test of the framework rather than of a missing config bean.

**January → July movement:** rankings only — the methodology changed too much for absolute comparisons. On the 1-record perf-test at 50 VU it held exactly #7, of 14 then and of 20 now. On the minimal baseline it moved from #5 of 14 to #13 of 20 — like the Rust pair, it was overtaken by the Node/Bun/Deno group, which ran single-process in January and now gets one worker per core.

## Explore on GitHub

Everything this page claims can be checked against the running code and the raw output:

- [Application source](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/java25-spring-boot-v4.1.0)
- [The PostgreSQL functions every service calls](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_postgres/init.sql)
- [k6 load scripts](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/scripts)
- [This run's per-test k6 summaries](https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327/src/_k6/results/202607131327) — filter by this service's name
- [Complete dataset: results.csv](https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv)

---

**Series:** [Introduction](/blog/benchmarks-2026-07/) · [Overall Analysis](/blog/benchmarks-2026-07/analysis) · [Raw Results](/blog/benchmarks-2026-07/results)

**Next framework:** [.NET 10 Minimal API →](/blog/benchmarks-2026-07/dotnet)

---
outline: [2, 3]
title: "Watch Mode Configuration"
titleTemplate: NpgsqlRest
description: "Configuration reference for NpgsqlRest watch mode (--watch): restart the server or re-run tests on SQL file, configuration, and database routine changes."
head:
  - - meta
    - name: keywords
      content: npgsqlrest watch mode, --watch, dev server reload, database polling, sql hot reload, postgresql rest api dev loop
  - - meta
    - property: og:title
      content: "NpgsqlRest Watch Mode Configuration"
  - - meta
    - property: og:description
      content: "Configuration reference for NpgsqlRest watch mode (--watch)."
  - - meta
    - property: og:type
      content: article
---

# Watch Mode

Configuration for **watch mode** — one feature, two flavors selected by the `--test` flag:

| Command | Flavor | Watches | On change |
|---|---|---|---|
| `npgsqlrest ... --test --watch` | **Test watch** | test files, included fixtures/profiles, endpoint SQL files, the database | changed test re-runs alone; endpoint or database change rebuilds endpoints in-process and re-runs everything |
| `npgsqlrest ... --watch` | **Server watch** | the SQL file source tree, the configuration files, the database | the server restarts (~1s) |

Watch is interactive/dev-only. In both flavors a broken SQL file cannot kill the session — `SqlFileSource.ErrorMode` is forced from `Exit` to `Skip` while watching.

## Overview

The `Watch` section is **top-level** (a sibling of `NpgsqlRest`, not nested inside it), because it drives both flavors:

```json
{
  "Watch": {
    "Enabled": false,
    "DatabasePollingInterval": "2s"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Turn watch mode on. The `--watch` CLI flag is the shorthand for this setting. |
| `DatabasePollingInterval` | string | `"2s"` | Poll the database for routine changes; `0` disables polling. |

## Enabled

Turns watch mode on; `--watch` on the command line is equivalent. The flavor is chosen by `--test`:

```sh
npgsqlrest ./config.json --watch               # server watch
npgsqlrest ./config.json --test --watch        # test watch
npgsqlrest ./config.json --watch:enabled=true  # same as --watch (standard config override syntax)
```

**Server watch** needs something to watch: an enabled [SQL file source](./sql-file-source), database polling (on by default), or both — with neither, `--watch` exits with an error. Test watch always has its test files to watch.

## DatabasePollingInterval

Routine-source endpoints (functions and procedures) have no files to watch — so watch mode polls the **database** instead, with perfect fidelity: the poll runs the **same routine discovery query the endpoint source uses**, with the same configured filters (schema/name/language includes and excludes), hashed server-side into a single value on a dedicated non-pooled connection. If the hash changes, the discovered endpoints changed — by definition.

Detected (because they change the discovery result):

- `create` / `create or replace` / `drop` / `alter` of functions and procedures, including `GRANT`/`REVOKE`
- **`COMMENT ON`** — i.e. [annotation](../annotations/) changes
- changes to the **composite types and tables used as parameter or return types** (`alter table users add column` reshapes a `returns setof users` endpoint even though no function changed)

Never triggers (because the discovery query doesn't read them): unrelated tables, temp objects, data changes.

Accepts `"2s"`, `"500ms"`, `"1m"`, a plain number of seconds, or `"hh:mm:ss"`; `0` disables polling. Polling is automatically inactive when the routine source is disabled (`NpgsqlRest.RoutineOptions.Enabled: false`).

This makes a **routines-only** project fully watchable: run `npgsqlrest ./config.json --watch`, then `create or replace` a function in psql — the endpoint is live about two seconds later, annotations included. In test watch, a database change shows as `— change detected (database) —` followed by an endpoint rebuild and a full rerun; the runner re-baselines after every rerun so self-inflicted changes never re-trigger.

## Server watch behavior

The process becomes a small **supervisor** that spawns itself as a child server and watches for changes; the child runs the completely normal server pipeline — including **code generation** (TypeScript client, HTTP files, OpenAPI regenerate on every restart), so dev is production behavior (the same model as `dotnet watch`).

| Event | Result |
|---|---|
| `.sql` change under the source tree | restart (files matching `SkipPattern` — test files — are ignored) |
| configuration file change | restart with the new configuration |
| database routine change (polling) | restart |
| broken SQL file | restart; the error is logged, that endpoint drops, everything else keeps serving |
| child crashes/exits on its own | supervisor waits for the next change (no crash-looping) |
| Ctrl+C / SIGTERM (`docker stop`) | child stopped gracefully, both processes exit, port freed |
| supervisor killed hard (SIGKILL) | the child detects the vanished parent and exits by itself — no orphan holding the port |

Graceful child stop uses SIGTERM on Linux/macOS; on Windows the child is hard-killed (nothing needs teardown in a dev server). Works in every distribution: AOT executables, framework-dependent `dotnet NpgsqlRestClient.dll`, and both Docker image flavors.

::: tip Docker Desktop bind mounts
Where file events don't cross the filesystem boundary (Docker Desktop volume mounts, network shares), set the ecosystem-standard `DOTNET_USE_POLLING_FILE_WATCHER=1` to switch the file watcher to a 1-second polling scan. This affects file watching only — database polling is unaffected.
:::

## Test watch behavior

Described in detail in the [Testing Guide](../guide/testing) and the [Test Runner configuration](./test-runner#watch-mode): a changed test file re-runs alone; endpoint file and database changes rebuild endpoints in-process (with a `+`/`-` endpoint delta report) and re-run everything; `Teardown` runs once, on exit — including on Ctrl+C and SIGTERM.

## Related

- [Testing Guide](../guide/testing) — the test runner walkthrough
- [Test Runner configuration](./test-runner) — test discovery, filtering, setup/teardown
- [SQL File Source](./sql-file-source) — the endpoint file tree that server watch monitors
- [SQL File Endpoints Guide](../guide/sql-files) — the dev loop this feature accelerates

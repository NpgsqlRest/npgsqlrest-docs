---
outline: [2, 3]
title: "Connection Management Guide"
titleTemplate: NpgsqlRest
description: "One NpgsqlRest server, many PostgreSQL databases: read replicas, sharding, OLTP + OLAP setups, multi-host failover, per-connection routine discovery, and startup verification — which mechanism to use when."
head:
  - - meta
    - name: keywords
      content: npgsqlrest connections, postgresql read replica routing, multiple databases rest api, oltp olap api, multi-host failover postgresql, connection management
  - - meta
    - property: og:title
      content: "NpgsqlRest Connection Management Guide"
  - - meta
    - property: og:description
      content: "One NpgsqlRest server, many PostgreSQL databases — which mechanism to use when."
  - - meta
    - property: og:type
      content: article
---

# Connection Management

One NpgsqlRest server can talk to many PostgreSQL databases: route read-only endpoints to replicas, spread load across shards, serve an OLTP database and an analytics warehouse from a single API, or fail over between hosts. This guide starts with the simplest possible setup and works up through the scenarios — for every setting mentioned here, the reference is [Connection Settings](/config/connection).

## Quick start: one environment variable

For a local or stock PostgreSQL, connecting takes exactly one environment variable — the database name:

::: code-group

```bash [macOS / Linux]
PGDATABASE=mydb npgsqlrest
```

```powershell [Windows]
$env:PGDATABASE = "mydb"; npgsqlrest
```

:::

No configuration file at all. For something persistent, put the same line in a `.env` file in the working directory — it is loaded automatically (3.21.0+), and real environment variables always win over it:

```
PGDATABASE=mydb
```

Both work because the shipped default connection string uses environment variable placeholders with PostgreSQL-convention fallbacks — host `localhost`, port `5432`, user and password `postgres` — with only the database name required:

```json
{
  "ConnectionStrings": {
    "Default": "Host={!PGHOST:localhost};Port={!PGPORT:5432};Database={!PGDATABASE};Username={!PGUSER:postgres};Password={!PGPASSWORD:postgres}"
  }
}
```

Anything non-default (a remote host, different credentials) is just more variables — `PGHOST`, `PGUSER`, `PGPASSWORD` — inline, exported, or as more `.env` lines. Startup fails with one actionable error when `PGDATABASE` is missing, and credentials never touch the config file. See [environment variable placeholders](/guide/configuration#optional-required-and-fallback-placeholders) for the `{NAME}` / `{!NAME}` / `{!NAME:fallback}` grammar.

Everything below is for when one connection stops being enough.

## Which mechanism do I need?

| Your situation | Mechanism |
|---|---|
| One database | Nothing — the `Default` connection string is all you need |
| Replicas or shards — **same routines everywhere**, route per endpoint | `UseMultipleConnections` + the [`@connection`](/annotations/connection) annotation |
| **Different routines on different databases** (OLTP + OLAP/DW) | `RoutineOptions.ReadMetadataFromConnections` (3.21.0+) |
| High availability / load balancing across hosts of **one** cluster | Comma-separated hosts (multi-host connection) + target session attributes |
| Catch schema drift on routed endpoints before the first failing request | `RoutineOptions.VerifyRoutedEndpoints` (3.21.0+) |

These compose: a multi-host connection string can be one of your named connections, and both routing mechanisms can be active at once.

## The default connection

Every named connection lives in the standard `ConnectionStrings` section. Without `NpgsqlRest.ConnectionName`, the **first entry** is the main connection — the one endpoints run on unless told otherwise, and the one routine metadata is discovered on by default. Set `NpgsqlRest.ConnectionName` to pick a different entry as main.

### Connection string parameters

Connection strings are standard Npgsql `key=value` pairs — everything Npgsql supports works here. The ones you'll reach for most:

| Parameter | Purpose |
|-----------|---------|
| `Host`, `Port`, `Database`, `Username`, `Password` | The basics (comma-separated hosts turn the connection [multi-host](#scenario-high-availability-and-load-balancing)) |
| `SSL Mode` | `Disable`, `Prefer`, `Require`, `VerifyCA`, `VerifyFull` |
| `Pooling`, `Maximum Pool Size`, `Minimum Pool Size` | Connection pooling (on by default, max 100) |
| `Timeout`, `Command Timeout` | Connect timeout and default statement timeout, seconds |
| `Search Path` | Default schema search path for the session |
| `Application Name` | Session label visible in `pg_stat_activity` (NpgsqlRest can manage this — see below) |

The authoritative list is the [Npgsql connection string parameters reference](https://www.npgsql.org/doc/connection-string-parameters.html); a longer curated table lives in [Connection Settings](/config/connection#connection-string-parameters).

### Connection settings

The `ConnectionSettings` section controls how NpgsqlRest treats every connection:

| Setting | Default | Purpose |
|---------|---------|---------|
| `SetApplicationNameInConnection` | `true` | Sets the connection's `Application Name` to the configured `ApplicationName` — your app is identifiable in `pg_stat_activity`. |
| `UseJsonApplicationName` | `false` | Sets `Application Name` **per request** to `{"app":"<ApplicationName>","uid":"<user_id>","id":"<execution id>"}` — see [the cancellation pattern below](#tracking-and-cancelling-requests-in-the-database). |
| `TestConnectionStrings` | `true` | Opens and closes each connection string once at startup — a connectivity test (server reachable, credentials valid). |
| `RetryOptions` | enabled | Connection-open retries on a configurable sequence (default 1, 3, 6, 12 seconds) for transient error codes — the server survives PostgreSQL starting after it does. |
| `MetadataQueryConnectionName` | `null` | Run discovery/metadata queries on a specific named connection — see [the metadata connection](#the-metadata-connection). |
| `MetadataQuerySchema` | `null` | Search path applied to metadata queries; `null` leaves the server's default search path. |
| `MultiHostConnectionTargets` | `Any` | Per-connection target session attributes for multi-host connections — see [high availability](#scenario-high-availability-and-load-balancing). |

### Tracking and cancelling requests in the database

A pattern from production use: **find the exact backend that is executing a specific HTTP request — and cancel it.** Long-running compute endpoints need a stop button; `UseJsonApplicationName` plus the execution-id header make one possible with nothing but SQL.

Two pieces:

1. Every NpgsqlRest request accepts an execution id via the `NpgsqlRest.ExecutionIdHeaderName` header (default `X-NpgsqlRest-ID`; configurable, e.g. `X-Execution-Id`). Generate one on the client and send it with the long-running call.
2. With `"UseJsonApplicationName": true`, the connection's `application_name` for that request becomes `{"app":"myapp","uid":"<user_id>","id":"<execution id>"}` — the request is now uniquely identifiable in `pg_stat_activity`.

The client sends the id and keeps it for the stop button:

```ts
const executionId = crypto.randomUUID().slice(0, 8);

await fetch(computeUrl(request), {
    headers: { "X-Execution-Id": executionId },
});

// ... later, from the stop button:
cancelCompute({ executionId });
```

And the cancel endpoint is a plain function — match the `application_name`, cancel the backend:

```sql
create function cancel_compute(
    _execution_id text,
    _user_id text = null   -- filled from the user_id claim, never by the caller
)
returns void
security definer
language plpgsql
as
$$
declare
    _rec record;
begin
    for _rec in
        select pid from pg_stat_activity
        where application_name = '{"app":"myapp","uid":"' || _user_id || '","id":"' || _execution_id || '"}'
            and query like '% compute_visualization(%'
            and state = 'active'
    loop
        perform pg_cancel_backend(_rec.pid);
    end loop;
end;
$$;

comment on function cancel_compute(text, text) is '
HTTP POST
@authorize';
```

Details that make this safe and reliable:

- Binding `_user_id` from the [user claim](/guide/authentication) (not the request) means users can only cancel **their own** executions, even though the function is `security definer` (needed for `pg_cancel_backend` on backends owned by the pooled application role).
- The extra `query like` filter pins the match to the expected routine — a stray id can't cancel something else.
- PostgreSQL truncates `application_name` at **64 characters**: keep the application name and execution ids short so the JSON fits.
- The same `application_name` JSON makes ordinary observability queries per-user and per-request precise — slow query logs, `pg_stat_activity` dashboards, `pg_terminate_backend` for the heavy hammer.

## Scenario: read replicas and resource isolation

Your databases are **identical** — streaming replicas, or shards managed by the same migrations — and you want specific endpoints to run elsewhere: read-heavy queries on a replica, analytics off the transactional pool.

Enable multiple connections and route per endpoint with the [`@connection`](/annotations/connection) annotation:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary;Database=app;Username=app;Password=...",
    "ReadReplica": "Host=replica;Database=app;Username=app;Password=..."
  },
  "NpgsqlRest": {
    "UseMultipleConnections": true
  }
}
```

```sql
comment on function get_report_data() is '
HTTP GET /reports/data
@connection ReadReplica';
```

How it works, and the contract you sign:

- Routine metadata is still discovered on the **main connection only**. The `@connection` annotation changes where the request *executes* — so the routine (with this comment) must exist on the main database, and `ReadReplica` is assumed to have the same routine. For replicas that is true by definition.
- The main connection is routable by its own name too (`@connection Default`), sharing the same connection pool as unrouted requests (3.21.0+).
- Connection names match case-insensitively; an unknown name logs a startup warning and fails the request with a 500.
- `UseMultipleConnections` is the explicit opt-in that makes `ConnectionStrings` entries routable — entries that exist for other purposes (the test runner, stats, a maintenance connection) don't become reachable from database comments unless you flip it.

## Scenario: different databases, different routines (OLTP + OLAP)

Your databases are **not** identical: the warehouse has reporting functions the transactional database will never have. Before 3.21.0 you had to create those routines on the main database anyway, just so they could be discovered. Instead, list the connections to **discover from**:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=oltp;Username=postgres;Password=...",
    "olap": "Host=warehouse;Database=olap;Username=postgres;Password=..."
  },
  "NpgsqlRest": {
    "RoutineOptions": {
      "ReadMetadataFromConnections": [ "Default", "olap" ]
    }
  }
}
```

- Routine metadata is read from **each listed connection**, and every discovered endpoint **executes on the connection it was discovered from**. A function on the warehouse is discovered there — comment annotations included — and runs there. Nothing else to configure.
- The list **replaces** the default: include the main connection's name (as above) to keep serving its routines.
- Setting the key **implicitly enables multiple connections** — no `UseMultipleConnections` needed. An explicit `@connection` annotation still overrides the execution connection per endpoint.
- Every listed name must exist in `ConnectionStrings`; a typo stops startup with an error listing the available names.
- Composite types resolve **per database** — same-named types with different fields are handled correctly.
- [Watch mode](/guide/testing#watch-mode) polls each discovery connection, so creating a routine on the warehouse restarts the dev server too.
- If the **same path** is discovered from two connections (a routine existing on both databases), the later listed connection wins and a startup warning names both — disambiguate with schema/name filters or a [`@path`](/annotations/path) annotation.

## Scenario: high availability and load balancing

Comma-separated hosts in a connection string are automatically detected as a **multi-host** connection (Npgsql failover/load balancing), and each named connection can target a server role:

```json
{
  "ConnectionStrings": {
    "Default": "Host=primary.db.com,replica1.db.com,replica2.db.com;Database=mydb;Username=app;Password=...",
    "ReadOnly": "Host=replica1.db.com,replica2.db.com,primary.db.com;Database=mydb;Username=app;Password=..."
  },
  "ConnectionSettings": {
    "MultiHostConnectionTargets": {
      "Default": "PreferPrimary",
      "ByConnectionName": {
        "ReadOnly": "PreferStandby"
      }
    }
  },
  "NpgsqlRest": {
    "UseMultipleConnections": true
  }
}
```

Endpoints annotated `@connection ReadOnly` prefer standby servers; everything else prefers the primary. This is routing within **one cluster** (same data, same schema), so it composes naturally with the `@connection` annotation. See [Multi-Host Connection Support](/config/connection#multi-host-connection-support) for all target session attributes.

## Verifying routed endpoints

An endpoint routed to a different connection than it was discovered on rests on an assumption — *the routine exists over there*. A replica that lags a migration, or a shard that missed one, breaks that silently until the first failing request. Opt into a startup check:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "VerifyRoutedEndpoints": "Warn"
    }
  }
}
```

One batched existence query per distinct target connection; `Warn` logs every missing routine (naming the routine, the connection, and the endpoints that need it), `Fail` stops startup. Note the division of labor: `TestConnectionStrings` answers *"can I open this connection?"* — `VerifyRoutedEndpoints` answers *"does it have the routines my endpoints will call?"*

## The metadata connection

`ConnectionSettings.MetadataQueryConnectionName` points the discovery queries (and `.sql` file type-checking) at a specific named connection — for example a connection with a restricted, read-only catalog role — without changing where endpoints execute. A per-connection routine source (`ReadMetadataFromConnections`) overrides it for its own discovery. The main connection's own name is a valid value (3.21.0+).

## Related

- [Connection Settings](/config/connection) — every connection option in one place
- [`@connection` annotation](/annotations/connection)
- [Routine Options](/config/routine-options) — `ReadMetadataFromConnections`, `VerifyRoutedEndpoints`
- [Configuration Guide](/guide/configuration) — environment variable placeholders and the `.env` file
- [Test Runner](/config/test-runner) — per-test-file connections and dedicated test databases

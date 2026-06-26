---
outline: [2, 3]
title: "Logging Guide"
titleTemplate: NpgsqlRest
description: "How to observe NpgsqlRest: log channels, seeing endpoints and SQL commands, PostgreSQL RAISE messages in logs, logging back into PostgreSQL, files, OpenTelemetry, and production setups."
head:
  - - meta
    - name: keywords
      content: npgsqlrest logging guide, log channels, log sql commands, raise notice logs, serilog postgresql sink, opentelemetry postgresql api, production logging
  - - meta
    - property: og:title
      content: "NpgsqlRest Logging Guide"
  - - meta
    - property: og:description
      content: "How to observe NpgsqlRest: channels, recipes, PostgreSQL notices, sinks, and production setups."
  - - meta
    - property: og:type
      content: article
---

# Logging

NpgsqlRest logging is built on Serilog and has three independent axes:

- **Channels** (Serilog *source contexts*) — *who* is logging: the endpoint engine, the client host, the test runner, the .NET framework. Each channel's level is set independently under `Log:MinimalLevels`.
- **Sinks** — *where* logs go: console, rolling files, a PostgreSQL command, an OpenTelemetry collector. Each sink has its own minimum level on top of the channel levels.
- **Levels** — `Verbose` < `Debug` < `Information` < `Warning` < `Error` < `Fatal`, plus **`"Off"`** (since 3.19.0) to silence a channel entirely.

This guide is the task-oriented walkthrough; the option-by-option reference is at [Logging configuration](/config/logging).

## The channel map

Knowing which channel carries what — and at which level — answers most "how do I see X?" questions:

| Channel | Who logs on it | `Debug` shows | `Verbose` adds |
|---|---|---|---|
| `NpgsqlRest` | The endpoint engine (library + plugins) | Every endpoint as it is created, with a summary of its annotations (authorize, cached, path, …), and — with `LogCommands` — **every SQL command endpoints execute** | `pg_catalog` discovery queries, the SQL-file describe phase, and each individual annotation as it is applied |
| `NpgsqlRestClient` *(displayed as your `ApplicationName` when set)* | The client host | Configuration processing, auth setup, startup detail | — |
| `NpgsqlRestTest` | The [SQL test runner](/guide/testing) (`--test`) | Test discovery and parsing | Every test statement and in-process HTTP invocation |
| `Microsoft`, `System` | ASP.NET Core / .NET | Framework internals (defaults to `Warning` — keep it there) | — |

PostgreSQL itself participates too: anything your SQL raises (`raise info 'x'`, `raise warning 'y'`) flows into the logs — see [PostgreSQL messages in your logs](#postgresql-messages-in-your-logs).

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Information",
      "NpgsqlRestClient": "Information",
      "NpgsqlRestTest": "Information",
      "System": "Warning",
      "Microsoft": "Warning"
    }
  }
}
```

::: tip Channel names and `ApplicationName`
When `ApplicationName` is set, the client host channel takes that name **in the log output** — lines show `[MyApi]` instead of `[NpgsqlRestClient]` in the `{SourceContext}` template placeholder. The **configuration key stays stable**: `"MinimalLevels": { "NpgsqlRestClient": ... }` keeps working regardless, because the client maps it to the actual channel name for you (using the application name itself as the key also works). The core engine channel is always `NpgsqlRest` — `ApplicationName` never affects it. The test runner channel name is configurable via `TestRunner.LoggerName`.
:::

Any setting works from the command line as well: `npgsqlrest --log:minimallevels:npgsqlrest=debug`.

## Recipes

### See which endpoints exist and why

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Debug" } } }
```

```
[DBG] Function public.get_users mapped to GET /api/get-users annotations: [HTTP GET, authorize]
[DBG] Created endpoint GET /api/get-users
```

This is the first thing to reach for when an annotation seems ignored or an endpoint is missing. (To just list endpoints without starting the server: `npgsqlrest --endpoints`.)

### See every SQL command endpoints execute

Two switches — `LogCommands` opts in, and the channel must be at `Debug` (commands log at debug level):

```json
{
  "NpgsqlRest": { "LogCommands": true },
  "Log": { "MinimalLevels": { "NpgsqlRest": "Debug" } }
}
```

Add `"LogCommandParameters": true` to include parameter values — invaluable in development, but treat it as sensitive in production (passwords and personal data end up in logs; the [`@security_sensitive`](/annotations/security-sensitive) annotation obfuscates a specific endpoint's parameters).

### Debug discovery: "why isn't my function/file picked up?"

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Verbose" } } }
```

`Verbose` shows the raw `pg_catalog` discovery queries with their schema/name filters, and the SQL-file describe phase — you can see exactly what was scanned and what was skipped, and why.

### Watch the test runner, mute everything else

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Off",
      "NpgsqlRestClient": "Off",
      "NpgsqlRestTest": "Verbose"
    }
  }
}
```

`Verbose` on `NpgsqlRestTest` prints every test statement and every in-process endpoint invocation. See the [Testing Guide](/guide/testing) for the runner itself — note that the console *report* (PASS/FAIL lines) is always printed regardless of log levels; `TestRunner.DetailedReport` shapes the report, log levels shape the diagnostics.

### Silence a channel completely

Since 3.19.0, `"Off"` (aliases `"None"`, `"Silent"`) fully mutes a channel — previously the quietest option was `Fatal`, which still let fatal events through:

```json
{ "Log": { "MinimalLevels": { "NpgsqlRest": "Off" } } }
```

## PostgreSQL messages in your logs

Messages raised by your SQL — `raise debug/log/info/notice/warning` in functions, procedures, DO blocks, or triggers — are captured from the connection and logged on the endpoint's channel, at the level matching the PostgreSQL severity. **This is on by default** (`LogConnectionNoticeEvents: true` in the `NpgsqlRest` section), which turns `raise` into a zero-infrastructure logging facility for your database code:

```sql
create function transfer(from_id int, to_id int, amount numeric) returns void as $$
begin
    ...
    raise info 'transfer of % from % to % completed', amount, from_id, to_id;
end $$ language plpgsql;
```

Every call now leaves an `INF` line in the server logs — no logging table, no extension.

`LogConnectionNoticeEventsMode` controls the shape: `MessageOnly`, `FirstStackFrameAndMessage` (default — includes where in your PL/pgSQL the raise happened), or `FullStackAndMessage`.

Two related notes:

- On [SSE endpoints](/guide/sse), `raise` messages at the configured notice level become **events streamed to the client** rather than plain log lines.
- In the [test runner](/guide/testing), captured notices are shown under failing tests (and under passing ones with `DetailedReport`).

## Logging *into* PostgreSQL

The database can be a log **destination** as well as a source — every log event can invoke a PostgreSQL command. You own the command and therefore the schema:

```sql
create table logs (
    at timestamptz not null,
    level text not null,
    message text not null,
    exception text,
    source text
);

create procedure log(_level text, _message text, _at timestamptz, _exception text, _source text)
language sql as $$
    insert into logs values (_at, _level, _message, _exception, _source);
$$;
```

```json
{
  "Log": {
    "ToPostgres": true,
    "PostgresCommand": "call log($1,$2,$3,$4,$5)",
    "PostgresMinimumLevel": "Warning"
  }
}
```

The five positional parameters are: level, message, UTC timestamp, exception text (or null), and the source context (channel name) — see the [reference](/config/logging#postgresql-command-parameters). Since it's your procedure, you can route, enrich, prune, or `pg_notify` from it.

::: tip Keep the level high
`PostgresMinimumLevel: "Warning"` is a sensible floor — logging every `Verbose` event back into the database from a busy API is a self-inflicted write load.
:::

## Files, OpenTelemetry, and production

Console output is on by default and is the right answer for containers (12-factor: let the platform collect stdout). Beyond that:

**Rolling files** — size-based rolling with retention:

```json
{
  "Log": {
    "ToFile": true,
    "FilePath": "/var/log/npgsqlrest/app.log",
    "FileSizeLimitBytes": 50000000,
    "RetainedFileCountLimit": 14
  }
}
```

**OpenTelemetry (OTLP)** — ship to a collector (Grafana/Loki, Datadog, etc.), with resource attributes carrying the application name and environment:

```json
{
  "Log": {
    "ToOpenTelemetry": true,
    "OTLPEndpoint": "http://otel-collector:4317",
    "OTLPProtocol": "Grpc",
    "OTLResourceAttributes": {
      "service.name": "{application}",
      "service.environment": "{environment}"
    }
  }
}
```

**Levels compose**: `MinimalLevels` filters at the source (per channel); each sink then applies its own minimum (`ConsoleMinimumLevel`, `FileMinimumLevel`, `PostgresMinimumLevel`, `OTLPMinimumLevel`). A common production shape: channels at `Information`, console at `Information`, file at `Information`, PostgreSQL at `Warning`.

A production baseline:

```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Information",
      "NpgsqlRestClient": "Information",
      "NpgsqlRestTest": "Information",
      "System": "Warning",
      "Microsoft": "Warning"
    },
    "ToConsole": true,
    "ConsoleMinimumLevel": "Information",
    "ToFile": true,
    "FilePath": "/var/log/npgsqlrest/app.log",
    "FileMinimumLevel": "Information",
    "ToPostgres": true,
    "PostgresCommand": "call log($1,$2,$3,$4,$5)",
    "PostgresMinimumLevel": "Warning"
  }
}
```

And the development counterpart:

```json
{
  "Log": {
    "MinimalLevels": { "NpgsqlRest": "Debug" }
  }
}
```

## Related

- [Logging configuration](/config/logging) — every option, with defaults
- [`@security_sensitive`](/annotations/security-sensitive) — obfuscate an endpoint's parameters in logs
- [Testing Guide](/guide/testing) — the `NpgsqlRestTest` channel and the report/diagnostics split
- [Server-Sent Events](/guide/sse) — `raise` as client-streamed events
- [FAQ: Debugging & Logging](/guide/faq#debugging-logging)

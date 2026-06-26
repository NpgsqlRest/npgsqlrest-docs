---
outline: [2, 3]
title: "Resolved Parameters"
titleTemplate: NpgsqlRest
description: "Compute a routine parameter's value server-side from a SQL expression at request time, instead of taking it from the client — for injecting DB-stored API tokens, secrets, or derived values into outbound HTTP calls, headers, and parameters."
head:
  - - meta
    - name: keywords
      content: npgsqlrest resolved parameter, server-side parameter, sql expression parameter, inject api token postgresql, secret in authorization header, resolved parameter expression
  - - meta
    - property: og:title
      content: "NpgsqlRest Resolved Parameters"
  - - meta
    - property: og:description
      content: "Resolve a parameter's value server-side from SQL at request time, never from the client."
  - - meta
    - property: og:type
      content: article
---

# Resolved Parameters

A **resolved parameter** has its value computed **server-side from a SQL expression** at request time, instead of being supplied by the client. You declare it with a `param_name = <sql>` comment annotation where `param_name` matches a real routine parameter.

This is how you inject a value the caller must **not** provide or see — a DB-stored API token, a secret, or anything derived in SQL — into the routine and into [`{name}` placeholder substitution](./parameter-substitution) (response headers, custom parameters, and [HTTP custom type](./http-type) URL/headers/body).

```sql
comment on function get_secure_data(_user_id int, _req my_api_type, _token text) is '
HTTP GET
_token = select api_token from user_tokens where user_id = {_user_id}
';
```

The client calls `GET /api/get-secure-data/?user_id=42`; the server runs `select api_token from user_tokens where user_id = 42`, binds the result to `_token`, and uses it wherever `{_token}` appears. The token never leaves the server, and a client `&token=hacked` is ignored.

## Syntax

```
<parameter_name> = <sql expression>
```

- `parameter_name` must match an **actual routine parameter** (by its PostgreSQL name). If the key doesn't match a parameter, it's treated as a [custom parameter](./custom-parameters) instead.
- `<sql expression>` is any scalar SQL expression — a column read, a subquery, a function call, concatenation, `coalesce`, etc. It is run with `ExecuteScalar`, so it must return a single value.
- It may contain `{name}` placeholders referencing **other** parameters (resolved case-insensitively, by actual or converted name), which are passed as safe `$N` parameters — never string-concatenated.

## Behavior

- **Server-side only.** The resolved value cannot be overridden by client input. Even if the client sends `&token=hacked`, the SQL-resolved value wins.
- **Runs before the call.** Resolved expressions execute *before* the outbound HTTP-type request and before placeholder substitution, so the resolved value is available everywhere the parameter is referenced.
- **NULL handling.** If the expression returns no rows or `NULL`, the parameter becomes SQL `NULL` (an empty string in placeholder substitution).
- **SQL-injection safe.** `{name}` placeholders inside the expression are converted to positional `$N` parameters.
- **Sequential.** Multiple resolved expressions run one-by-one on the same connection, in annotation order. A later expression can reference an earlier resolved parameter.
- **Works with claims.** Expressions can reference parameters auto-filled from JWT claims via [user parameters](./user-parameters), enabling fully zero-input authenticated calls.
- **Hidden from callers.** A resolved parameter is excluded from the client input surface and from MCP `tools/list` input schemas — an agent or caller can neither see nor set it.

## Examples

### Inject a DB-stored API token into an outbound call

```sql
comment on type weather_api is 'GET https://api.example.com/v1/current?city={_city}
Authorization: Bearer {_api_key}';

comment on function get_weather(_city text, _api weather_api, _api_key text) is '
HTTP GET
_api_key = select token from weather_tokens order by fetched_at desc limit 1
';
```

The caller supplies only `_city`. `_api_key` is read from `weather_tokens` per request, so it always reflects the latest token — useful when a separate refresh/login routine periodically writes a new token into that table. (Pair it with `pg_cron` or a refresh routine to keep the row current; a tight-expiry variant: `… where expires_at > now() order by fetched_at desc limit 1`.)

### Multiple resolved parameters

```sql
comment on function my_func(_name text, _req my_type, _token text, _api_key text) is '
HTTP GET
_token   = select api_token from tokens where user_name = {_name}
_api_key = select ''static-key-'' || api_token from tokens where user_name = {_name}
';
```

### Resolved value in URL, header, and body

A resolved value participates in every placeholder location of an [HTTP custom type](./http-type):

```
-- URL:    GET https://api.example.com/resource/{_secret_path}
-- Header: Authorization: Bearer {_token}
-- Body:   {"token": "{_token}", "data": "{_payload}"}
```

## How it compares to the other `{name}` sources

A `{name}` placeholder can be filled three ways — pick by where the value comes from:

| Source | Annotation | Use when |
| --- | --- | --- |
| **Request parameter** | (the parameter itself) | the caller provides the value |
| **[Environment variable](./parameter-substitution#environment-variables)** | `NpgsqlRest:AvailableEnvVars` allowlist | a static, per-deployment value (API key set at deploy, server name) |
| **Resolved parameter** (this page) | `param = <sql>` | a value computed/looked-up server-side per request (DB-stored token, claim-derived secret) — must not come from the client |

## Related

- [Parameter Value Substitution](./parameter-substitution) - the `{name}` substitution mechanism and its sources
- [HTTP Custom Types](./http-type) - outbound HTTP calls that consume resolved values
- [Custom Parameters](./custom-parameters) - `@key = value` where the key is *not* a parameter
- [User Parameters](./user-parameters) - auto-fill parameters from JWT claims
- [HTTP Client Options](../config/http-client) - configure the HTTP client

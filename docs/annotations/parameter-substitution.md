---
outline: [2, 3]
title: "Parameter Value Substitution"
titleTemplate: NpgsqlRest
description: "Use {name} placeholders in NpgsqlRest comment annotations to inject a request's parameter values into response headers, custom parameters, and HTTP custom type calls at request time."
head:
  - - meta
    - name: keywords
      content: npgsqlrest parameter substitution, annotation placeholder, dynamic response header, dynamic content-type, parameter value placeholder, npgsqlrest {name}
  - - meta
    - property: og:title
      content: "NpgsqlRest Parameter Value Substitution"
  - - meta
    - property: og:description
      content: "Inject request parameter values into annotation values with {name} placeholders."
  - - meta
    - property: og:type
      content: article
---

# Parameter Value Substitution

Several comment annotations accept a **`{name}` placeholder** in their value. At **request time**, `{name}` is replaced with the value of the routine parameter `name` taken from that request. This lets a single endpoint produce a response header, file name, upload path, or outbound HTTP call that depends on what the caller sent.

This is one shared mechanism reused by a few annotations — this page documents it once; each annotation page links here.

```sql
create function export_report(_type text, _file text)
returns text language sql as $$ select '...report...' $$;

comment on function export_report(text, text) is '
HTTP GET
Content-Type: {_type}
Content-Disposition: attachment; filename={_file}
';
```

A request `GET /api/export-report?type=text/csv&file=q1.csv` responds with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=q1.csv`.

## Where it works

`{name}` substitution is applied to these annotation values:

| Annotation | What is substituted | Page |
| --- | --- | --- |
| **Response headers** (`Header-Name: value`), including `Content-Type` | the header value | [Response Headers](./response-headers) |
| **Custom parameters** (`@key = value`) — e.g. upload paths/filenames | the value after `=` | [Custom Parameters](./custom-parameters) |
| **HTTP custom types** — request URL, query string, headers, and body | those parts of the outbound call | [HTTP Custom Types](./http-type) |

Other annotations do **not** perform this substitution. (Braces in unrelated annotations — e.g. a URL `{segment}` in [`PATH`](./path) — are a different feature; see [Not to be confused with](#not-to-be-confused-with).)

## How a placeholder is resolved

For each request, NpgsqlRest builds a lookup from the bound parameters (plus any [allowlisted environment variables](#environment-variables)) and replaces every `{name}` it finds:

- **The name is matched case-insensitively.** `{userId}`, `{USERID}`, and `{userid}` all resolve the same parameter. (Consistent with how PostgreSQL folds unquoted identifiers, and with [resolved parameter expressions](#not-to-be-confused-with).)
- **Both names work.** A placeholder matches either the **original PostgreSQL parameter name** (e.g. `{_user_id}`) **or** its **converted (camelCase) name** (e.g. `{userId}`). For [HTTP custom types](./http-type), the **type field name** also matches.
- **NULL or a missing value → empty string.** If the parameter is SQL `NULL` (or not supplied), `{name}` becomes `` (nothing).
- **An unknown name is left untouched — and warned about.** If `name` matches no parameter, the literal text `{name}` is kept verbatim in the output, *and* NpgsqlRest logs a **build-time warning** naming the placeholder, so typos (e.g. `{_fil}` for `{_file}`) surface at startup instead of silently shipping literal text. (The warning only fires for response headers and custom parameters, and only when the placeholder looks like an identifier — `{0}` or JSON-like `{"a":1}` are never treated as placeholders.)
- **Substitution is per-request**, evaluated against the actual values bound for that call — not fixed when the endpoint is created.
- **Zero overhead when unused.** A value is only scanned when it actually contains braces, so endpoints without placeholders pay nothing.

### Brace handling

- There is **no escape sequence** for a literal brace. A `{...}` whose inner text doesn't match a parameter is simply passed through unchanged (so `{not_a_param}` survives literally), but you cannot force a literal `{userId}` when `userId` *is* a parameter.
- A stray `}` with no opening `{`, and an unclosed `{`, are passed through as-is.

## Environment variables

A `{name}` can also resolve to an **environment variable** — useful for outbound API keys (HTTP custom types) or per-deployment values like a server/environment name in a response header — without routing them through request parameters.

This is **opt-in via an allowlist**: only environment variables you name in `NpgsqlRest:AvailableEnvVars` can be referenced. Any other `{NAME}` is never read from the environment (it stays literal, like an unknown parameter). The allowlist is the security boundary — there is no way to substitute an arbitrary env var.

```jsonc
{
  "NpgsqlRest": {
    // array form — a missing variable resolves to an empty string
    "AvailableEnvVars": [ "WEATHER_API_KEY", "SERVER_NAME" ]

    // …or object form — name → default used when the variable is absent
    // "AvailableEnvVars": { "SERVER_NAME": "local" }
  }
}
```

```sql
comment on type weather_api is '
GET https://api.example.com/v1/current?city={_city}
Authorization: Bearer {WEATHER_API_KEY}
';
```

Here `{_city}` comes from a request parameter and `{WEATHER_API_KEY}` from the allowlisted environment variable — the API key never has to be passed by the caller.

Rules specific to env vars:

- **Resolved once at startup.** The process environment is read when the app starts; changing a variable requires a restart (e.g. a new pod).
- **Case-insensitive**, same as parameters (`{server_name}` resolves `SERVER_NAME`).
- **A routine parameter of the same name wins.** If a request parameter and an allowlisted env var share a name, the parameter value is used.
- **Allowlisted names don't trigger the typo warning** — they're recognized placeholders.

Since 3.21.0, the strict forms from [configuration placeholders](/config/config-section#placeholder-forms-optional-required-and-fallback-3-17-0-fallback-3-21-0) work here too, with the same grammar:

- `{!NAME}` — resolves like `{NAME}` for allowlisted names (and parameters).
- `{!NAME:fallback}` — resolves to the value; when the allowlisted variable is unset and has no configured default, the literal `fallback` text is used instead. Also applies to parameters: a **null parameter value yields the fallback** (`X-Plan: {!_plan:free}` sends `free` when `_plan` is null).
- Unlisted names stay literal in every form — the strict forms never widen the allowlist.

::: warning Response headers are client-visible
A value substituted into a **response header** is sent to the caller. That's exactly what you want for a per-pod `Server: {SERVER_NAME}` header, but it means you must **not** put a secret env var in a response header. Reserve secrets (API keys, tokens) for outbound [HTTP custom type](./http-type) calls and [custom parameters](./custom-parameters), which stay server-side.
:::

## Examples

### Dynamic file download

```sql
comment on function get_invoice(_id int, _filename text) is '
HTTP GET
Content-Type: application/pdf
Content-Disposition: attachment; filename={_filename}
';
```

### Upload destination from a parameter

See [Custom Parameters](./custom-parameters) and [Upload](./upload). The upload handler's path/filename keys accept placeholders:

```sql
comment on function upload_avatar(_user_id int, _path text) is '
@upload for file_system
@file_system_path = /var/uploads/{_user_id}
';
```

### Outbound HTTP call shaped by parameters

See [HTTP Custom Types](./http-type). The URL, headers, and body of the proxied call accept placeholders — mix request parameters with an allowlisted [environment variable](#environment-variables) so the API key never has to be passed by the caller:

```sql
comment on type weather_api is '
GET https://api.example.com/v1/current?city={_city}
Authorization: Bearer {WEATHER_API_KEY}
';
```

## Not to be confused with

NpgsqlRest uses `{...}` syntax in a few unrelated places. They are different features with different rules:

| Feature | Looks like | When/where | Rules |
| --- | --- | --- | --- |
| **Parameter value substitution** (this page) | `{name}` in an annotation value | request time, into headers / custom params / HTTP-type calls | case-**insensitive**; unknown → literal (+ build-time warning); NULL → empty |
| [Environment-variable config placeholders](../config/config-section) | `{NAME}` / `{!NAME}` in `appsettings.json` | startup, into config values | resolved from env vars; `{!NAME}` errors if unset, `{!NAME:fallback}` uses the fallback |
| [URL path segments](./path) | `{segment}` in a `PATH` route | routing | maps a URL path segment to a parameter |
| [Resolved parameter expressions](./resolved-parameters) | `param = <sql>` (may itself contain `{name}`) | request time, **server-side in SQL** | the parameter is computed by running SQL; its result then substitutes here. `{name}` inside that SQL is matched case-**insensitively** (same as this page) |

## Related

- [Response Headers](./response-headers) - dynamic headers and `Content-Type`
- [Custom Parameters](./custom-parameters) - `@key = value` handler parameters
- [Resolved Parameters](./resolved-parameters) - compute a `{name}` value server-side from SQL (DB-stored tokens, secrets)
- [HTTP Custom Types](./http-type) - placeholders in proxied URL / headers / body
- [Comment Annotations Guide](../guide/annotations) - how annotations work

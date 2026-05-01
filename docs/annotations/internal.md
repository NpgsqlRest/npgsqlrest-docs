---
outline: [2, 3]
title: "INTERNAL Annotation"
titleTemplate: NpgsqlRest
description: "Mark an endpoint as internal-only — accessible via self-referencing calls (proxy, HTTP client types) but not exposed as a public HTTP route."
head:
  - - meta
    - name: keywords
      content: npgsqlrest internal annotation, internal endpoint, internal only, self-referencing call, parallel query composition
  - - meta
    - property: og:title
      content: "NpgsqlRest INTERNAL Annotation"
  - - meta
    - property: og:description
      content: "Mark an endpoint as internal-only — accessible via self-referencing calls but not exposed as a public HTTP route."
  - - meta
    - property: og:type
      content: article
---

# INTERNAL

::: info Also known as
`internal`, `internal_only` (with or without `@` prefix)
:::

Mark an endpoint as **internal-only** — accessible via self-referencing calls (proxy annotations and HTTP client types with relative paths) but **not** exposed as a public HTTP route.

Direct HTTP calls to an internal endpoint return 404. Internal calls via proxy or HTTP client types work normally.

## Syntax

```
@internal
@internal_only
internal
internal_only
```

All forms are equivalent.

## Example: Internal Helper with Proxy

```sql
-- Internal helper: returns data but is NOT callable from outside
create function get_cached_rates()
returns json language sql as $$
    select rates from exchange_rates order by fetched_at desc limit 1
$$;
comment on function get_cached_rates() is 'HTTP GET
@internal';

-- Public endpoint that proxies the internal one
create function convert_currency(_amount numeric, _from text, _to text)
returns json language plpgsql as $$
...
$$;
comment on function convert_currency(numeric, text, text) is 'HTTP GET
proxy GET /api/get-cached-rates';
```

- `GET /api/get-cached-rates` → **404 Not Found**
- `GET /api/convert-currency?amount=100&from=USD&to=EUR` → works (proxies internally)

## Example: Internal Helper with HTTP Client Types

```sql
-- Internal data source
create function get_users()
returns json language sql as $$
    select json_agg(row_to_json(u)) from users u
$$;
comment on function get_users() is 'HTTP GET
@internal';

-- HTTP client type pointing to internal endpoint
create type api_users as (body text);
comment on type api_users is 'GET /api/get-users';

-- Public endpoint composing internal calls
create function get_dashboard(_users api_users)
returns json language plpgsql as $$
begin
    return json_build_object('users', (_users).body::json);
end;
$$;
```

## SQL File Endpoints

Works on all endpoint sources — functions, procedures, and SQL files:

```sql
-- sql/internal_helper.sql
-- HTTP GET
-- @internal
select * from cached_data;
```

## Related

- [HTTP Client Options](/config/http-client#self-referencing-calls-relative-paths) — self-referencing calls with HTTP client types
- [Proxy Options](/config/proxy#self-referencing-calls-relative-paths) — self-referencing calls with proxy
- [PROXY](./proxy) — mark endpoint as reverse proxy
- [HTTP_TYPE](./http-type) — define HTTP request on composite type

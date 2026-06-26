---
layout: doc
outline: [2, 3]
title: "Call External APIs from PostgreSQL: HTTP Types in NpgsqlRest"
date: "2025-08-24"
titleTemplate: NpgsqlRest
description: "Call external REST APIs directly from PostgreSQL functions using .http file syntax in type comments. No HTTP extensions, no middleware, just SQL."
head:
  - - meta
    - name: keywords
      content: postgresql call external api, postgresql http request, sql call rest api, npgsqlrest http types, postgresql webhook, postgresql api integration, database api calls
  - - meta
    - property: og:title
      content: "Call External APIs from PostgreSQL: HTTP Types in NpgsqlRest"
  - - meta
    - property: og:description
      content: "Call external REST APIs directly from PostgreSQL functions. No HTTP extensions, no middleware, just SQL."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Call External APIs from PostgreSQL: HTTP Types"
  - - meta
    - name: twitter:description
      content: "Call external REST APIs directly from PostgreSQL. No extensions, no middleware, just SQL."
---

# Call External APIs from PostgreSQL: HTTP Types in NpgsqlRest

<p class="blog-meta">
<span class="tag">HTTP</span> · <span class="tag">External APIs</span> · <span class="tag">Data Aggregation</span> · <span class="tag">January 2026</span>
</p>

---

Calling an external REST API from a PostgreSQL function takes one type comment - no HTTP client libraries, no middleware services, no API gateway configuration, no PostgreSQL HTTP extensions to install. Just SQL.

NpgsqlRest's HTTP Types feature lets you define external API calls using the familiar `.http` file syntax right in your database. The HTTP request definition lives in a type comment, with function parameters automatically substituted into URLs, headers, and request bodies.

This tutorial builds a **Financial Dashboard** that aggregates data from two public APIs - currency exchange rates and cryptocurrency prices - combining them into a single response. All with about 50 lines of SQL.

> **Source Code**: [github.com/NpgsqlRest/npgsqlrest-docs/examples/9_http_calls](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/9_http_calls)

## The Problem: Backend-for-Frontend API Aggregation

A financial dashboard combines several external feeds - exchange rates from one service, crypto prices from another - before anything reaches the user. The traditional approach means an HTTP client library, a service class per API, retry and timeout handling, response-to-DTO mapping, and route wiring: a substantial codebase just to proxy external data.

## Why Not Use PostgreSQL HTTP Extensions?

Extensions like `http` and `pgsql-http` can make HTTP requests directly from SQL, but they must be compiled, installed, and maintained on every PostgreSQL instance - and managed services (AWS RDS, Azure Database, Google Cloud SQL) usually don't offer them. The architecture works against you too: database servers are often network-isolated, and every HTTP call blocks a PostgreSQL connection slot while it waits for an external server to respond.

With NpgsqlRest HTTP Types, the HTTP calls are made **from the NpgsqlRest server**, not from PostgreSQL:

```
Client → NpgsqlRest (makes HTTP calls) → PostgreSQL (receives populated data)
```

This architecture provides:

- **No database extensions required** - works with any PostgreSQL instance, including managed services
- **HTTP calls from the application tier** - where network access is typically unrestricted
- **Database connections stay fast** - PostgreSQL only executes the function with pre-fetched data
- **NpgsqlRest can scale horizontally** - multiple instances can make HTTP calls in parallel
- **Standard debugging** - HTTP issues are visible in application logs, not buried in database logs
- **Separation of concerns** - the database handles data, the application tier handles external communication

## The NpgsqlRest Solution: HTTP Types

HTTP Types turn PostgreSQL composite types into HTTP request definitions. When a function parameter uses an HTTP Type, NpgsqlRest automatically:

1. **Parses the HTTP definition** from the type comment
2. **Substitutes placeholders** with function parameter values
3. **Executes the HTTP request** before calling the function
4. **Populates the type fields** with the response (body, status, headers)
5. **Executes the PostgreSQL function** with the populated parameter

The result: external API calls declared in SQL, executed automatically by NpgsqlRest.

## The HTTP Type Syntax: Just Like .http Files

The HTTP definition comment uses the same syntax as `.http` files (RFC 7230 format):

```
METHOD URL [HTTP/version]
Header-Name: Header-Value
...
[timeout directive]

[request body]
```

With one addition that does the heavy lifting: **placeholders**. Any `{name}` in the URL, headers, or body is replaced with the corresponding function parameter value - or, since v3.17.0, with an [allowlisted environment variable](#environment-variables-for-api-keys), covered below.

```sql
comment on type my_api is 'GET https://api.example.com/users/{_user_id}
Authorization: Bearer {_token}
Accept: application/json
@timeout 10s';
```

When called with `_user_id = 123` and `_token = 'abc'`, NpgsqlRest makes:

```
GET https://api.example.com/users/123
Authorization: Bearer abc
Accept: application/json
```

## Building the Financial Dashboard

The dashboard fetches real data from two free, public APIs:

1. **Exchange Rate API** (`open.er-api.com`) - Fiat currency rates
2. **CoinGecko API** (`api.coingecko.com`) - Cryptocurrency prices

### Step 1: Define HTTP Types

First, create composite types to receive the API responses:

```sql
-- HTTP Type for Exchange Rate API
create type example_9.exchange_rate_api as (
    body jsonb,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_9.exchange_rate_api is 'GET https://open.er-api.com/v6/latest/{_base_currency}
Accept: application/json
@timeout 10s';
```

The comment defines:
- **GET** request to the Exchange Rate API
- **{_base_currency}** placeholder - substituted from function parameter
- **timeout 10s** - request timeout

```sql
-- HTTP Type for CoinGecko API
create type example_9.crypto_price_api as (
    body jsonb,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_9.crypto_price_api is 'GET https://api.coingecko.com/api/v3/simple/price?ids={_crypto_ids_csv}&vs_currencies={_vs_currencies_csv}
Accept: application/json
@timeout 10s';
```

This API requires query parameters for cryptocurrency IDs and target currencies.

### Step 2: Define the Return Type

Create a strongly-typed return structure:

```sql
create type example_9.financial_dashboard_result as (
    -- Fiat exchange rates
    fiat_base_currency text,
    fiat_rates jsonb,
    fiat_last_updated text,
    fiat_success boolean,
    fiat_error text,
    -- Cryptocurrency prices
    crypto_prices jsonb,
    crypto_success boolean,
    crypto_error text
);
```

This return type becomes a TypeScript interface in the generated client, so the type contract extends all the way to the frontend.

### Step 3: Create the Aggregation Function

```sql
create function example_9.get_financial_dashboard(
    _base_currency text,
    _target_currencies_csv text,
    _crypto_ids_csv text,
    _vs_currencies_csv text,
    _exchange_rate_response example_9.exchange_rate_api,
    _crypto_response example_9.crypto_price_api
)
returns example_9.financial_dashboard_result
language plpgsql
as $$
declare
    _result example_9.financial_dashboard_result;
    _filtered_rates jsonb = '{}'::jsonb;
    _rate_data jsonb;
    _currency text;
    _target_arr text[];
begin
    -- Process exchange rate response
    if (_exchange_rate_response).success then
        _rate_data = (_exchange_rate_response).body;
        _target_arr = string_to_array(_target_currencies_csv, ',');

        -- Filter only requested target currencies
        foreach _currency in array _target_arr loop
            _currency = upper(trim(_currency));
            if _rate_data->'rates' ? _currency then
                _filtered_rates = _filtered_rates ||
                    jsonb_build_object(_currency, _rate_data->'rates'->_currency);
            end if;
        end loop;

        _result.fiat_base_currency = upper(_base_currency);
        _result.fiat_rates = _filtered_rates;
        _result.fiat_last_updated = _rate_data->>'time_last_update_utc';
        _result.fiat_success = true;
    else
        _result.fiat_base_currency = upper(_base_currency);
        _result.fiat_success = false;
        _result.fiat_error = coalesce(
            (_exchange_rate_response).error_message,
            'Failed to fetch exchange rates (status: ' || (_exchange_rate_response).status_code || ')'
        );
    end if;

    -- Process crypto price response
    if (_crypto_response).success then
        _result.crypto_prices = (_crypto_response).body;
        _result.crypto_success = true;
    else
        _result.crypto_success = false;
        _result.crypto_error = coalesce(
            (_crypto_response).error_message,
            'Failed to fetch crypto prices (status: ' || (_crypto_response).status_code || ')'
        );
    end if;

    return _result;
end;
$$;

comment on function example_9.get_financial_dashboard is '
HTTP GET /financial-dashboard
@authorize';
```

**That's it.** The entire backend for fetching, aggregating, and returning data from two external APIs is ~80 lines of SQL.

### Step 4: Configuration

Enable HTTP Types in your configuration:

```json
{
  "NpgsqlRest": {
    "HttpClientOptions": {
      "Enabled": true
    }
  }
}
```

## What Happens at Runtime

When a client calls:

```
GET /financial-dashboard?baseCurrency=USD&targetCurrenciesCsv=EUR,GBP,JPY&cryptoIdsCsv=bitcoin,ethereum&vsCurrenciesCsv=usd,eur
```

NpgsqlRest:

1. **Parses function parameters** from the query string
2. **Identifies HTTP Type parameters** (`_exchange_rate_response`, `_crypto_response`)
3. **Substitutes placeholders** in each HTTP Type's definition:
   - Exchange Rate: `GET https://open.er-api.com/v6/latest/USD`
   - CoinGecko: `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur`
4. **Executes both HTTP requests** (can be parallel)
5. **Populates the HTTP Type fields** with responses
6. **Calls the PostgreSQL function** with populated parameters
7. **Returns the function result** as JSON

The response:

```json
{
  "fiatBaseCurrency": "USD",
  "fiatRates": {
    "EUR": 0.854542,
    "GBP": 0.740946,
    "JPY": 156.619455
  },
  "fiatLastUpdated": "Tue, 06 Jan 2026 00:02:31 +0000",
  "fiatSuccess": true,
  "fiatError": null,
  "cryptoPrices": {
    "bitcoin": { "usd": 93561, "eur": 79851 },
    "ethereum": { "usd": 3226.93, "eur": 2754.07 }
  },
  "cryptoSuccess": true,
  "cryptoError": null
}
```

## The Generated TypeScript Client

NpgsqlRest automatically generates a typed client:

```typescript
interface IGetFinancialDashboardRequest {
    baseCurrency: string | null;
    targetCurrenciesCsv: string | null;
    cryptoIdsCsv: string | null;
    vsCurrenciesCsv: string | null;
}

interface IGetFinancialDashboardResponse {
    fiatBaseCurrency: string | null;
    fiatRates: any; // JSON
    fiatLastUpdated: string | null;
    fiatSuccess: boolean | null;
    fiatError: string | null;
    cryptoPrices: any; // JSON
    cryptoSuccess: boolean | null;
    cryptoError: string | null;
}

export async function getFinancialDashboard(
    request: IGetFinancialDashboardRequest
): Promise<{
    status: number,
    response: IGetFinancialDashboardResponse,
    error: {...} | undefined
}> {
    // ... auto-generated fetch implementation
}
```

The frontend code is straightforward:

```typescript
const response = await getFinancialDashboard({
    baseCurrency: "USD",
    targetCurrenciesCsv: "EUR,GBP,JPY,CHF",
    cryptoIdsCsv: "bitcoin,ethereum",
    vsCurrenciesCsv: "usd,eur"
});

if (response.response.fiatSuccess) {
    console.log(response.response.fiatRates); // { EUR: 0.854542, GBP: 0.740946, ... }
}
```

## The Numbers

The equivalent Node.js/Express implementation needs a service class per API (axios call, timeout, error handling), a controller with request validation, route wiring with auth middleware, and hand-written TypeScript interfaces - plus axios, express-validator, and friends in `package.json`:

| Component | Traditional (Node.js) | NpgsqlRest |
|-----------|----------------------|------------|
| Service classes | 2 files, ~60 lines each | 0 |
| Controller | 1 file, ~80 lines | 0 |
| Routes | 1 file, ~15 lines | 0 (annotation) |
| Type definitions | 1 file, ~20 lines | Generated automatically |
| HTTP client | axios + configuration | Built-in |
| Total backend code | ~250 lines + dependencies | ~80 lines SQL |
| TypeScript client | Manual or OpenAPI generation | Auto-generated |
| Dependencies | axios, express-validator, etc. | None additional |

**Estimated savings: 70% less code, zero additional dependencies, auto-generated client.**

## Advanced Features

### POST Requests with Bodies

HTTP Types support all methods including POST with request bodies:

```sql
comment on type webhook_api is 'POST https://hooks.example.com/notify
Content-Type: application/json
Authorization: Bearer {_webhook_token}
@timeout 5s

{"event": "{_event_type}", "data": {_payload}}';
```

### Response Field Customization

Configure field names in your composite type:

| Field Name | Type | Description |
|------------|------|-------------|
| `body` | `text` or `jsonb` | Response body content |
| `status_code` | `int` | HTTP status code |
| `headers` | `json` | Response headers |
| `content_type` | `text` | Content-Type header |
| `success` | `boolean` | True for 2xx status codes |
| `error_message` | `text` | Error description if failed |

Using `jsonb` for the body field (as we did) avoids explicit casting in your function.

### Retry Logic

External APIs can fail transiently — rate limiting (429), temporary server errors (503), network timeouts. The `@retry_delay` directive adds automatic retries:

```sql
-- Retry 3 times with increasing delays, only on 429 and 503:
comment on type exchange_rate_api is '@retry_delay 1s, 2s, 5s on 429, 503
GET https://open.er-api.com/v6/latest/{_base_currency}
Accept: application/json
@timeout 10s';
```

The delay list defines both the number of retries and the delay before each. Without the `on` filter, retries happen on any failure. See [HTTP Client Options](/config/http-client#retry-logic) for full details.

`@timeout` accepts plain seconds (`30`), a suffix (`30s`, `5m`), or the TimeSpan format (`00:00:30`).

### Environment Variables for API Keys

Both APIs in this tutorial are free and keyless, but most real APIs want a key - and the key shouldn't come from the client. Since **v3.17.0**, `{name}` placeholders can also resolve **allowlisted environment variables**, so a static API key never has to be routed through a request parameter. For example, on CoinGecko's keyed demo tier:

```json
{
  "NpgsqlRest": {
    "AvailableEnvVars": ["COINGECKO_API_KEY"]
  }
}
```

```sql
comment on type example_9.crypto_price_api is 'GET https://api.coingecko.com/api/v3/simple/price?ids={_crypto_ids_csv}&vs_currencies={_vs_currencies_csv}
x-cg-demo-api-key: {COINGECKO_API_KEY}
Accept: application/json
@timeout 10s';
```

`{_crypto_ids_csv}` and `{_vs_currencies_csv}` still come from function parameters, while `{COINGECKO_API_KEY}` is read from the environment - the key never appears in SQL, client code, or version control.

Rules to know:

- **Opt-in allowlist.** Only variables named in `NpgsqlRest:AvailableEnvVars` are ever read - any other `{NAME}` stays literal. The allowlist is the security boundary.
- **Resolved once at startup**, matched case-insensitively. Changing a variable requires a restart.
- **Function parameters win** - a parameter with the same name takes precedence over the environment variable.

See [Parameter Substitution](/annotations/parameter-substitution#environment-variables) for full details.

### Resolved Parameter Expressions

Environment variables cover static, per-deployment secrets. For values that are per-user or computed - like a token looked up from a table - resolve them server-side via SQL instead:

```sql
comment on type paid_api is 'GET https://api.example.com/premium/{_query}
Authorization: Bearer {_token}
@timeout 10s';

create function search_premium(
    _query text,
    _user_id int,
    _req paid_api,
    _token text default null
) returns json ...

comment on function search_premium(text, int, paid_api, text) is '
_token = select api_token from user_tokens where user_id = {_user_id}
';
```

The client calls `GET /api/search-premium/?query=test&user_id=42`. The server resolves `_token` from the database and substitutes it into the `Authorization` header — the token never leaves the server. See [HTTP Client Options](/config/http-client#resolved-parameter-expressions) for full details.

## When to Use HTTP Types

HTTP Types are ideal for:

- **API Aggregation** - Combine multiple external APIs into one response
- **Data Enrichment** - Augment database records with external data
- **Webhook Triggers** - Call external services as part of business logic
- **Third-Party Integrations** - Payment processors, notification services, etc.
- **Microservice Communication** - Call other services in your architecture

Consider alternatives for:
- **High-frequency polling** - Use dedicated background services
- **Streaming data** - WebSockets or SSE are better suited

## Conclusion

HTTP Types reduce external API integration to a type comment: no client libraries, no PostgreSQL extensions, no service classes, no manual type definitions. The Financial Dashboard aggregates two external APIs in about 80 lines of SQL where the traditional approach needs 250+ lines across multiple files, plus dependencies, plus manual TypeScript types. They're the wrong tool for high-frequency polling or streaming - use background services or SSE for those - but for request-scoped API aggregation, **the code you don't write has no bugs**.

::: tip SQL File Source
Everything in this post also works with [SQL file endpoints](/guide/sql-files) — no functions needed. See the [SQL file version of this example](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/9_http_calls_sql_file).
:::

<BlogNav
  source-code="https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/9_http_calls"
  :documentation="[
    { text: 'HTTP Type Annotation', href: '/annotations/http-type' },
    { text: 'HTTP Client Options', href: '/config/http-client' },
    { text: 'Parameter Substitution', href: '/annotations/parameter-substitution' }
  ]"
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Installation', href: '/guide/installation' },
    { text: 'Configuration', href: '/guide/configuration' }
  ]"
/>

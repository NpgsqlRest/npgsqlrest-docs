---
outline: [2, 3]
title: "PROXY_OUT Annotation"
titleTemplate: NpgsqlRest
description: "Execute PostgreSQL function first, then forward the result to an upstream service. Build post-processing pipelines with PDF rendering, ML inference, and more."
head:
  - - meta
    - name: keywords
      content: npgsqlrest proxy_out, forward proxy postgresql, post-execution proxy, upstream service, pdf rendering, ml inference
  - - meta
    - property: og:title
      content: "NpgsqlRest PROXY_OUT Annotation"
  - - meta
    - property: og:description
      content: "Execute PostgreSQL function first, then forward the result to an upstream service."
  - - meta
    - property: og:type
      content: article
---

# PROXY_OUT

::: info Also known as
`forward_proxy` (with or without `@` prefix)
:::

::: tip Available since version 3.11.0
:::

Execute the PostgreSQL function first, then forward its result body to an upstream service. The upstream response is returned to the client.

## Syntax

```
@proxy_out
@proxy_out [ host_url ]
@proxy_out [ http_method ]
@proxy_out [ http_method ] [ host_url ]
```

## Description

The `proxy_out` annotation reverses the flow of the existing [`proxy`](./proxy) annotation. Instead of forwarding the *incoming* request to upstream, `proxy_out` forwards the *outgoing* function result.

This enables a common pattern where business logic in PostgreSQL prepares a payload, and an external service performs processing that PostgreSQL cannot do — PDF rendering, image processing, ML inference, email sending, etc.

```
Client Request → NpgsqlRest
  → Execute PostgreSQL function
  → Forward function result as request body to upstream service
  → Forward original query string to upstream URL
  → Return upstream response to client
```

The client-facing HTTP method and the upstream HTTP method are independent — the client can send a GET while the upstream receives a POST.

## Basic Usage

```sql
create function generate_report(report_id int)
returns json
language plpgsql as $$
begin
    return json_build_object(
        'title', 'Monthly Report',
        'data', (select json_agg(row_to_json(t)) from sales t where month = report_id)
    );
end;
$$;

comment on function generate_report(int) is 'HTTP GET
@proxy_out POST https://render-service.internal/render';
```

The client calls `GET /api/generate-report/?reportId=3`. The server:

1. Executes `generate_report(3)` in PostgreSQL.
2. Takes the returned JSON and POSTs it to `https://render-service.internal/render/api/generate-report/?reportId=3` (original query string forwarded).
3. Returns the upstream response (e.g., a rendered PDF) directly to the client with the upstream's content-type and status code.

## Proxy Annotations

### Basic Proxy Out with Default Host

Uses the host from `ProxyOptions.Host` configuration:

```sql
comment on function my_func() is '@proxy_out';
```

### Proxy Out with Custom Host

Override the default host:

```sql
comment on function my_func() is 'HTTP GET
@proxy_out POST https://my-other-service.internal';
```

### Proxy Out with HTTP Method Override

Specify which HTTP method to use for the upstream request (uses default host from configuration):

```sql
comment on function my_func() is 'HTTP GET
@proxy_out PUT';
```

The client sends GET, but the upstream receives PUT with the function's result as the body.

### Combined Method and Host

Specify both HTTP method and host:

```sql
comment on function my_func() is 'HTTP GET
@proxy_out POST https://render-service.internal/render';
```

## Query String Forwarding

The original client query string is forwarded to the upstream service as-is. This allows the upstream to receive the same parameters that were used to invoke the function:

```sql
create function generate_report(p_format text, p_id int)
returns json
language plpgsql as $$
begin
    return json_build_object('id', p_id, 'data', 'report');
end;
$$;

comment on function generate_report(text, int) is 'HTTP GET
@proxy_out POST';
```

Calling `GET /api/generate-report/?pFormat=pdf&pId=123` executes the function, then POSTs the result to the upstream with `?pFormat=pdf&pId=123` appended to the URL.

## Error Handling

- If the **function fails** (database error, exception), the error is returned directly to the client — the proxy call is never made.
- If the **upstream fails** (5xx, timeout, connection error), the upstream's error status and body are forwarded to the client (502 for connection errors, 504 for timeouts).

## Examples

### PDF Rendering Pipeline

Prepare data in PostgreSQL and render it as a PDF via an external service:

```sql
create function invoice_pdf(invoice_id int)
returns json
language plpgsql as $$
begin
    return json_build_object(
        'invoice_number', invoice_id,
        'items', (select json_agg(row_to_json(i)) from invoice_items i where i.invoice_id = invoice_pdf.invoice_id),
        'total', (select sum(amount) from invoice_items where invoice_items.invoice_id = invoice_pdf.invoice_id)
    );
end;
$$;

comment on function invoice_pdf(int) is 'HTTP GET
@proxy_out POST https://pdf-service.internal/render';
```

### ML Inference

Send prepared feature data to an ML service:

```sql
create function predict_churn(customer_id int)
returns json
language plpgsql as $$
begin
    return (
        select json_build_object(
            'features', json_build_object(
                'total_orders', count(*),
                'last_order_days', extract(day from now() - max(order_date)),
                'avg_order_value', avg(total)
            )
        )
        from orders
        where orders.customer_id = predict_churn.customer_id
    );
end;
$$;

comment on function predict_churn(int) is 'HTTP GET
@proxy_out POST https://ml-service.internal/predict/churn';
```

### Email Sending

Prepare email content in PostgreSQL and send via an email service:

```sql
create function send_welcome_email(user_id int)
returns json
language plpgsql as $$
declare
    u record;
begin
    select * into u from users where id = user_id;
    return json_build_object(
        'to', u.email,
        'subject', 'Welcome to Our Platform',
        'body', format('Hello %s, welcome!', u.display_name)
    );
end;
$$;

comment on function send_welcome_email(int) is 'HTTP POST
@proxy_out POST https://email-service.internal/send';
```

## TypeScript Client

The TypeScript client generator (`NpgsqlRest.TsClient`) recognizes `proxy_out` endpoints and generates functions that return the raw `Response` object. Since the actual response comes from the upstream proxy service (not from the PostgreSQL function's return type), the generated function returns `Promise<Response>`:

```typescript
// Generated for a proxy_out endpoint
export async function generateReport() : Promise<Response> {
    const response = await fetch(baseUrl + "/api/generate-report", {
        method: "GET",
    });
    return response;
}
```

This allows the caller to handle the response appropriately (`.json()`, `.blob()`, `.text()`, etc.).

## Configuration

Uses the same `ProxyOptions` configuration as the existing [`proxy`](./proxy) annotation. `ProxyOptions.Enabled` must be `true`:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "https://api.example.com",
      "DefaultTimeout": "30 seconds"
    }
  }
}
```

See [Proxy Options](../config/proxy) for complete configuration reference.

## Related

- [PROXY](./proxy) - Forward incoming requests to upstream (reverse proxy)
- [Proxy Options](../config/proxy) - Proxy configuration reference
- [HTTP](./http) - Expose function as HTTP endpoint

## See Also

- [Proxy Config](/config/proxy) - Configure proxy options and settings

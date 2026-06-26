---
layout: doc
outline: [2, 3]
title: "Turn PostgreSQL into MCP Tools an AI Agent Can Call"
date: "2026-06-03"
titleTemplate: NpgsqlRest
description: "NpgsqlRest 3.17.0 adds Model Context Protocol support. Annotate a PostgreSQL function or .sql file with @mcp and it becomes a tool an AI agent can discover and call — one source, two interfaces (REST + MCP), no glue code."
head:
  - - meta
    - name: keywords
      content: mcp server postgresql, model context protocol postgresql, ai agent tools postgresql, npgsqlrest mcp, expose sql as mcp tools, postgresql ai tools, mcp tools from sql, claude tools postgresql, structured tool output mcp
  - - meta
    - property: og:title
      content: "Turn PostgreSQL into MCP Tools an AI Agent Can Call"
  - - meta
    - property: og:description
      content: "NpgsqlRest 3.17.0 adds Model Context Protocol support. Annotate a function or .sql file with @mcp and it becomes a tool an AI agent can discover and call."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Turn PostgreSQL into MCP Tools an AI Agent Can Call"
  - - meta
    - name: twitter:description
      content: "Annotate a PostgreSQL function or .sql file with @mcp and an AI agent can discover and call it. One source, two interfaces."
---

# Turn PostgreSQL into MCP Tools an AI Agent Can Call

<p class="blog-meta">
<span class="tag">MCP</span> · <span class="tag">AI Agents</span> · <span class="tag">Model Context Protocol</span> · <span class="tag">PostgreSQL</span> · <span class="tag">v3.17.0</span> · <span class="tag">June 2026</span>
</p>

---

You already write the operations your application needs as PostgreSQL functions or `.sql` files. NpgsqlRest turns them into a typed REST API for your frontend. As of **3.17.0**, the *same* routines can also be **MCP tools** — so an AI agent can discover them and call them directly, with no separate tool layer to write and keep in sync.

One annotation does it:

```sql
/*
HTTP GET
@param $1 query text default null
@param $2 maxPrice numeric default null
@mcp Search the product catalog by name or category and/or a maximum price.
*/
select id, name, category, price, stock
from products
where ($1 is null or name ilike '%' || $1 || '%' or category ilike '%' || $1 || '%')
  and ($2 is null or price <= $2)
order by price;
```

`HTTP GET` makes it a REST endpoint; `@mcp` makes it a tool. The two are independent, so this file is **one PostgreSQL routine exposed through two interfaces** — a typed `/api/search-products` call for your UI, and a `search_products` tool for an agent — from a single source of truth.

This post walks through [example 15](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/15_mcp_server), an "Acme Store" built entirely from `.sql` files, and ends with a real Claude agent driving the store autonomously.

## What MCP is, in one paragraph

The [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25) (spec **2025-11-25**) is how an AI agent talks to external capabilities. The agent asks a server "what can you do?" (`tools/list`), gets back a list of tools — each with a JSON-Schema describing its arguments (`inputSchema`) — and then calls one (`tools/call`) with arguments it fills in itself. It's a thin JSON-RPC contract. NpgsqlRest implements the server side over a single Streamable-HTTP endpoint (`/mcp`), and **core stays protocol-agnostic** — the whole MCP layer lives in a separate `NpgsqlRest.Mcp` plugin.

## Opt-in, never automatic

A routine becomes a tool **only** when its comment carries `@mcp`. Nothing is exposed by accident:

| Annotation | Effect |
|---|---|
| `@mcp` | Expose as a tool; description comes from the comment prose |
| `@mcp <text>` | Expose, with `<text>` as the description |
| `@mcp_description <text>` | Explicit, authoritative description (suppresses comment prose) |
| `@mcp_name <name>` | Override the tool name (default: the routine name) |

The argument schema is **derived from the routine's parameters** — `@param $2 maxPrice numeric default null` becomes an optional `maxPrice: number` in the tool's `inputSchema`, camel-cased, nullable-aware. The return columns become an `outputSchema`. You don't hand-write either.

### Results are structured

`tools/call` runs the routine through the same pipeline as the HTTP endpoint and returns **`structuredContent`** — always a JSON object, shaped to the result:

- a single scalar → `{ "value": 42 }`
- a record / a set collapsed with `@single` → the object itself
- a set of rows → `{ "items": [ … ] }`

Business failures (an over-order tripping a `CHECK` constraint) come back as `isError: true` in the result; structural problems (unknown tool, malformed request) are JSON-RPC errors. Agents can tell the difference.

## MCP-only tools: a tool with no REST route

Because the HTTP tag and `@mcp` are independent, a **bare `@mcp` with no HTTP tag** is an MCP-only tool — it exists for agents but has no public REST route at all. The declaration can be this small:

```sql
/*
@mcp

Low-stock report (3 or fewer in stock); staff/agent-only.
*/
select name, category, stock from products where stock <= 3 order by stock;
```

The `@mcp` line opts the routine in; the plain prose beneath it becomes the tool's **description** — the text the model reads in `tools/list` to decide when to reach for this tool (the keyword is also case-insensitive and the leading `@` is optional, so `mcp` or `MCP` work too). That's the whole declaration. `tools/list` includes `inventory_report`, but `GET /api/inventory-report` returns `404`. Opting a routine into MCP never silently widens your HTTP surface, and the generated TypeScript client and OpenAPI document correctly leave MCP-only routines out.

## One source, two interfaces — made visible

Example 15's web page drives the same `.sql` files two ways, side by side:

- **Left — a real storefront over REST.** Search, filter, Buy, Cancel — built on the **generated, typed TypeScript client** (`sqlApi.ts`) that NpgsqlRest emits from the `.sql` files at startup. The UI calls `searchProducts(...)` and `placeOrder(...)` as typed functions and never hand-writes a URL.
- **Right — what an AI agent sees over MCP.** A live MCP client running `initialize` → `tools/list` → `tools/call`, rendering a call-form per tool straight from its advertised `inputSchema`.

`place_order.sql` is a typed REST function on the left and an MCP tool on the right. One routine, two consumers, zero duplicated code.

## The real test: an AI agent driving the store

A browser form is one thing; a model choosing tools on its own is the actual validation. The example ships a small, dependency-free agent ([`agent.ts`](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/15_mcp_server)) that hands the MCP tools to Claude and executes whatever it decides to call:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run agent "find peripherals under \$100, order one of the cheapest, then show me what's low on stock"
```

```text
── connected to Acme Store v1.0.0 · 8 tools ──
🧑 find peripherals under $100, order one of the cheapest, then show me what's low on stock

🔧 search_products({"query":"Peripherals","maxPrice":100})
   → {"items":[{"id":5,"name":"Ergonomic Mouse","category":"Peripherals","price":59.90,"stock":25}]}

🔧 place_order({"productId":5,"quantity":1})
   → {"orderId":1,"product":"Ergonomic Mouse","quantity":1,"total":59.90,"status":"placed"}

🔧 inventory_report({})
   → {"items":[{"name":"Wireless Charger Pad","stock":0},{"name":"1080p Webcam","stock":2}, …]}

🤖 Done — I ordered 1 Ergonomic Mouse ($59.90, order #1). Low stock: the Wireless Charger Pad
   is out of stock, and the 1080p Webcam (2) is running low.
── done ──
```

The whole pipeline ran with a real model in the loop: **your `@mcp` SQL files → `inputSchema` → Claude's tool selection → `tools/call` → PostgreSQL → result → Claude.** The server's configured `Instructions` become the agent's system prompt, so you steer behavior from config, not code.

## Authorization, without locking down the server

Tools run through the same pipeline as HTTP endpoints, so the routine's own `@authorize` check applies on `tools/call` — and you can gate a single privileged tool without forcing everyone else to authenticate. Example 15 makes only `restock_product` manager-only:

```sql
/*
HTTP POST
@param $1 productId int
@param $2 newStock int
@single
@authorize manager
@mcp Set a product's stock to an exact value. Manager-only — a privileged, mutating operation.
*/
update products set stock = $2 where id = $1
returning id, name, category, stock;
```

With JWT enabled but `RequiresAuthorization` left off, the store stays anonymous to browse and the agent keeps working — only this one tool refuses:

- no token → **401**
- a `staff`-role token → **403**
- a `manager` token → **success**

…and identically over REST (`POST /api/restock-product`), because it's the same routine. The challenge is enforced exactly as the [MCP authorization model](https://npgsqlrest.github.io/config/mcp.html) prescribes: NpgsqlRest acts as an **OAuth 2.1 Resource Server** (it validates tokens and serves Protected Resource Metadata so a client can discover your Authorization Server) — bring your own IdP (Keycloak, Auth0, Entra…) or use NpgsqlRest's own JWT login, as the example does.

## Why this approach holds up

- **No tool layer to maintain.** The tool, its argument schema, and its result shape are all derived from the routine you already wrote. Change the SQL, the tool changes with it.
- **One source of truth.** REST and MCP are two projections of the same routine — they can't drift apart.
- **Opt-in and safe by default.** Nothing is a tool until you say `@mcp`; MCP-only tools never appear as REST routes or in generated clients.
- **AOT-safe.** The JSON-RPC layer is hand-rolled over `System.Text.Json.Nodes` with no reflection — verified under `dotnet publish -p:PublishAot=true`.

## Try it

The complete, runnable example — `.sql` tools, the dual-panel web page, the Claude agent, and the authorization demo — is [example 15 on GitHub](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/15_mcp_server):

```bash
cd examples/15_mcp_server
bun run db:up    # schema + seed data
bun run build    # bundle the web client
bun run dev      # start the server
```

Then point [MCP Inspector](https://github.com/modelcontextprotocol/inspector) (`npx @modelcontextprotocol/inspector`, transport *Streamable HTTP*, URL `http://127.0.0.1:8080/mcp`) or Claude Desktop at the endpoint — or just run the agent.

Further reading: the [MCP configuration reference](/config/mcp) and the [`@mcp` annotation docs](/annotations/mcp).

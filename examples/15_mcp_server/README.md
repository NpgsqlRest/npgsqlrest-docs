# Example 15: MCP Server

An **Acme Store** [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25) server, so an AI agent can discover and call PostgreSQL-backed operations as **tools**. The tools are **`.sql` files** served by the [SqlFileSource](https://npgsqlrest.github.io/config/sql-file-source.html): each file in [`./sql`](./sql) is one endpoint and one MCP tool — add `@mcp` to its comment block and it becomes an AI tool.

> **Requires NpgsqlRest 3.17.0+** (the `NpgsqlRest.Mcp` plugin). Implements MCP spec **2025-11-25**.

## Running

```bash
bun run db:up   # create the example_15 schema, tables and seed data (migrations_15)
bun run dev     # build the web client and start the server
```

MCP endpoint: `http://127.0.0.1:8080/mcp`. There are no stored functions — the SQL files are the tools.

## The headline: a real AI agent driving the store

[`src/agent.ts`](./src/agent.ts) is a small, dependency-free agent that lets **Claude** operate the store autonomously. With the server running, in a second terminal:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run agent "find peripherals under $100, order one of the cheapest, then show me what's low on stock"
```

It discovers the tools over MCP (`tools/list`), hands them to Claude, and executes every tool Claude chooses to call (`tools/call`) — printing the model's reasoning, each tool call, and each result — until the goal is met. This is the end-to-end validation: **your `@mcp` SQL files → `inputSchema` → Claude's tool selection → `tools/call` → PostgreSQL → result → Claude**, with a real model in the loop. The server's `Instructions` become the agent's system prompt.

A run looks like this (tool results are live PostgreSQL data; the agent picks the tools on its own):

```text
── connected to Acme Store v1.0.0 · 7 tools ──
🧑 find peripherals under $100, order one of the cheapest, then show me what's low on stock

🔧 search_products({"query":"Peripherals","maxPrice":100})
   → {"items":[{"id":5,"name":"Ergonomic Mouse","category":"Peripherals","price":59.90,"stock":25}]}

🤖 The Ergonomic Mouse at $59.90 is the only peripheral under $100 — ordering one.

🔧 place_order({"productId":5,"quantity":1})
   → {"orderId":1,"product":"Ergonomic Mouse","quantity":1,"total":59.90,"status":"placed"}

🔧 inventory_report({})
   → {"items":[{"name":"Wireless Charger Pad","stock":0},{"name":"1080p Webcam","stock":2},
               {"name":"USB-C Docking Station","stock":3}]}

🤖 Done — I ordered 1 Ergonomic Mouse ($59.90, order #1). Low stock: the Wireless Charger Pad
   is out of stock, and the 1080p Webcam (2) and USB-C Docking Station (3) are running low.
── done ──
```

Note that `inventory_report` is an **MCP-only** tool — the agent can call it, but `GET /api/inventory-report` returns 404. One `@mcp` line in [`inventory_report.sql`](./sql/inventory_report.sql) is its entire declaration.

> Note on the API: Claude's Messages API has a built-in `mcp_servers` connector, but Anthropic's servers do the connecting, so it needs a **publicly reachable** URL. A localhost MCP server therefore uses the manual `tools/list` → tool-use → `tools/call` loop shown in `agent.ts` — which is also the most transparent way to see the whole pipeline work.

## The web page: one source, two interfaces

Open **http://127.0.0.1:8080** for a two-panel page that drives the *same* SQL files two ways:

- **Left — Browse & buy (REST).** A real storefront (search, category filter, Buy/Cancel) built on the **generated, typed TypeScript client** `src/sqlApi.ts`. NpgsqlRest generated that file from the `.sql` files at startup (`ClientCodeGen`), so the UI calls `searchProducts(...)`, `placeOrder(...)`, etc. as typed functions and never hand-writes a URL. This is the REST + codegen half of NpgsqlRest's pitch made tangible.
- **Right — What an AI agent sees (MCP).** A live MCP client (`initialize` → `tools/list` → `tools/call`) rendering a call-form per tool from its advertised `inputSchema` — exactly what `agent.ts` and any agent do.

Side by side, they *are* the dual-exposure: `place_order.sql` is a typed REST function on the left and an MCP tool on the right — **one PostgreSQL routine, two interfaces, zero duplicated code.** (The page is `public/index.html` + `src/app.ts`; `bun run dev`/`build` bundles it. `inventory_report` appears only on the right — it's MCP-only, so it isn't in the generated REST client.)

## Other ways to try it

1. **Raw JSON-RPC** — run [`http/mcp.http`](./http/mcp.http) top to bottom (VS Code REST Client), or `curl` the `/mcp` endpoint.
2. **A real MCP client** — point **Claude Desktop** at the endpoint, or use **MCP Inspector** (next section).

## Testing with MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official GUI for exercising an MCP server interactively — the same tool a third party would use to check your server is spec-compliant. With the server running:

```bash
npx @modelcontextprotocol/inspector
```

It opens a local web UI. In the connection panel set **Transport: `Streamable HTTP`** and **URL: `http://127.0.0.1:8080/mcp`**, then **Connect**. You get:

- **Tools** tab — all tools with their `inputSchema` rendered as a form and their `outputSchema`; fill the fields, **Run**, and see the raw `tools/call` request and response side by side. A clean way to confirm `@mcp_description`, `@mcp_name`, nullable params, and composite schemas render the way a real client interprets them.
- **History** — every JSON-RPC message in/out, so you can verify `structuredContent` shapes and `isError` business failures.
- **Server info** — your `serverInfo` (Acme Store), `protocolVersion`, capabilities, and `Instructions`.
- **Authentication** — paste a Bearer token (see the next section) to call the manager-only `restock_product` tool; without one it returns 401, with the wrong role 403.

Confirm `inventory_report` appears here (MCP-only) even though `GET /api/inventory-report` returns 404 — same proof as the agent run, but visual.

## Authorization

The store is **anonymous to browse, buy, and explore over MCP** — that's the easy-testing default. One privileged tool, [`restock_product`](./sql/restock_product.sql), is gated with `@authorize manager` to show how auth layers on **without gating the whole server**:

- [`config.json`](./config.json) enables **JWT** (`Auth.JwtAuth`) so tokens are *validated when present*, but leaves `RequiresAuthorization` off and `McpOptions.Authorization` unset — so `/mcp` and every other tool stay open. Per-tool `@authorize` does the gating, enforced on `tools/call` exactly as on the REST route.
- [`sql/login.sql`](./sql/login.sql) returns `scheme = 'jwt'`, so a successful login issues a signed JWT carrying the staff member's `roles`. Two seeded accounts (`migrations_15`):

  | Username | Password | Role | Can restock? |
  |---|---|---|---|
  | `manager` | `acme-manager` | `manager` | ✅ yes |
  | `clerk` | `acme-clerk` | `staff` | ❌ 403 |
  | *(none)* | — | — | ❌ 401 |

**From the web page:** expand **🔐 Staff login** in the left panel, log in, and the page shows the JWT with a **Copy** button and a restock control. Log in as `clerk` and restock → **403**; as `manager` → **success** (the product grid refreshes).

**From MCP Inspector:** copy that token into **Authentication → Bearer**, then call `restock_product` — 401 without it, 403 as the clerk, success as the manager.

**By hand:**

```bash
# 1. log in → grab the access token
TOKEN=$(curl -s http://127.0.0.1:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"manager","password":"acme-manager"}' | jq -r .accessToken)

# 2a. anonymous tools/call → 401
curl -s http://127.0.0.1:8080/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"restock_product","arguments":{"productId":8,"newStock":50}}}' -i | head -1

# 2b. with the manager token → success
curl -s http://127.0.0.1:8080/mcp \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"restock_product","arguments":{"productId":8,"newStock":50}}}'
```

> The `agent.ts` run stays anonymous — it never touches `restock_product`, so the headline demo needs no token. To let an agent restock, you'd hand it a Bearer token the same way Inspector does.

## The tools — one `.sql` file each

| File / tool | MCP capability |
|---|---|
| [`search_products.sql`](./sql/search_products.sql) | Set of rows; **optional/nullable params** (`@param … default null`) |
| [`get_product.sql`](./sql/get_product.sql) | **Single record** via `@single` → object, not an array; uses `@mcp_description` (explicit description + an ignored dev note) |
| [`list_categories.sql`](./sql/list_categories.sql) | **Set of scalars** → `{ "items": [ … ] }` |
| [`product_count.sql`](./sql/product_count.sql) | **Scalar** → `{ "value": N }`; **rename** via `@mcp_name catalog_size` |
| [`place_order.sql`](./sql/place_order.sql) | **Write tool** (POST; data-modifying CTE) → no read-only hint |
| [`cancel_order.sql`](./sql/cancel_order.sql) | **Destructive tool** (DELETE) → `destructiveHint` |
| [`inventory_report.sql`](./sql/inventory_report.sql) | **MCP-only** — a bare `@mcp` with **no HTTP tag** → a tool with no public REST route |
| [`restock_product.sql`](./sql/restock_product.sql) | **Authorization** — `@authorize manager` → 401 anonymous, 403 wrong role, success with a manager JWT (see below) |

## How a tool is declared (and SQL-file gotchas)

```sql
/*
HTTP GET
@param $1 query text default null
@param $2 maxPrice numeric default null
@mcp Search the product catalog by name or category and/or a maximum price.
*/
select id, name, category, price, stock
from example_15.products
where ($1 is null or name ilike '%' || $1 || '%' or category ilike '%' || $1 || '%')
  and ($2 is null or price <= $2)
order by price;
```

- The **file name is the tool name** (`search_products.sql` → `search_products`); `@mcp_name` overrides it.
- `@param $N name type [default …]` declares parameters; the agent sees them in `inputSchema` (camelCased — `maxPrice`).
- ⚠️ **The comment is an annotation block, not prose.** Unlike a function's `COMMENT`, *every* comment line in a `.sql` file is parsed as a directive, so a multi-line free-text description gets misread (a line starting with `Returns …` becomes a `@returns` type directive). Give the description explicitly with `@mcp <text>` or `@mcp_description <text>`.
  - An **explicit description suppresses comment prose**, so once you use `@mcp`/`@mcp_description` you can keep `--` developer notes in the file without them leaking into the tool — see [`get_product.sql`](./sql/get_product.sql), which uses `@mcp_description` followed by an ignored dev note.
  - Without *any* explicit description, the comment prose **is** the description — and under the default `CommentScope: All` even trailing comments count, so either give an explicit description or set [`SqlFileSource.CommentScope: "Header"`](https://npgsqlrest.github.io/config/sql-file-source).
- **The HTTP tag controls the REST route; `@mcp` controls the tool — independently.** `HTTP GET` + `@mcp` exposes both interfaces; a **bare `@mcp` with no HTTP tag is MCP-only** (the tool exists, the REST route doesn't — see [`inventory_report.sql`](./sql/inventory_report.sql)); an HTTP tag with no `@mcp` is REST-only. `@internal` remains for hiding a declared HTTP route.
- Business errors work the same: over-ordering trips the `products_stock_nonnegative` CHECK constraint → `isError: true`.

## Notes

- Server identity / guidance (`ServerName`, `Instructions`, `ToolDescriptionSuffix`) are set in [`config.json`](./config.json) under `NpgsqlRest:McpOptions`, with `RoutineOptions.Enabled: false` + `SqlFileSource.Enabled: true`.
- The store is anonymous for easy testing except the one `@authorize manager` tool (see [Authorization](#authorization)). `@authorize` and `McpOptions:Authorization` apply to SQL-file tools exactly as to database-function tools — see the [MCP config docs](https://npgsqlrest.github.io/config/mcp.html).
- `@mcp` works identically on database functions (`COMMENT ON FUNCTION … 'HTTP GET\n@mcp …'`); the SQL-file gotchas above are specific to the comment-block parsing of `.sql` files.

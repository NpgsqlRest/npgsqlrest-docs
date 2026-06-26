---
outline: [2, 3]
title: "MCP Configuration"
titleTemplate: NpgsqlRest
description: "Enable the Model Context Protocol (MCP) server endpoint for NpgsqlRest. Expose opted-in PostgreSQL routines as MCP tools for AI agents over a single Streamable HTTP JSON-RPC endpoint."
head:
  - - meta
    - name: keywords
      content: npgsqlrest mcp, model context protocol server, postgresql mcp tools, ai agent postgresql, mcp json-rpc endpoint, streamable http mcp
  - - meta
    - property: og:title
      content: "NpgsqlRest MCP Configuration"
  - - meta
    - property: og:description
      content: "Enable the MCP server endpoint and expose PostgreSQL routines as MCP tools in NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# MCP Options

::: tip New in 3.17.0
The `NpgsqlRest.Mcp` plugin and the `McpOptions` config section were added in version 3.17.0. It implements the [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25) specification **2025-11-25**.
:::

Configuration for the **MCP (Model Context Protocol) server** — a single Streamable-HTTP JSON-RPC endpoint that lets an AI agent discover (`tools/list`) and execute (`tools/call`) PostgreSQL routines that have been opted in with the [`@mcp` annotation](../annotations/mcp).

The MCP server is **disabled by default**, and no routine is ever exposed automatically — only routines that carry `@mcp` become tools.

## Overview

```json
{
  "NpgsqlRest": {
    "McpOptions": {
      "Enabled": false,
      "UrlPath": "/mcp",
      "ServerName": null,
      "ServerVersion": "1.0.0",
      "Instructions": null,
      "ToolDescriptionSuffix": null,
      "RateLimiterPolicy": null,
      "AllowedOrigins": [],
      "Authorization": {
        "RequireAuthorization": false,
        "AuthorizationServers": [],
        "ScopesSupported": [],
        "Audience": null,
        "ProtectedResourceMetadataPath": null,
        "FilterToolsByRole": false
      },
      "ToolSchemas": {
        "Enabled": false,
        "FileOverwrite": true,
        "OpenAiFileName": "npgsqlrest_tools_openai.json",
        "OpenAiUrlPath": "/tools/openai.json",
        "AnthropicFileName": "npgsqlrest_tools_anthropic.json",
        "AnthropicUrlPath": "/tools/anthropic.json",
        "LlmsTxtFileName": "llms.txt",
        "LlmsTxtUrlPath": "/llms.txt"
      }
    }
  }
}
```

## Options

### Enabled

- Type: `boolean`
- Default: `false`

Enables or disables the MCP server endpoint. When `false`, no MCP endpoint is registered. Note: `@mcp` annotations are still collected when [`ToolSchemas`](#function-calling-schemas-and-llms-txt-toolschemas) generation is enabled, which works independently of this setting.

### UrlPath

- Type: `string`
- Default: `/mcp`

URL path for the MCP endpoint. The endpoint is a single Streamable-HTTP JSON-RPC endpoint that accepts `POST`.

### ServerName

- Type: `string` (nullable)
- Default: `null`

The `serverInfo.name` value reported in the MCP `initialize` handshake. When `null`, the database name from the connection string is used (mirroring the OpenAPI document title), falling back to `"NpgsqlRest"` if it cannot be resolved.

### ServerVersion

- Type: `string`
- Default: `"1.0.0"`

The `serverInfo.version` value reported in the MCP `initialize` handshake. A null/blank value also falls back to `"1.0.0"`.

### Instructions

- Type: `string` (nullable)
- Default: `null`

Optional server-level instructions returned in the MCP `initialize` handshake — high-level guidance the agent can use when deciding how to call the available tools. When `null`, no instructions are sent.

### ToolDescriptionSuffix

- Type: `string` (nullable)
- Default: `null`

Optional text appended (as a suffix) to **every** tool's description in `tools/list`. When `null`, nothing is added.

### RateLimiterPolicy

- Type: `string` (nullable)
- Default: `null`

Name of an ASP.NET [rate-limiter policy](https://learn.microsoft.com/aspnet/core/performance/rate-limit) applied to the whole `/mcp` endpoint. When `null` (default), MCP traffic is not rate-limited.

A routine's own [`@rate_limiter`](../annotations/rate-limiter-policy) annotation does **not** carry to MCP — `tools/call` invokes the routine directly, bypassing the per-route middleware (NpgsqlRest logs a startup warning when an `@mcp` routine also has `@rate_limiter`). `RateLimiterPolicy` is how you throttle the MCP endpoint instead, covering every JSON-RPC method on it.

The named policy must be **registered on the host** — `AddRateLimiter(o => o.AddPolicy("name", …))` (or a built-in limiter such as `AddFixedWindowLimiter`) plus `UseRateLimiter()`. An unregistered name surfaces as the framework's error when a request reaches the endpoint. (When set, NpgsqlRest serves `/mcp` as a mapped endpoint so the policy can attach; on hosts without endpoint routing it logs a warning and the policy is not applied.)

```jsonc
"RateLimiterPolicy": "mcp"
```

### AllowedOrigins

- Type: `string[]`
- Default: `[]`

Allowed values of the HTTP `Origin` header — DNS-rebinding protection required by the Streamable HTTP transport. A request whose `Origin` is present but matches neither this list nor the server's own origin is rejected with **403**. Requests without an `Origin` header (e.g. server-to-server) are allowed. Empty (default) = only same-origin browser requests pass.

Use it for short, shared context that should ride along with every tool the agent inspects — e.g. `"Read-only Acme CRM."` or `"Amounts in USD."`. Unlike [`Instructions`](#instructions) (returned once at `initialize`, and which some clients don't surface prominently), a description suffix is attached to each tool, so the model sees it whenever it considers that tool.

Keep it short: the suffix is repeated across every tool, so long text inflates the `tools/list` payload. For longer server-wide guidance, prefer `Instructions`.

```jsonc
"ToolDescriptionSuffix": "Read-only Acme CRM."
```

A tool whose own description is *"Get the current weather for a city."* is then reported as:

```
Get the current weather for a city. Read-only Acme CRM.
```

## Function-calling schemas and llms.txt (`ToolSchemas`)

Available since version 3.20.0. The MCP tool catalog (the routines annotated with `mcp`) can additionally be projected into three plain capability documents — no schema logic is rebuilt, so parameter exclusion (claim-sourced/IP/virtual/resolved), description precedence, and type mapping are inherited from the MCP tools exactly:

- **OpenAI Chat Completions `tools` array** — `{"type":"function","function":{name, description, parameters}}` per tool, `parameters` being the MCP `inputSchema` verbatim.
- **Anthropic Messages API `tools` array** — `{name, description, input_schema}` per tool.
- **llms.txt** — a markdown capability document: H1 from `ServerName` (or the database name), a blockquote summary from `Instructions`, one section per endpoint (method, URL, description, parameters), and a Machine-readable section linking the OpenAPI document, the /mcp endpoint, and the two tools documents.

```json
{
  "NpgsqlRest": {
    "McpOptions": {
      "ToolSchemas": {
        "Enabled": false,
        "FileOverwrite": true,
        "OpenAiFileName": "npgsqlrest_tools_openai.json",
        "OpenAiUrlPath": "/tools/openai.json",
        "AnthropicFileName": "npgsqlrest_tools_anthropic.json",
        "AnthropicUrlPath": "/tools/anthropic.json",
        "LlmsTxtFileName": "llms.txt",
        "LlmsTxtUrlPath": "/llms.txt"
      }
    }
  }
}
```

Behavior:

- **Independent of `Enabled`**: the documents are generated and served from `mcp` annotations even when the /mcp endpoint itself is disabled.
- Each `FileName` writes a file (relative to the working directory) and each `UrlPath` serves the document from memory (GET only, anonymous, built once at startup). Set a value to `null` to skip that file or endpoint — e.g. null all `UrlPath` keys and point the `FileName`s into your static files root to serve them as plain static files instead.
- Tool names are sanitized to the OpenAI function-name form (`[a-zA-Z0-9_-]`, max 64 characters) in the JSON documents, with a logged warning; llms.txt keeps the original names. Two tools colliding after sanitization fail at startup.
- Output is deterministic (tools ordered by name, no timestamps).

## How it works

Once enabled, the endpoint is a single Streamable-HTTP JSON-RPC endpoint (POST only; `GET` → `405`, no SSE). Per the transport spec it validates the `Origin` header (a present, untrusted origin → `403`; see [AllowedOrigins](#allowedorigins)) and the `MCP-Protocol-Version` header (a present header other than `2025-11-25` → `400`; absent is allowed). It implements the MCP lifecycle and tools methods:

- **`initialize`** — advertises the `tools` capability and returns `serverInfo` (name/version above) and the protocol version `2025-11-25`. `notifications/initialized` is acknowledged with `202`. `ping` returns an empty result.
- **`tools/list`** — returns the catalog of opted-in routines. Each tool has a `name` (the routine name, or an `@mcp_name` override), a `description` (from `@mcp <text>` or the comment prose), a JSON-Schema `inputSchema` derived from the routine's parameters, and an `outputSchema` derived from the routine's return columns (matching the `structuredContent` shape below; leaf values allow `null`, and array/json/composite columns use a permissive schema so results always conform).
- **`tools/call`** — executes the routine through the same invocation pipeline as the HTTP endpoint, **forwarding the authenticated identity** so [`@authorize`](../annotations/authorize) role checks apply. The result carries `structuredContent` (always a JSON object) plus a `text` content block holding its serialized form:

  ```json
  {
    "content": [{ "type": "text", "text": "{\"total\":1234,\"status\":\"paid\"}" }],
    "structuredContent": { "total": 1234, "status": "paid" },
    "isError": false
  }
  ```

  `structuredContent` is mapped from the routine's return shape (per MCP 2025-11-25, it is always an object):

  | Routine returns | `structuredContent` |
  | --- | --- |
  | a single value (`int`, `text`, …) | `{ "value": 42 }` |
  | a single record/composite (or a set with [`single`](../annotations/single)) | the object: `{ "total": 1234, … }` |
  | a set of values | `{ "items": [1, 2, 3] }` |
  | a set of rows | `{ "items": [ { … }, { … } ] }` |

  (Numbers/booleans/JSON are embedded as JSON; other scalar types as a string. Raw-mode and `void` routines emit the text block only.)

  Business failures are returned as `isError: true` in the result; structural failures (unknown method, unknown tool, malformed request) are returned as JSON-RPC errors (`-32601`, `-32602`, `-32700`).

::: tip Rate limiting
A routine's `@rate_limiter` annotation applies to its **HTTP route**, not to MCP calls — `tools/call` executes the routine directly, bypassing the route's rate-limiter. To throttle MCP traffic, set [`RateLimiterPolicy`](#ratelimiterpolicy) to a host-registered policy applied to the whole `/mcp` endpoint, or rate-limit the `/mcp` path at a reverse proxy / API gateway.
:::

## Authentication — OAuth 2.1 Resource Server

The `/mcp` endpoint acts as an **OAuth 2.1 Resource Server** (bring-your-own Authorization Server). Token validation reuses the host's bearer authentication — NpgsqlRest is **not** an Authorization Server; point `AuthorizationServers` at an external IdP (Keycloak, Auth0, Entra, …) or at NpgsqlRest's own JWT login acting separately.

::: tip No built-in Authorization Server
NpgsqlRest does not ship an Authorization Server (token / consent / authorization-code endpoints) — that is potential future work. The Resource Server role above covers every deployment that already has an IdP (or uses NpgsqlRest's own JWT). The only scenario it can't cover is fully interactive browser-login with **no** external IdP at all; if you don't have an IdP and don't need interactive login, use NpgsqlRest's own JWT (static-token) auth instead.
:::

::: warning Enabling MCP does not enable authentication
Authentication is configured **separately** from MCP (via the host's [`Auth`](./auth) section — e.g. `JwtAuth`). The MCP `Authorization` settings only add the transport gate, PRM advertising, and audience binding *on top of* whatever principal the host's auth produced. If you set `RequireAuthorization: true` without configuring authentication, **every `/mcp` request returns 401** (nothing is ever authenticated) — NpgsqlRest logs a startup warning in this case. For audience validation, configure the host JWT bearer's `ValidAudience` to the same value as `Audience` below.
:::

Tool execution forwards the caller's authenticated principal, so per-routine [`@authorize`](../annotations/authorize) role requirements are enforced on `tools/call` exactly as on HTTP endpoints. A tool that needs authentication, called anonymously, returns **HTTP 401** (with the PRM challenge); an authenticated caller lacking the required role gets **HTTP 403** with `WWW-Authenticate: Bearer error="insufficient_scope"`. No authorization logic is duplicated — this reuses core's check.

### Authorization options

These live under `McpOptions:Authorization`.

#### RequireAuthorization

- Type: `boolean`
- Default: `false`

When `true`, every MCP request requires an authenticated principal (the host's bearer middleware must have populated the identity). An unauthenticated request is rejected with **HTTP 401** and a `WWW-Authenticate: Bearer resource_metadata="…"` challenge (RFC 9728 §5.1) so the client can discover the Authorization Server. When `false` (default), anonymous requests are allowed and a tool's own `@authorize` annotation still gates it per call.

#### AuthorizationServers

- Type: `string[]`
- Default: `[]`

Authorization Server issuer URL(s) advertised in the Protected Resource Metadata. **When empty, no PRM document is served.**

#### ScopesSupported

- Type: `string[]`
- Default: `[]`

Optional scopes advertised in the Protected Resource Metadata (`scopes_supported`).

#### Audience

- Type: `string` (nullable)
- Default: `null`

The canonical resource URI tokens must target (RFC 8707 audience) and the `resource` value in the PRM document. When `null`, it is derived from the request (scheme + host + `UrlPath`).

When set, it is also **enforced**: an authenticated token must carry this value in its `aud` claim, or the request is rejected with **401** (tokens issued for a different resource are refused). Token signature/expiry validation remains the host bearer middleware's responsibility; configure it with this same audience.

#### ProtectedResourceMetadataPath

- Type: `string` (nullable)
- Default: `null`

Path the Protected Resource Metadata document is served at. When `null`, the RFC 9728 well-known path is used: `/.well-known/oauth-protected-resource` + `UrlPath` (e.g. `/.well-known/oauth-protected-resource/mcp`).

#### FilterToolsByRole

- Type: `boolean`
- Default: `false`

When `true`, `tools/list` hides tools the calling principal could not run — i.e. tools whose routine has an [`@authorize`](../annotations/authorize) requirement the caller doesn't satisfy. When `false` (default), every opted-in tool is listed, keeping them discoverable (so an agent can still attempt a call and be prompted to authenticate). Authorization is enforced on `tools/call` either way; this only affects what the listing reveals.

### Protected Resource Metadata (RFC 9728)

When an Authorization Server is configured, NpgsqlRest serves a discovery document at the well-known path. The PRM document itself is always anonymous (it is discovery), even when `RequireAuthorization` is on:

```json
{
  "resource": "https://your-host/mcp",
  "authorization_servers": ["https://as.example.com"],
  "scopes_supported": ["mcp.read", "mcp.write"],
  "bearer_methods_supported": ["header"]
}
```

::: tip Note
By default `tools/list` lists every opted-in tool — keeping them discoverable so an agent can attempt a call and be prompted to authenticate — and authorization is enforced on `tools/call`. Set [`FilterToolsByRole`](#filtertoolsbyrole) to instead hide tools the caller can't run.
:::

## Related

- [MCP annotation](../annotations/mcp) - Opt a routine in as an MCP tool (`@mcp`, `@mcp_name`)
- [internal annotation](../annotations/internal) - Hide a declared HTTP route (a bare `@mcp` with no HTTP tag is already MCP-only)
- [authorize annotation](../annotations/authorize) - Role checks enforced on tool calls
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Blog: Turn PostgreSQL into MCP Tools an AI Agent Can Call](../blog/mcp-server-postgresql-ai-tools-npgsqlrest) - A complete walkthrough with a real Claude agent driving the store

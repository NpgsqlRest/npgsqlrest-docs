---
outline: [2, 3]
title: "MCP Annotation"
titleTemplate: NpgsqlRest
description: "Opt a PostgreSQL routine in as a Model Context Protocol (MCP) tool. Expose functions to AI agents for discovery and execution, with an optional MCP-only (no HTTP route) mode."
head:
  - - meta
    - name: keywords
      content: npgsqlrest mcp annotation, model context protocol postgresql, expose function as mcp tool, ai agent tools, postgresql mcp server, mcp tool name
  - - meta
    - property: og:title
      content: "NpgsqlRest MCP Annotation"
  - - meta
    - property: og:description
      content: "Opt a PostgreSQL routine in as an MCP tool for AI agents in NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# MCP

::: tip New in 3.17.0
The `@mcp` annotation and the `NpgsqlRest.Mcp` plugin were added in version 3.17.0. It implements the [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25) specification **2025-11-25**.
:::

Opt a routine in as an **MCP tool** so an AI agent can discover it (`tools/list`) and execute it (`tools/call`) over the [MCP server endpoint](../config/mcp).

Exposure is **never automatic** — a routine becomes a tool only when its comment carries `@mcp`. When the [MCP plugin](../config/mcp) is not loaded (or `McpOptions.Enabled` is `false`), the annotation is a no-op — safe to leave on a routine regardless of how the host is configured.

## Syntax

```
@mcp                       # expose as a tool; description from the comment prose
@mcp <text>                # expose; <text> is an inline (explicit) tool description
@mcp_description <text>    # expose; explicit, authoritative description (alias: @mcp_desc)
@mcp_name <name>           # override the tool name (default: the routine name)
```

### Description precedence

The tool's `description` uses a **fixed priority** — the highest-priority source that is present wins, **regardless of the order the lines appear** in the comment — and an explicit description **suppresses** the comment-prose fallback (so unrelated comment lines never leak into it):

1. **`@mcp_description <text>`** — explicit and authoritative. Always wins when present, even if it appears *after* an `@mcp <text>` line.
2. **inline `@mcp <text>`** — explicit.
3. **comment prose** — the routine's free-text comment lines (those that aren't annotations). Used only when no explicit description is given.
4. **the routine name** — last resort (a warning is logged).

So if you give *any* explicit description, the rest of your comment is just a comment. (Order only matters when you repeat the *same* annotation — the last occurrence wins.) Provide a description explicitly (preferably `@mcp_description`) whenever your comment also contains notes you don't want an agent to see; let the prose fallback do the work when your comment *is* the description.

## MCP-only tools (no HTTP route)

**The HTTP tag controls the REST route; `@mcp` controls the tool — independently.** A bare `@mcp` with **no HTTP tag** exposes the routine **only** as an MCP tool, with no public REST endpoint:

```sql
comment on function summarize_account(_account_id int) is '
@mcp Summarize an account for the agent, including balance and recent activity.
';
```

The routine is callable via `tools/call` but has no HTTP route — an endpoint that exists only because `@mcp` requested it is internal-only by default, so opting into MCP never silently widens your HTTP surface. (Requires the comment-gated modes — `OnlyAnnotated`, the client default, or `OnlyWithHttpTag`. A debug log notes the defaulting at startup.)

The full matrix:

| Comment carries | Result |
| --- | --- |
| `HTTP GET` + `@mcp` | REST endpoint **and** MCP tool |
| `@mcp` only | **MCP-only** (no REST route) |
| `HTTP GET` only | REST-only (no tool) |
| `HTTP GET` + `@mcp` + [`@internal`](./internal) | MCP-only (`@internal` hides the declared route) |

This works identically for **SQL file endpoints**: a `.sql` file whose comment carries `@mcp` but no `HTTP` tag becomes an MCP-only tool (without `@mcp` such a file is skipped as a non-endpoint script, as before).

All other annotations apply equally — most usefully [`@authorize`](./authorize): when a tool runs, the caller's authenticated identity is forwarded, so role checks are enforced exactly as they would be for the HTTP endpoint.

## Examples

### Expose a routine as a tool (HTTP **and** MCP)

```sql
create function get_weather(_city text)
returns text
language sql as $$
  select format('Weather for %s: sunny, 22C', _city);
$$;

comment on function get_weather(_city text) is '
HTTP GET /api/weather
@mcp Get the current weather for a city.
';
```

The routine is reachable at `GET /api/weather` **and** advertised as the `get_weather` MCP tool with the description *"Get the current weather for a city."* and an input schema derived from its parameters (`{ "city": { "type": "string" } }`).

### Description from comment prose

```sql
comment on function list_open_tickets() is '
HTTP GET /api/tickets/open
List all currently open support tickets for triage.
@mcp
';
```

With a bare `@mcp`, the description is taken from the prose line — *"List all currently open support tickets for triage."*

### Explicit description, with a private note that stays out of it

```sql
comment on function rebuild_search_index() is '
HTTP POST
@mcp Rebuild the product search index. Safe to call; runs in the background.
@mcp_description Rebuild the product search index. Returns immediately.
TODO: revisit batch size — internal note, must NOT reach the agent.
';
```

Because `@mcp_description` is present, it is the description verbatim — the inline `@mcp` text and the `TODO:` prose line are both ignored. (For SQL-file endpoints, also see [`SqlFileSource.CommentScope`](../config/sql-file-source), which controls *which* comments are parsed at all.)

### Override the tool name

```sql
comment on function fn_q1_report() is '
@mcp Quarterly revenue report.
@mcp_name quarterly_report
';
```

The tool is published as `quarterly_report` rather than `fn_q1_report` — and since there is no HTTP tag, it is [MCP-only](#mcp-only-tools-no-http-route) (no REST route).

**As a SQL file endpoint** (`sql/quarterly-report.sql`):

```sql
-- @mcp Quarterly revenue report.
-- @mcp_name quarterly_report
select * from generate_quarterly_report();
```

## Recognized keywords

| Form | Action |
| --- | --- |
| `@mcp` | Expose as a tool; description from comment prose |
| `@mcp <text>` | Expose as a tool; `<text>` is an inline (explicit) description |
| `@mcp_description <text>` | Expose as a tool; explicit, authoritative description (alias `@mcp_desc`) — suppresses comment prose |
| `@mcp_name <name>` | Override the tool name |

## Related

- [MCP Configuration](../config/mcp) - Enable the MCP server endpoint, set server name/version/instructions
- [internal annotation](./internal) - Hide a declared HTTP route (a bare `@mcp` with no HTTP tag is already MCP-only)
- [authorize annotation](./authorize) - Role checks are enforced on tool calls via the forwarded identity
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Blog: Turn PostgreSQL into MCP Tools an AI Agent Can Call](../blog/mcp-server-postgresql-ai-tools-npgsqlrest) - A complete walkthrough with a real Claude agent driving the store

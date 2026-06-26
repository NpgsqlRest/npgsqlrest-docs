---
layout: doc
outline: [2, 3]
title: "NpgsqlRest 3.20.0: Dart Clients for Flutter, React Query Hooks, and Tool Schemas for AI Agents"
date: "2026-06-26"
titleTemplate: NpgsqlRest
description: "NpgsqlRest 3.20.0 release notes with real examples: a Dart client generator for Flutter, TanStack Query hooks alongside the TypeScript client, OpenAI/Anthropic function-calling schemas and llms.txt from the MCP tool set, and the HTTP QUERY method."
head:
  - - meta
    - name: keywords
      content: npgsqlrest 3.20, dart code generation, flutter api client, postgresql flutter, tanstack query hooks, react query codegen, openai function calling schema, anthropic tools, llms.txt, http query method
  - - meta
    - property: og:title
      content: "NpgsqlRest 3.20.0: Dart Clients for Flutter, React Query Hooks, and Tool Schemas for AI Agents"
  - - meta
    - property: og:description
      content: "NpgsqlRest 3.20.0 — a Dart client generator for Flutter, TanStack Query hooks, OpenAI/Anthropic tool schemas and llms.txt, and the HTTP QUERY method."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "NpgsqlRest 3.20.0: Dart Clients, React Query Hooks, and Tool Schemas"
  - - meta
    - name: twitter:description
      content: "A Dart client generator for Flutter, TanStack Query hooks, OpenAI/Anthropic tool schemas and llms.txt, and the HTTP QUERY method."
---

# NpgsqlRest 3.20.0: Dart Clients for Flutter, React Query Hooks, and Tool Schemas for AI Agents

<p class="blog-meta">
  <span>July 2026</span> ·
  <span class="tag">v3.20.0</span>
  <span class="tag">Code Generation</span>
  <span class="tag">Flutter</span>
  <span class="tag">React</span>
  <span class="tag">AI Agents</span>
</p>

**[NpgsqlRest 3.20.0](/guide/changelog/v3.20.0)** is a code-generation release. The same idea applied three more times — you already have the SQL, so the client should be generated from it:

1. **A Dart client generator** — typed `package:http` modules for Flutter projects, the Dart counterpart of the TypeScript client.
2. **TanStack Query (React Query) hooks** generated alongside the TypeScript client — `useQuery`/`useMutation` with exported query-key factories.
3. **Function-calling schemas and llms.txt** — the `@mcp` tool catalog projected into OpenAI and Anthropic `tools` documents, plus a markdown capability document for agents.
4. And the recently standardized **HTTP QUERY method**, supported across the whole stack.

Runnable end-to-end versions are in the examples repository — [example 22](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/22_dart_client) (Dart) and [example 23](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/23_react_query_hooks) (hooks). Full reference in the [v3.20.0 changelog](/guide/changelog/v3.20.0).

## 1. Dart Clients for Flutter

The TypeScript client has been generating typed fetch modules since the beginning. If your frontend is Flutter, you were on your own — until now. The new `NpgsqlRest.DartClient` plugin emits idiomatic Dart built on [`package:http`](https://pub.dev/packages/http) and nothing else, so it works on every Flutter target: mobile, desktop, web.

Start from the flagship endpoint form — a plain [SQL file](/guide/sql-files) with named parameters:

```sql
-- sql/search_products.sql
/*
HTTP GET
@param limit default 10
*/
select id, name, price, created_at
from products
where name ilike '%' || :search || '%'
order by id
offset (:page - 1) * :limit
limit :limit;
```

Point the new `DartClientCodeGen` section at your Flutter project:

```jsonc
{
  "NpgsqlRest": {
    "DartClientCodeGen": {
      "Enabled": true,
      // {0} is the schema name (snake case) or the @dartclient_module module name
      "FilePath": "../my_app/lib/api/{0}.dart"
    }
  }
}
```

And this is what comes out — a request class, a response class, and an async function:

```dart
class SearchProductsRequest {
  final String? search;
  final int? page;
  final int? limit;

  const SearchProductsRequest({
    this.search,
    this.page,
    this.limit,
  });

  Map<String, dynamic> toJson() {
    return {
      'search': search,
      'page': page,
      if (limit != null) 'limit': limit,
    };
  }
}

class SearchProductsResponse {
  final int? id;
  final String? name;
  final double? price;
  final DateTime? createdAt;

  factory SearchProductsResponse.fromJson(Map<String, dynamic> json) {
    return SearchProductsResponse(
      id: (json['id'] as num?)?.toInt(),
      name: json['name'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      createdAt: json['createdAt'] == null ? null : DateTime.parse(json['createdAt'] as String),
    );
  }
  // ...
}

Future<ApiResult<List<SearchProductsResponse>>> searchProducts(SearchProductsRequest request) async {
  final uri = Uri.parse('$baseUrl/api/search-products' + _query({
    'search': request.search,
    'page': request.page,
    if (request.limit != null) 'limit': request.limit,
  }));
  // ...
}
```

The details worth noticing, because they are exactly the details you'd otherwise get wrong by hand:

- **Defaults survive.** A parameter with a default — `@param limit default 10` here, or a function parameter's `default 10` — becomes an optional field that is *omitted* from the query string when null, so the default applies, instead of being clobbered by a client-side `null`.
- **Real numeric types.** Unlike TypeScript, where every numeric is `number`, Dart distinguishes them: `int` for integers, `double` for `real`/`double precision`/`numeric`, `DateTime` for timestamps (`DateTime.parse` in, `toIso8601String` out).
- **Wire names stay intact.** `created_at` becomes a `createdAt` field, but the JSON key keeps the raw name.
- **`ApiResult<T>` / `ApiError`** wrappers carry the HTTP status code and problem-details errors (on by default via `IncludeStatusCode`).

The generator covers the full endpoint surface the TypeScript client does: multipart uploads with a progress callback, server-sent events (an `SseSubscription` built on streamed `package:http` responses — still no extra dependency), raw responses for proxy endpoints, login/logout special-casing, and per-endpoint control through `@dartclient` annotations (`@dartclient = off`, `@dartclient_module`, `@dartclient_status_code`, ...).

And it is testable without a server. Every generated module exposes a top-level `httpClient` variable — assign a `MockClient` from `package:http/testing.dart`:

```dart
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;
import 'package:my_app/api/public.dart' as api;

void main() {
  api.httpClient = MockClient((request) async {
    return http.Response('[{"id":1,"name":"Mock","price":1.0}]', 200);
  });
  // api.searchProducts(...) now returns the mocked data
}
```

See [Dart Code Generation](/config/dart-codegen), the [DARTCLIENT annotation](/annotations/dartclient), and [example 22](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/22_dart_client).

## 2. TanStack Query (React Query) Hooks

If your React app uses TanStack Query — and statistically, it does — the generated fetch functions were only half the work. You still wrote the `useQuery` wrappers and invented query keys by hand. Now the TypeScript client generates that layer too ([example 23](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/23_react_query_hooks)):

```jsonc
{
  "NpgsqlRest": {
    "ClientCodeGen": {
      "Enabled": true,
      "FilePath": "./23_react_query_hooks/src/{0}Api.ts",

      "ReactQuery": {
        "Enabled": true,
        // Output path for the generated TanStack Query hooks module
        "FilePath": "./23_react_query_hooks/src/{0}Hooks.ts",
        // First element of every query key, so this API's cache entries are namespaced
        "QueryKeyPrefix": "example23"
      }
    }
  }
}
```

GET endpoints become `useQuery` hooks with an exported key factory; everything else becomes a `useMutation` hook. Verbatim from the generated file:

```typescript
export const searchTodosKeys = {
    all: ["example23", "searchTodos"] as const,
    byRequest: (request: SearchTodosRequest) =>
        ["example23", "searchTodos", request] as const,
};

export function useSearchTodos(
    request: SearchTodosRequest,
    options?: Omit<
        UseQueryOptions<SearchTodosResult>,
        "queryKey" | "queryFn"
    >,
) {
    return useQuery({
        queryKey: searchTodosKeys.byRequest(request),
        queryFn: () => api.searchTodos(request),
        ...options,
    });
}
```

The whole request object is a query-key segment, so changing any parameter re-fetches (and caches) automatically — TanStack v5 hashes keys with stable, key-order-insensitive serialization. And because the hooks derive their types from the client functions (`Parameters<typeof fn>[0]`, `Awaited<ReturnType<typeof fn>>`), they work regardless of your `ExportTypes`/`CreateSeparateTypeFile` settings.

Consuming them looks like this — note the invalidation, wired **explicitly** through the exported key factories:

```tsx
const todos = useSearchTodos({ search, done: null });
const stats = useGetStats({ staleTime: 60_000 });

const createTodo = useCreateTodoMutation({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: searchTodosKeys.all });
        queryClient.invalidateQueries({ queryKey: getStatsKeys.all });
    },
});
```

The generator deliberately does **not** guess what a mutation invalidates — that is your call, made through the options passthrough. Annotate an endpoint with `@tsclient_hooks = off` to keep it out of the hooks file (the client function is still generated), and use `ImportFrom` if your team routes TanStack Query through an internal wrapper module. Generated output is v5 object syntax and compiles under `tsc --strict`.

See [Code Generation → TanStack Query Hooks](/config/codegen#tanstack-query-react-query-hooks) and [example 23](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/23_react_query_hooks).

## 3. Tool Schemas and llms.txt for AI Agents

Since [3.17](/blog/mcp-server-postgresql-ai-tools-npgsqlrest), endpoints annotated with `@mcp` become tools on a `/mcp` endpoint. But MCP is not the only way agents consume tools — a lot of code calls the OpenAI or Anthropic APIs directly and passes a `tools` array. That schema was already built; it just wasn't reachable outside `/mcp`. Now it is:

```jsonc
{
  "NpgsqlRest": {
    "McpOptions": {
      "ToolSchemas": {
        "Enabled": true,
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

Three documents, all projections of the same tool catalog the MCP plugin already maintains:

- **`/tools/openai.json`** — an OpenAI Chat Completions `tools` array, ready to paste into a function-calling request.
- **`/tools/anthropic.json`** — the same tools in Anthropic Messages API form (`name`, `description`, `input_schema`).
- **`/llms.txt`** — a markdown capability document: one section per endpoint with method, URL, description, and parameters, plus links to the OpenAPI document, the `/mcp` endpoint, and the two tools documents.

Because these are projections — not a parallel implementation — everything the MCP catalog already decided is inherited exactly: which parameters are hidden (claim-sourced, IP, resolved), description precedence, type mapping. A few properties matter in practice:

- **They work without MCP.** The documents are generated and served from `@mcp` annotations even when `McpOptions.Enabled` is false — you can ship function-calling schemas without running an MCP endpoint at all.
- **Deterministic output.** Tools are ordered by name, no timestamps — two runs against the same database produce identical bytes, so the files diff cleanly in git.
- **Fail-fast naming.** Tool names are sanitized to the OpenAI function-name form in both JSON documents; two names colliding after sanitization stop startup with an error instead of silently overwriting each other.

See [MCP → Function-calling schemas and llms.txt](/config/mcp#function-calling-schemas-and-llms-txt-toolschemas).

## 4. The HTTP QUERY Method

The recently standardized **HTTP QUERY method** — safe and idempotent like GET, but carrying the request in the body — is now supported across the stack:

```sql
-- sql/search_documents.sql
/*
HTTP QUERY
*/
select id, title
from documents
where title ilike '%' || :query || '%'
limit :top;
```

(A select-only SQL file still defaults to GET — the `HTTP QUERY` annotation opts in.) Every layer treats the method the way its semantics demand: parameters default to the **JSON request body** (that's the whole point of the method), the TypeScript client sends `method: "QUERY"` with a JSON body, the Dart client does the same through `package:http`, the React Query generator maps it to `useQuery` (safe + idempotent = cacheable), and MCP tools get `readOnlyHint: true`, same as GET. The one exception is OpenAPI, which has no `query` operation key until spec 3.2 — QUERY endpoints are skipped there with a logged warning.

## 5. Smaller Things Worth Knowing

- **`OpenApiOptions.SpecVersion`** — the OpenAPI plugin can now emit `openapi: 3.1.1` instead of the default `3.0.3`, for toolchains that require a JSON Schema 2020-12-aligned document. The rest of the document is identical; an invalid value fails fast at startup. See [OpenAPI](/config/openapi).
- **Required environment variables in the default connection string.** The default configuration now reads `Host={!PGHOST};...` — the `{!NAME}` syntax means *required*, so a missing variable fails immediately at startup with `Required environment variable 'PGHOST' (referenced as '{!PGHOST}' in configuration) is not set.` instead of a cryptic downstream host-resolution error. The syntax works in any `ConnectionStrings` entry. See [Connection](/config/connection).

## Where to Start

- [Dart Code Generation](/config/dart-codegen) and [example 22](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/22_dart_client) — the full option reference and a runnable Flutter-ready client.
- [TanStack Query Hooks](/config/codegen#tanstack-query-react-query-hooks) and [example 23](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/23_react_query_hooks) — hooks, key factories, and a consumer component with explicit invalidation.
- [MCP Tool Schemas](/config/mcp#function-calling-schemas-and-llms-txt-toolschemas) — OpenAI/Anthropic `tools` documents and llms.txt.
- The [full changelog](/guide/changelog/v3.20.0) — every option, annotation, and known limit.

---

The thesis of this project has always been that your SQL is the API. Each release just extends where that API can reach: 3.20 hands it to your Flutter app as typed Dart, to your React cache as ready-made hooks, and to any AI agent as a tool catalog it can read — all generated from the SQL files and functions you already wrote.

---
layout: doc
outline: [2, 3]
title: "From SQL to Type-Safe TypeScript: A Walkthrough of NpgsqlRest's Code Generator"
date: "2026-05-01"
titleTemplate: NpgsqlRest
description: "Generate typed fetch modules and TypeScript interfaces directly from PostgreSQL functions. End-to-end type safety, per-endpoint control with @tsclient annotations, and real-world module organization."
head:
  - - meta
    - name: keywords
      content: npgsqlrest typescript codegen, postgresql to typescript, type-safe api client, generate fetch from sql, tsclient annotation, end-to-end type safety, npgsqlrest typescript module
  - - meta
    - property: og:title
      content: "From SQL to Type-Safe TypeScript: NpgsqlRest's Code Generator"
  - - meta
    - property: og:description
      content: "Auto-generate fetch modules and TypeScript interfaces from PostgreSQL functions. End-to-end type safety with declarative @tsclient annotations."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "TypeScript Code Generation Walkthrough"
  - - meta
    - name: twitter:description
      content: "Auto-generate type-safe fetch clients from PostgreSQL functions with NpgsqlRest."
---

# From SQL to Type-Safe TypeScript: A Walkthrough of NpgsqlRest's Code Generator

<p class="blog-meta">
  <span>April 2026</span> ·
  <span class="tag">TypeScript</span>
  <span class="tag">Code Generation</span>
  <span class="tag">Type Safety</span>
  <span class="tag">NpgsqlRest</span>
</p>

NpgsqlRest is **two things at once**.

The first is what it does the moment you start it: connect to PostgreSQL, look at your routines and SQL files, and start serving each one as an HTTP endpoint. **There's no controller code involved** — the routes are wired up dynamically from the database catalog and **live only in memory**. The entire HTTP infrastructure is **configured declaratively, per endpoint**, through SQL comment annotations: `@authorize`, `@cache_profile`, `@rate_limiter`, `@validate`, and dozens more. **SQL is declarative; the infrastructure that exposes it should be too.** Nothing gets written to disk — endpoints exist for as long as the process runs.

The second thing is **genuine code generation**. If you opt in, NpgsqlRest writes a `.ts` file to your project at startup containing typed `fetch()` wrappers and TypeScript interfaces — one per endpoint. That file is **real source code**: you can read it, your IDE indexes it, your bundler compiles it. It's the only artifact NpgsqlRest produces on disk, and it exists purely to give your frontend **compile-time type safety against the live HTTP API**.

Change a SQL function, restart the server, and your frontend **either compiles against the new shape or refuses to build**. No drift, no DTO classes to maintain.

This post covers the TypeScript client generator: what it produces and how to control it per-endpoint with `@tsclient` annotations.

## The Pipeline

**Source:** your PostgreSQL routines and SQL files, plus comment annotations.

**In-memory output (dynamic, runtime):**

- HTTP endpoint that binds request parameters from the URL or body
- Response serialized as JSON
- Declared auth, caching, rate limiting, and validation applied per request

**On-disk output (static, build-time):**

- TypeScript `.ts` file with a `fetch()` wrapper per endpoint
- Typed request and response interfaces
- Consistent error handling shape

Both sides read the same source. The `.ts` file is regular source code: version it in git, or `.gitignore` it and regenerate on every CI build.

::: tip Since 3.19: regenerate on save
Run the dev server with [`--watch`](/config/watch) and the client regenerates on **every change** — save a `.sql` file, or even `create or replace` a function in psql (the database itself is watched), and the TypeScript types update while you're still in the SQL. Combined with `tsc --watch` on the frontend, type drift surfaces in seconds.
:::

## A Minimal Example

Two `.sql` files, taken verbatim from the [examples repository](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/2_static_type_checking_sql_file):

`sql/get-users.sql`:

```sql
-- HTTP GET
select user_id, username, email, active from example_2.users;
```

`sql/get-posts.sql`:

```sql
-- HTTP GET
select u.username, p.content, p.created_at
from example_2.posts p join example_2.users u using(user_id)
where u.active = true
```

Two lines and a query each. The `-- HTTP GET` comment is the only annotation needed — NpgsqlRest reads it on startup, parses the query against the live database to extract column names and types, and registers the endpoint.

Configuration to enable both endpoint discovery and client generation:

```jsonc
{
  "NpgsqlRest": {
    "SqlFileSource": {
      "Enabled": true,
      "FilePattern": "./sql/**/*.sql"
    },
    "ClientCodeGen": {
      "Enabled": true,
      "FilePath": "./src/{0}Api.ts"
    }
  }
}
```

On startup, NpgsqlRest writes `./src/sqlApi.ts`:

```typescript
// autogenerated at 2026-03-31T18:47:10.9822970+02:00

const baseUrl = "";

type ApiError = {status: number; title: string; detail?: string | null};
type ApiResult<T> = {status: number, response: T, error: ApiError | undefined};

interface IGetPostsResponse {
    username: string | null;
    content: string | null;
    createdAt: string | null;
}

interface IGetUsersResponse {
    userId: number | null;
    username: string | null;
    email: string | null;
    active: boolean | null;
}


/**
* SQL file: ./sql/get-posts.sql
*
* @returns {ApiResult<IGetPostsResponse[]>}
*/
export async function getPosts() : Promise<ApiResult<IGetPostsResponse[]>> {
    const response = await fetch(baseUrl + "/api/get-posts", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return {
        status: response.status,
        response: response.ok ? await response.json() as IGetPostsResponse[] : undefined!,
        error: !response.ok && response.headers.get("content-length") !== "0"
            ? await response.json() as ApiError
            : undefined
    };
}

export async function getUsers() : Promise<ApiResult<IGetUsersResponse[]>> {
    /* ...same shape... */
}
```

Four things to notice:

- **Two-line SQL files become full TypeScript clients.** No `CREATE FUNCTION`, no migration to apply, no schema scaffolding. The `.sql` file *is* the endpoint definition.
- **Snake case → camel case.** PostgreSQL's `user_id`, `created_at` become TypeScript's `userId`, `createdAt`.
- **Nullability is preserved.** Every column not declared `NOT NULL` shows up as `T | null`.
- **Every response is wrapped in `ApiResult<T>` (`{ status, response, error }`).** Callers must handle errors explicitly — you cannot accidentally use `users` without checking `status` first.

## End-to-End Type Safety in Action

The frontend imports the generated functions and uses them directly:

```typescript
import { getPosts, getUsers } from "./sqlApi.ts";

async function loadUsers() {
    const { status, response: users, error } = await getUsers();

    if (status !== 200) {
        app.innerHTML = `<p>Error: ${error?.title}</p>`;
        return;
    }

    // Static type checking happens here!
    // If IGetUsersResponse changes (e.g., "username" renamed to "name"),
    // TypeScript will fail the build with: Property 'username' does not exist
    for (const user of users) {
        console.log(user.userId, user.username, user.email);
    }
}
```

If you rename `users.username` to `users.name` in the database, the next server restart re-parses `get-users.sql` against the new schema and rewrites `sqlApi.ts` with the new field name. Your `console.log(user.username)` line — and every other line that touches that field — fails the TypeScript build immediately. The bug is caught **before** the code runs, not after a user sees a blank field.

There is a second, less-obvious payoff here: **the generated client is the cross-stack refactoring tool you've never had**. The TypeScript function `getUsers` is a real symbol — your IDE indexes it like any other. "Find All References" on `getUsers` across your frontend project lists every component that calls the endpoint, no matter how deep it sits in the call tree. Renaming a SQL function and regenerating the client doesn't just *catch* the drift at compile time; it gives you the call graph to fix it deliberately, in advance.

In a conventional ASP.NET Core or FastAPI stack, an interface change made on the database side has to be hand-traced through controllers, DTOs, and API client code, and each layer is another chance for the rename to be applied incompletely. Here the call graph is a single hop — generated function to consumer — and the IDE walks it for you.

Full end-to-end code in [examples/2_static_type_checking_sql_file/src/app.ts](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/2_static_type_checking_sql_file/src/app.ts). For more on catching schema drift, see the [End-to-End Static Type Checking blog post](/blog/end-to-end-static-type-checking-postgresql-typescript).

## Uploads: When the Generated Wrapper Isn't Just `fetch()`

Not every endpoint maps cleanly to a single `fetch()` call. File uploads with progress reporting need `XMLHttpRequest` (which exposes `upload.onprogress`, while `fetch` does not), `FormData`, and an extra parameter for the progress callback. The generator handles this automatically when you mark an endpoint with `@upload`. From [examples/6_image_uploads_sql_file/sql/upload-to-large-object.sql](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/6_image_uploads_sql_file/sql/upload-to-large-object.sql):

```sql
/*
HTTP POST
@upload for large_object
@param $1 _user_id text = null
@param $2 _meta json = null
@check_image = true
*/
with inserted as (
    insert into example_6.uploads (user_id, file_name, content_type, file_size, oid)
    select $1::int, m->>'fileName', m->>'contentType',
           (m->>'size')::bigint, (m->>'oid')::bigint
    from json_array_elements($2) as m
    where (m->>'success')::boolean = true
    returning file_name, content_type, file_size, oid
)
select (...)::example_6.upload_response from json_array_elements($2) as m;
```

The endpoint receives uploaded files, stores each as a PostgreSQL Large Object, and inserts a metadata row. `@upload for large_object` selects the upload backend; `@check_image = true` verifies that uploaded bytes are actually a valid image format before storage.

The generator emits a wrapper that takes a `FileList`, an optional progress callback, and returns the same typed `ApiResult<T>`:

```typescript
export async function uploadToLargeObject(
    files: FileList | null,
    request: IUploadToLargeObjectRequest,
    progress?: (loaded: number, total: number) => void,
): Promise<ApiResult<IUploadToLargeObjectResponse[]>> {
    return new Promise((resolve, reject) => {
        if (!files || files.length === 0) {
            reject(new Error("No files to upload"));
            return;
        }
        const xhr = new XMLHttpRequest();
        if (progress) {
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    progress(event.loaded, event.total);
                }
            }, false);
        }
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve({ status: this.status, response: JSON.parse(this.responseText), error: undefined });
            } else {
                resolve({ status: this.status, response: [], error: JSON.parse(this.responseText) });
            }
        };
        xhr.open("POST", baseUrl + "/api/upload-to-large-object" + parseQuery(request));
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("file", files[i], files[i].name);
        }
        xhr.send(formData);
    });
}
```

From the consumer side, the call is unremarkable — same shape as any other generated function:

```typescript
const response = await uploadToLargeObject(
    files,
    { },
    (loaded, total) => {
        const percent = Math.round((loaded / total) * 100);
        progressBar.style.width = `${percent}%`;
    }
);

if (response.status === 200) {
    console.log("Uploaded:", response.response);
} else {
    console.error("Failed:", response.error);
}
```

You write one SQL file with an `@upload` annotation. You get an `XMLHttpRequest`-based wrapper with progress callbacks, multi-file `FormData` construction, typed response, and consistent error handling — all without touching client-side upload boilerplate yourself.

## Per-Endpoint Control with `@tsclient` Annotations

Some endpoints don't need a TypeScript client. Some need a different module. Some need only the URL but not the fetch wrapper. The [`@tsclient` family of annotations](/annotations/tsclient) covers all three.

### Disable Generation: Binary Endpoints

`@tsclient = false` skips client generation for endpoints that wouldn't be useful as fetch wrappers — typically binary downloads served directly to `<img src>` or browser navigation:

```sql
/*
HTTP GET
@raw
@tsclient = false
@param $1 id int
@define_param mimeType
content_type: {mimeType}
*/
select data from images where id = $1;
```

`@raw` returns the raw `bytea` bytes (no JSON wrapping), `content_type: {mimeType}` sets the response header from the `mimeType` query parameter, and `@tsclient = false` keeps this endpoint out of the generated TypeScript file. The endpoint is fully callable — your frontend just does `<img src="/api/get-image?id=42&mimeType=image/png">` instead of going through a `fetch()` wrapper that would only ever produce a Blob.

For production workloads, storing image bytes directly in a `bytea` column is rarely the best choice — PostgreSQL Large Objects (`lo_create`, `lo_get`) keep the binary data out of the row's TOAST table and can be streamed efficiently. See the full implementation in [examples/6_image_uploads_sql_file/sql/get-image.sql](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/6_image_uploads_sql_file/sql/get-image.sql), which uses `select lo_get($1)` against an `oid` parameter.

### URL-Only: Browser-Navigation Endpoints

`@tsclient_url_only = true` is for endpoints consumed via `<a href>`, `<form action>`, or browser navigation rather than `fetch()` — Excel exports, CSV downloads, file responses. From [examples/14_table_format_sql_file/sql/get-data.sql](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/14_table_format_sql_file/sql/get-data.sql):

```sql
/*
HTTP GET
@authorize
@define_param format text
@define_param excelFileName text
@define_param excelSheet text
@table_format = {format}
@excel_file_name = {excelFileName}
@excel_sheet = {excelSheet}
@tsclient_url_only = true
*/
select * from sales_report;
```

The generator emits the URL builder and request type, but skips the fetch function:

```typescript
export const getDataUrl = (request: IGetDataRequest) =>
    baseUrl + "/api/get-data" + parseQuery(request);

interface IGetDataRequest {
    format: string | null;
    excelFileName?: string | null;
    excelSheet?: string | null;
}
```

Now your frontend can build the URL and assign it to an `<a href>` or `window.location` to trigger a download — no fetch wrapper that would consume the response in JavaScript.

### Module Grouping: Logical Bundles Across Schemas

By default, output files are grouped by source (one `.ts` file per PostgreSQL schema, or one for all SQL files). `@tsclient_module` overrides this to group endpoints by feature instead:

`sql/admin/get-users.sql`:

```sql
-- HTTP GET
-- @tsclient_module = admin
select user_id, username, email from users;
```

`sql/admin/get-roles.sql`:

```sql
-- HTTP GET
-- @tsclient_module = admin
select role_id, name from roles;
```

Both endpoints land in `adminApi.ts` even though they live in separate files (or in different PostgreSQL schemas if you're using functions). Useful when your backend organization doesn't match your frontend organization (feature-per-page).

A real-world example from a production deployment of NpgsqlRest (covered in detail in the [zero-backend-code case study](/blog/case-study-zero-backend-code)): functions in the application's primary PostgreSQL schema are split across roughly a dozen generated modules — one per feature area in the frontend — each tagged with the corresponding `@tsclient_module` annotation. The frontend imports `from "./<feature>Api.ts"`, matching its component structure. The total generated TypeScript surface in that project is around 5,700 lines, regenerated on every dev-mode server restart, maintained by zero humans.

### Other Per-Endpoint Toggles

| Annotation | Effect |
|---|---|
| `@tsclient_status_code = false` | Skip the `{ status, response, error }` wrapper for this one endpoint — return the bare response. |
| `@tsclient_export_url = true` | Export a URL constant for this endpoint even when global `ExportUrls` is `false`. |
| `@tsclient_events = false` | Suppress the `EventSource` parameter for an SSE-enabled endpoint where the consumer doesn't need streaming. |
| `@tsclient_parse_url = true` | Add a `parseUrl` function parameter to allow the caller to transform the URL before fetch (signing, mocking, prefixing). |
| `@tsclient_parse_request = true` | Add a `parseRequest` function parameter to transform the `RequestInit` object (custom headers, signal, credentials). |

See [`@tsclient` reference](/annotations/tsclient) for the full set.

## Scaling Up: Real-World Configuration

For a multi-page SvelteKit / Next.js / Vite app, the recommended pattern is:

```jsonc
{
  "NpgsqlRest": {
    "ClientCodeGen": {
      "Enabled": true,
      "FilePath": "./src/app/api/{0}Api.ts",
      "BySchema": true,
      "CreateSeparateTypeFile": true,
      "ImportBaseUrlFrom": "$lib/urls",
      "ImportParseQueryFrom": "$lib/urls",
      "UseRoutineNameInsteadOfEndpoint": true,
      "ExportUrls": true,
      "ExportEventSources": true,
      "IncludeSchemaInNames": false,
      "DefaultJsonType": "string",
      "HeaderLines": [
        "//",
        "// autogenerated file - do not edit",
        "//"
      ]
    }
  }
}
```

With this configuration:

- One `*Api.ts` (functions) and one `*ApiTypes.d.ts` (interfaces) file per logical module
- `baseUrl` and `parseQuery` come from your own `$lib/urls.ts` — the generated files just `import` them, so your environment-variable-driven base URL stays in one place
- URL constants (`computeUrl()`, `loginUrl()`, etc.) exported alongside the fetch functions, useful for `<a>` tags and library integrations
- `EventSource` factory functions for any `@sse` endpoint — type-safe SSE without boilerplate
- Function names match SQL routine names rather than URL paths, so grep-across-stack works

A typical generated function for an `@sse` endpoint looks like this:

```typescript
export async function computeVisualization(
    request: IComputeVisualizationRequest,
    onMessage?: (message: string) => void,
    id: string | undefined = undefined,
    closeAfterMs = 1000,
    awaitConnectionMs: number | undefined = 0
) : Promise<ApiResult<IComputeVisualizationResponse[]>> {
    const executionId = id ? id : window.crypto.randomUUID();
    let eventSource: EventSource;
    if (onMessage) {
        eventSource = createComputeVisualizationEventSource(executionId);
        eventSource.onmessage = (event: MessageEvent) => onMessage(event.data);
        if (awaitConnectionMs !== undefined) {
            await new Promise(resolve => setTimeout(resolve, awaitConnectionMs));
        }
    }
    try {
        const response = await fetch(computeVisualizationUrl(request), {
            method: "GET",
            headers: { "Content-Type": "application/json", "X-Execution-ID": executionId }
        });
        return {
            status: response.status,
            response: response.ok ? await response.json() as IComputeVisualizationResponse[] : undefined!,
            error: !response.ok && response.headers.get("content-length") !== "0"
                ? await response.json() as ApiError
                : undefined
        };
    } finally {
        if (onMessage) {
            setTimeout(() => eventSource.close(), closeAfterMs);
        }
    }
}
```

The `onMessage` callback streams `RAISE INFO` / `RAISE NOTICE` events from the running PostgreSQL function. The fetch returns the full result set when the function completes. Both happen against a single endpoint — generated automatically from the function's `@sse` annotation.

For all available codegen settings, see the [Code Generation configuration reference](/config/codegen).

## Real-World Workflow: Dev Codegen, Prod No-Codegen

The static-vs-dynamic distinction matters most when you split your configuration. A real production-grade setup looks like this:

**Dev config** (`appsettings.development.json`) — codegen enabled:

```jsonc
{
  "NpgsqlRest": {
    "ClientCodeGen": {
      "Enabled": true,
      "FilePath": "./src/app/api/{0}Api.ts",
      "FileOverwrite": true,
      "BySchema": true,
      "CreateSeparateTypeFile": true,
      "ImportBaseUrlFrom": "$lib/urls",
      "ImportParseQueryFrom": "$lib/urls",
      "UseRoutineNameInsteadOfEndpoint": true,
      "ExportUrls": true,
      "ExportEventSources": true,
      "IncludeSchemaInNames": false,
      "DefaultJsonType": "string",
      "HeaderLines": [
        "//",
        "// autogenerated file - do not edit",
        "//"
      ]
    }
  }
}
```

**Prod config** (`appsettings.json`) — codegen disabled:

```jsonc
{
  "NpgsqlRest": {
    "ClientCodeGen": {
      "Enabled": false
    }
  }
}
```

Production has no need to write `.ts` files — by then, the frontend is a compiled bundle. The generated files exist in your repository (or are produced during CI) and are the *input* to the frontend build, not its output.

### Two Processes, One Tight Loop

The development loop runs two processes in parallel:

```jsonc
// package.json (excerpt)
{
  "scripts": {
    "dev":   "npgsqlrest ./config/appsettings.json ./config/appsettings.development.json",
    "watch": "rollup ./src/app --watch",
    "build": "rollup ./src/app"
  }
}
```

- **`bun run dev`** — boots the NpgsqlRest server. It reads the prod config first, then layers the development config on top (NpgsqlRest accepts multiple config files). Codegen is enabled, so on every restart it rewrites `./src/app/api/*Api.ts` and `./src/app/api/*ApiTypes.d.ts`.
- **`bun run watch`** (in another terminal) — Rollup runs in watch mode. The moment NpgsqlRest rewrites a generated file, Rollup picks up the change and recompiles your frontend. Type errors appear in your terminal and IDE within seconds.

### Managing Change

The day-to-day loop when you need to evolve an endpoint is short:

1. **Update and test the SQL.** Either edit the SQL file directly and run it manually against your dev database, or `CREATE OR REPLACE` the function and let your existing test suite cover it. PostgreSQL functions can be tested with plain `assert` statements inside `DO` blocks — no extra framework needed:

   ```sql
   do $$
   declare _r record;
   begin
       insert into example.users (user_id, username) values (1, 'alice');

       select * into _r from get_user(1);
       assert _r.username = 'alice', 'username should match';
       assert _r.user_id is not null, 'user_id should not be null';

       rollback;
   end;
   $$;
   ```

   No migration step required. Once the function exists on the server with the new signature, you're done with the database side.

2. **Restart NpgsqlRest in dev mode.** That's it. The server re-introspects the catalog, regenerates the `*Api.ts` and `*ApiTypes.d.ts` files, and starts serving the new shape.

3. **Watch the terminal.** Because the generated files just changed and your frontend toolchain is in watch mode, any line in your UI that no longer matches the new types fails type-checking immediately — no need to click around the app to find what broke.

4. **Fix the frontend.** Hand the type errors to your favorite LLM along with the relevant component file and let it patch the calls. The errors are precise (`Property 'username' does not exist on type 'IGetUserResponse'`), so even a small model handles them well.

You never run a manual codegen command. You never run `tsc` against a hand-maintained DTO file. Database is the source, TypeScript enforces the shape, your build is the gate.

### Production: No Codegen, Just the Server

The production Docker image needs the runtime endpoints but not the codegen step. It uses the official NpgsqlRest base image:

```dockerfile
FROM oven/bun:1.3.3-alpine AS base
WORKDIR /app
COPY . ./
RUN bun install --production
RUN bun run build       # Frontend compiled here, including generated .ts files

FROM vbilopav/npgsqlrest:v3.13.0 AS app
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY ./config/appsettings.json ./
EXPOSE 8080
ENTRYPOINT [ "npgsqlrest", "./appsettings.json" ]
```

The production image:

- Builds the frontend in a Bun stage — Rollup compiles the already-checked-in (or CI-generated) `.ts` files into a static bundle.
- Copies the bundle and the production `appsettings.json` (codegen disabled) into the NpgsqlRest base image.
- Boots NpgsqlRest with prod config only. Endpoints are generated dynamically at startup as always; no files are written to disk.

Deploy to Kubernetes via Helm. Codegen never runs in the production cluster — it's a build-time concern, fully separated from the runtime concerns of serving requests.

### What This Means in Practice

The author of the project this configuration comes from — profiled in the [zero-backend-code case study](/blog/case-study-zero-backend-code), which puts the LOC numbers next to an equivalent ASP.NET Core build — describes the experience like this:

> "I am free to focus on my database that it works correctly."

That's the loop NpgsqlRest is designed to enable. The database is the artifact you actually care about. The HTTP layer is generated. The TypeScript client is generated. Both come from the same source. When the database is right, everything downstream is right too — and the build catches it the moment it isn't.

## Workflow Summary

1. **Write a PostgreSQL function** (or SQL file) with a comment annotation describing the endpoint.
2. **Restart NpgsqlRest.** Two things happen on the same startup:
   - The HTTP endpoint is registered in memory and starts serving requests (dynamic, runtime).
   - The corresponding TypeScript wrapper is written to a `.ts` file on disk (static, one-shot).
3. **Import the generated function** in your frontend code. Your build pipeline (Vite, Next.js, `tsc`, esbuild) compiles it like any other source file.
4. **Change the database schema.** Restart. The next run rewrites the `.ts` file. Your frontend's next compile either matches the new shape (build passes) or doesn't (build fails with a precise error).

There is no DTO file to maintain, no OpenAPI spec to keep in sync, no runtime validation library configured at three layers. The database is the source of truth, the endpoint generator translates it to HTTP at runtime, and the client generator translates it to TypeScript at build time. Both translations come from the same catalog read.

<BlogNav
  :get-started="[
    { text: 'Code Generation Configuration', href: '/config/codegen' },
    { text: '@tsclient Annotation Reference', href: '/annotations/tsclient' },
    { text: 'Static Type Checking Example (SQL files)', href: 'https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/2_static_type_checking_sql_file' },
    { text: 'End-to-End Type Checking Blog', href: '/blog/end-to-end-static-type-checking-postgresql-typescript' },
    { text: 'Quick Start Guide', href: '/guide/quick-start' }
  ]"
/>

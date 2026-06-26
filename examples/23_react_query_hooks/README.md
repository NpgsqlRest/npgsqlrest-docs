# Example 23: TanStack Query (React Query) Hooks Generation

Generate TanStack Query v5 hooks alongside the TypeScript client, using the `ClientCodeGen.ReactQuery` options (version 3.20.0+).

## What it shows

- `ReactQuery` configuration ([config.json](config.json)): hooks output path, `QueryKeyPrefix` namespacing every query key.
- Three endpoint shapes ([sql_23](sql_23/R__example_23_react_query_hooks.sql)):
  - `search_todos` — GET with query-string parameters → `useSearchTodos(request, options?)` with an exported key factory (`all` + `byRequest`); the whole request object is a query-key segment, so changing it re-fetches automatically.
  - `get_stats` — parameterless GET → `useGetStats(options?)` with an `all`-only key factory.
  - `create_todo` — POST → `useCreateTodoMutation(options?)`; no key factory, no automatic invalidation.
  - `internal_recalculate` — annotated `tsclient_hooks=off`: present in the client module, absent from the hooks module.
- The generated output ([src/example23Api.ts](src/example23Api.ts), [src/example23Hooks.ts](src/example23Hooks.ts)): hooks derive types from the client functions (`Parameters<typeof fn>[0]` / `Awaited<ReturnType<typeof fn>>`), so nothing depends on exported type names.
- Consuming the hooks ([src/TodoPanel.tsx](src/TodoPanel.tsx)), including explicit cache invalidation through the exported key factories in the mutation's `onSuccess`.

## Run it

From this directory:

```console
bun run db:up        # apply the example_23 schema migration
bun run dev          # start the server (regenerates client + hooks on startup)
bun run watch        # or start in watch mode
```

Type-check the generated client, hooks and the consumer component:

```console
bun run check        # bun install && tsc --noEmit (strict)
```

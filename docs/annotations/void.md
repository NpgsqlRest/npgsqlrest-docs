---
outline: [2, 3]
title: "VOID Annotation"
titleTemplate: NpgsqlRest
description: "Force an endpoint to return 204 No Content. Execute all statements for side effects without returning a JSON response."
head:
  - - meta
    - name: keywords
      content: npgsqlrest void annotation, no content response, 204 response, side effect endpoint, void endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest VOID Annotation"
  - - meta
    - property: og:description
      content: "Force an endpoint to return 204 No Content."
  - - meta
    - property: og:type
      content: article
---

# VOID

::: info Also known as
`void_result` (with or without `@` prefix)
:::

Force an endpoint to return **204 No Content** instead of a JSON response. All statements are executed for side effects only.

Available since version 3.12.0.

## Syntax

```
@void
@void_result
```

## Examples

### Multi-Command Side Effects

Useful when all statements are side-effect-only (e.g., `set_config` calls followed by a `DO` block):

```sql
/* HTTP POST
@void
@param $1 message_text text
@param $2 _user_id text = null
*/
select set_config('app.message', $1, true);
select set_config('app.user_id', $2, true);
do $$ begin
    insert into messages (user_id, text)
    values (current_setting('app.user_id')::int, current_setting('app.message'));
end; $$;
```

Without `@void`, this returns `{"result1":"...","result2":"...","result3":-1}`. With `@void`, it returns 204 No Content.

This eliminates the need to add `@skip` to every individual statement.

### Single-Command Void

Also works on single-command endpoints:

```sql
-- HTTP POST
-- @void
-- @param $1 key text
-- @param $2 value text
select set_config($1, $2, true);
```

### Function Endpoints

Works on function and procedure endpoints too:

```sql
comment on function process_data(int) is '
HTTP POST
void
';
```

## Behavior

- All statements are executed normally via `ExecuteNonQuery`
- The response status is **204 No Content** with an empty body
- No JSON wrapping, no result keys, no rows-affected counts
- Works on all endpoint types: functions, procedures, CRUD, and SQL file endpoints
- For multi-command SQL files, all statements execute sequentially — if any fails, the request fails

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [SKIP](./skip) - Exclude individual commands from multi-command results
- [RAW](./raw) - Raw text output mode

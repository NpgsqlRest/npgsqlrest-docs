---
outline: [2, 3]
title: "ALLOW_ANONYMOUS Annotation"
titleTemplate: NpgsqlRest
description: "Allow unauthenticated access to specific PostgreSQL REST API endpoints. Override global authorization requirements."
head:
  - - meta
    - name: keywords
      content: npgsqlrest allow anonymous, public endpoint, unauthenticated access, anonymous api, public api endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest ALLOW_ANONYMOUS Annotation"
  - - meta
    - property: og:description
      content: "Allow unauthenticated access to specific endpoints, overriding global authorization."
  - - meta
    - property: og:type
      content: article
---

# ALLOW_ANONYMOUS

::: info Also known as
`anonymous`, `allow_anon`, `anon` (with or without `@` prefix)
:::

Allow unauthenticated access to the endpoint, overriding the global `RequiresAuthorization` setting.

## Syntax

```
@allow_anonymous
```

## Examples

### Public Endpoint

```sql
create function get_public_info()
returns json
language sql
begin atomic;
select '{"version": "1.0"}'::json;
end;

comment on function get_public_info() is
'HTTP GET
@allow_anonymous';
```

### Short Form

```sql
comment on function health_check() is
'HTTP GET
@anon';
```

### Public Read, Protected Write Pattern

```sql
-- Anyone can read
comment on function get_products() is
'HTTP GET
@allow_anonymous';

-- Only authenticated users can create
comment on function create_product(text, numeric) is
'HTTP POST
@authorize';
```

## Behavior

- Overrides the global `RequiresAuthorization: true` setting
- Allows requests without authentication tokens
- Useful for public APIs, health checks, and login endpoints

## Related

- [Authentication configuration](../config/auth) - Configure authentication providers
- [NpgsqlRest Options configuration](../config/npgsqlrest) - Configure RequiresAuthorization setting
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [AUTHORIZE](./authorize) - Require authentication
- [LOGIN](./login) - Mark as sign-in endpoint

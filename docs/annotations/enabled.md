---
outline: [2, 3]
title: "ENABLED Annotation"
titleTemplate: NpgsqlRest
description: "Re-enable a PostgreSQL endpoint after a prior @disabled, optionally scoped by routine tag."
head:
  - - meta
    - name: keywords
      content: npgsqlrest enabled, enable endpoint, conditional enable
  - - meta
    - property: og:title
      content: "NpgsqlRest ENABLED Annotation"
  - - meta
    - property: og:description
      content: "Re-enable an endpoint after @disabled, optionally scoped by routine tag."
  - - meta
    - property: og:type
      content: article
---

# ENABLED

Re-enable an endpoint that an earlier `@disabled` would otherwise hide.

::: tip Rarely needed
Endpoints are enabled by default. You only need `@enabled` to *undo* a `@disabled` on a tag-conditional basis. If you've never reached for `@disabled`, you don't need `@enabled` either.
:::

## Keywords

`@enabled`, `enabled`

## Syntax

```
@enabled
@enabled <tag1>, <tag2>, ...
```

- Without tags: enables the endpoint unconditionally.
- With tags: enables only when the routine matches at least one of the listed tags.

The available auto-tags assigned by `RoutineSource` are `function`, `procedure`, `volatile`, `stable`, `immutable`, `other`. SQL file endpoints have no auto-tags.

## Example: disable-by-default, enable for immutable only

```sql
comment on function calculate_total(_items json) is '
HTTP GET
@disabled
@enabled immutable
@cached';
```

The endpoint is disabled by default, but re-enabled when the function is declared `IMMUTABLE`. If you later mark the function `STABLE` or `VOLATILE`, the endpoint disappears without further changes.

## Related

- [DISABLED](./disabled) — hide an endpoint
- [TAGS](./tags) — apply annotations conditionally by routine tag

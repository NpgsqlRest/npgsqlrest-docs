---
outline: [2, 3]
title: "TAGS Annotation"
titleTemplate: NpgsqlRest
description: "Apply annotations conditionally based on routine volatility tags."
head:
  - - meta
    - name: keywords
      content: npgsqlrest tags, conditional annotations, for keyword, volatility scoping
  - - meta
    - property: og:title
      content: "NpgsqlRest TAGS Annotation"
  - - meta
    - property: og:description
      content: "Apply annotations conditionally based on routine volatility tags."
  - - meta
    - property: og:type
      content: article
---

# TAGS

::: info Also known as
`for`, `tags`, `tag` (no `@` prefix needed; `@for` and `@tags` also work)
:::

Apply subsequent annotations only when the routine matches a specific volatility or routine-type tag.

::: tip Rarely needed
Most projects never use this. Reach for it only when a single comment needs to behave differently depending on the function's volatility — and even then, putting the annotations directly on the specific function is usually clearer.
:::

## Available tags

`RoutineSource` assigns these auto-tags to each function or procedure:

| Tag | Matches |
|---|---|
| `function` | PostgreSQL functions |
| `procedure` | PostgreSQL procedures |
| `volatile` | Functions declared `VOLATILE` (default) |
| `stable` | Functions declared `STABLE` |
| `immutable` | Functions declared `IMMUTABLE` |
| `other` | Procedures (volatility doesn't apply) |

That's the complete list. Custom tags are not supported, and SQL file endpoints have no auto-tags — `for` has no effect on them.

## Syntax

```
for <tag1>, <tag2>, ...
```

Annotations following a `for` line apply only when the routine matches at least one of the listed tags. The scope ends at the next `for` line or at the end of the comment.

## Example: cache only when immutable

```sql
comment on function calculate_hash(_data text) is '
HTTP GET
for immutable
@cached';
```

If the function is later changed to `STABLE` or `VOLATILE`, the `@cached` annotation no longer applies — no other comment changes needed. This is the one pattern where `for` carries its weight.

## Behavior

- Multiple `for` blocks can appear in the same comment; each scopes the annotations that follow it.
- Tag matching is case-insensitive.
- Comma- and space-separated lists are equivalent: `for stable, immutable` ≡ `for stable immutable`.
- Annotations *before* any `for` line apply unconditionally.

## Related

- [DISABLED](./disabled) — hide an endpoint, optionally scoped by tag
- [ENABLED](./enabled) — re-enable an endpoint, optionally scoped by tag

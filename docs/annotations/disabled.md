---
outline: [2, 3]
title: "DISABLED Annotation"
titleTemplate: NpgsqlRest
description: "Disable a PostgreSQL function or procedure as an HTTP endpoint without dropping or modifying the routine itself."
head:
  - - meta
    - name: keywords
      content: npgsqlrest disabled, disable endpoint, hide api endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest DISABLED Annotation"
  - - meta
    - property: og:description
      content: "Disable a function or procedure from being exposed as an HTTP endpoint."
  - - meta
    - property: og:type
      content: article
---

# DISABLED

Hide a routine from being exposed as an HTTP endpoint without dropping or modifying it.

## Keywords

`@disabled`, `disabled`

## Syntax

```
@disabled
```

The endpoint will not be created. The function or procedure remains in the database, callable directly via SQL — only the HTTP exposure is suppressed.

## Example

```sql
comment on function deprecated_func() is '
HTTP
@disabled';
```

`deprecated_func` is not registered as an HTTP endpoint at startup. Useful for:

- Temporarily hiding an endpoint without removing the function
- Keeping a routine that's called internally from other functions but should not be reachable over HTTP
- Disabling old endpoints during a deprecation cycle while leaving the function around for rollback

## Tag-conditional form

```
@disabled <tag1>, <tag2>, ...
```

Disables the endpoint only when the routine matches at least one of the listed tags. The available auto-tags assigned by `RoutineSource` are:

| Tag | Matches |
|---|---|
| `function` | PostgreSQL functions |
| `procedure` | PostgreSQL procedures |
| `volatile` | Functions declared `VOLATILE` (the default) |
| `stable` | Functions declared `STABLE` |
| `immutable` | Functions declared `IMMUTABLE` |
| `other` | Procedures (volatility doesn't apply) |

```sql
-- Disable only if the function is volatile (e.g., to enforce read-only API surface)
comment on function get_data() is '
HTTP GET
@disabled volatile';
```

Custom tags are not supported — only the auto-tags above are available. SQL file endpoints have no auto-tags.

::: tip Most projects don't need the tag form
The unconditional `@disabled` is the form you'll reach for in practice. The tag form is a leftover from earlier versions where the CRUD source assigned per-operation tags (`select`, `insert`, etc.).
:::

## Related

- [ENABLED](./enabled) — re-enable inside a tag-scoped block
- [TAGS](./tags) — apply annotations conditionally by routine tag
- [INTERNAL](./internal) — alternative for marking a routine as internal-only

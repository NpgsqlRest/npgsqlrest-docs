---
outline: [2, 3]
title: "OPENAPI Annotation"
titleTemplate: NpgsqlRest
description: "Per-routine control over OpenAPI document inclusion and grouping. Hide an endpoint from the spec or override its default schema tag."
head:
  - - meta
    - name: keywords
      content: npgsqlrest openapi annotation, hide endpoint from openapi, openapi tag, swagger ui grouping, partner facing openapi, postgresql openapi
  - - meta
    - property: og:title
      content: "NpgsqlRest OPENAPI Annotation"
  - - meta
    - property: og:description
      content: "Per-routine override for OpenAPI document inclusion and section grouping in NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# OPENAPI

::: tip New in 3.15.0
The `@openapi` annotation was added in version 3.15.0.
:::

Per-routine override for OpenAPI document inclusion and section grouping. Two sub-commands: hide an endpoint from the document entirely, or replace its default schema-name tag with one or more custom tags.

The HTTP endpoint itself is unaffected — `@openapi hide` only suppresses the spec entry. The endpoint is still reachable, still respects `@authorize`, still runs the same SQL.

When the [OpenAPI plugin](../config/openapi) is not loaded, both sub-commands are no-ops — safe to leave on a routine regardless of how the host is configured.

## Syntax

```
@openapi                  # hide from document (default action)
@openapi hide             # hide from document
@openapi hidden           # alias for hide
@openapi ignore           # alias for hide

@openapi tag <name>             # replace default schema tag with <name>
@openapi tags <a>, <b>, <c>     # replace default tag with multiple tags
```

Tag values preserve their original casing — `@openapi tag Partner API` produces a `Partner API` tag, not `partner api`.

## How it composes with config-level filters

`@openapi` is the first filter applied — it wins over `IncludeSchemas`, `ExcludeSchemas`, `NameSimilarTo`, `NameNotSimilarTo`, and `RequiresAuthorizationOnly`. See [Filter order](../config/openapi#filter-order) in the OpenAPI config reference.

This means `@openapi hide` reliably keeps a routine out of the document even when broad config filters would otherwise include it (e.g. when `IncludeSchemas` allows the schema).

## Examples

### Hide an internal maintenance routine

```sql
create function refresh_materialized_views()
returns void
language sql security definer as $$
  refresh materialized view concurrently revenue_summary;
  refresh materialized view concurrently user_activity;
$$;

comment on function refresh_materialized_views() is '
HTTP POST
@authorize admin
@openapi hide
';
```

The endpoint stays reachable at `POST /api/refresh-materialized-views` for admin callers — it just isn't advertised in the generated `openapi.json`.

**As a SQL file endpoint** (`sql/refresh-materialized-views.sql`):

```sql
-- HTTP POST
-- @authorize admin
-- @openapi hide
refresh materialized view concurrently revenue_summary;
```

### Group routines under a custom tag

By default, endpoints are tagged with their schema name — every routine in `public` lands in a `public` section in Swagger UI / ReDoc. `@openapi tag` overrides that.

```sql
comment on function partner_get_orders(_partner_id text) is '
HTTP GET /api/partner/orders
@authorize partner
@openapi tag Partner API
';

comment on function partner_create_order(_partner_id text, _order_json text) is '
HTTP POST /api/partner/orders
@authorize partner
@openapi tag Partner API
';
```

Both endpoints group under a single `Partner API` section in Swagger UI instead of the default `public` tag.

### Multiple tags

```sql
comment on function get_dashboard_summary() is '
HTTP GET /api/dashboard
@authorize
@openapi tags Dashboard, Reports
';
```

The endpoint appears in both the `Dashboard` and `Reports` sections.

### Hide alongside a config filter

`@openapi hide` is checked **before** `IncludeSchemas` etc., so even when broad filters would include the routine, `@openapi hide` keeps it out:

```json
{
  "NpgsqlRest": {
    "OpenApiOptions": {
      "IncludeSchemas": ["partner"]
    }
  }
}
```

```sql
-- Lives in partner schema, but marked hidden — won't appear in the partner document.
comment on function partner.diagnostic_check() is '
HTTP GET /api/partner/_diagnostic
@authorize partner
@openapi hide
';
```

## Recognized keywords

| Form | Action |
| --- | --- |
| `@openapi` | Hide from document |
| `@openapi hide` | Hide from document |
| `@openapi hidden` | Hide from document |
| `@openapi ignore` | Hide from document |
| `@openapi tag <name>` | Replace default tag with `<name>` |
| `@openapi tags <a>, <b>` | Replace default tag with multiple tags |

## Related

- [OpenAPI Configuration](../config/openapi) - Document-level filters, security schemes, server entries
- [tags annotation](./tags) - Tag-based annotation filtering (different from OpenAPI tags)
- [authorize annotation](./authorize) - Used by `RequiresAuthorizationOnly` config filter
- [Comment Annotations Guide](../guide/annotations) - How annotations work

---
outline: [2, 3]
title: "NESTED Annotation"
titleTemplate: NpgsqlRest
description: "Serialize composite type columns as nested JSON objects instead of expanding fields. Control JSON structure for PostgreSQL composite types."
head:
  - - meta
    - name: keywords
      content: npgsqlrest nested json, composite type json, postgresql nested object, json serialization, composite column
  - - meta
    - property: og:title
      content: "NpgsqlRest NESTED Annotation"
  - - meta
    - property: og:description
      content: "Serialize composite type columns as nested JSON objects instead of expanding fields."
  - - meta
    - property: og:type
      content: article
---

# NESTED

::: info Also known as
`nested_json`, `nested_composite` (with or without `@` prefix)
:::

Serialize composite type columns as nested JSON objects instead of expanding their fields into separate columns.

## Syntax

```
@nested
```

## Default Behavior vs Nested

When a function returns a composite type column, by default the composite type fields are expanded into separate columns (for backward compatibility).

With the `nested` annotation, composite type columns are serialized as nested JSON objects.

## Examples

### Basic Usage

```sql
create type address_type as (
    street text,
    city text,
    zip_code text
);

create function get_user_with_address()
returns table(
    user_id int,
    user_name text,
    address address_type
)
language sql
begin atomic;
select 1, 'Alice', row('123 Main St', 'New York', '10001')::address_type;
end;

comment on function get_user_with_address() is 'HTTP GET
@nested';
```

**Default behavior (without `@nested`):**
```json
[{"userId":1,"userName":"Alice","street":"123 Main St","city":"New York","zipCode":"10001"}]
```

**With `@nested` annotation:**
```json
[{"userId":1,"userName":"Alice","address":{"street":"123 Main St","city":"New York","zipCode":"10001"}}]
```

### Multiple Composite Columns

```sql
create type contact_info as (
    email text,
    phone text
);

create type location as (
    lat numeric,
    lng numeric
);

create function get_business()
returns table(
    id int,
    name text,
    contact contact_info,
    coords location
)
language sql
begin atomic;
select 1, 'Acme Corp',
       row('info@acme.com', '555-1234')::contact_info,
       row(40.7128, -74.0060)::location;
end;

comment on function get_business() is 'HTTP GET
@nested';
```

Response:
```json
[{
    "id": 1,
    "name": "Acme Corp",
    "contact": {"email": "info@acme.com", "phone": "555-1234"},
    "coords": {"lat": 40.7128, "lng": -74.0060}
}]
```

## Global Configuration

Instead of adding the annotation to each function, you can enable nested JSON globally via configuration:

```json
{
  "NpgsqlRest": {
    "NestedJsonForCompositeTypes": true
  }
}
```

When enabled globally, all composite type columns will be serialized as nested JSON objects by default, without requiring the annotation.

## Behavior

- Only affects composite type columns in the result set
- Does not affect arrays of composite types (those are automatically serialized as JSON arrays)
- Works with custom composite types (`CREATE TYPE`) and table types
- NULL composite values are serialized as `null` in JSON

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [NpgsqlRest Options](../config/npgsqlrest) - Configuration options including `NestedJsonForCompositeTypes`

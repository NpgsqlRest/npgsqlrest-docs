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

### Deep Nested Composite Types

When composite types contain other composite types (or arrays of composites), the inner composites are also serialized as proper JSON objects by default:

```sql
create type inner_type as (id int, name text);
create type outer_type as (label text, inner_val inner_type);

create function get_nested_data()
returns table(data outer_type)
language sql
begin atomic;
select row('outer', row(1, 'inner')::inner_type)::outer_type;
end;

comment on function get_nested_data() is 'HTTP GET
@nested';
```

Response:
```json
[{"data": {"label": "outer", "innerVal": {"id": 1, "name": "inner"}}}]
```

This works to any nesting depth. Deep resolution is controlled by the `ResolveNestedCompositeTypes` option (default: `true`). See [Routine Options](../config/routine-options#resolve-nested-composite-types) for details and when you might want to disable it.

### Arrays of Composite Types

Arrays of composite types are automatically serialized as JSON arrays of objects — this happens regardless of the `@nested` annotation:

```sql
create type book_item as (book_id int, title text);

create function get_books()
returns table(author text, books book_item[])
language sql
begin atomic;
select 'Orwell', array[row(1, '1984')::book_item, row(2, 'Animal Farm')::book_item];
end;

comment on function get_books() is 'HTTP GET';
```

Response:
```json
[{"author": "Orwell", "books": [{"bookId": 1, "title": "1984"}, {"bookId": 2, "title": "Animal Farm"}]}]
```

The `@nested` annotation specifically controls whether **single composite type columns** are serialized as nested objects or expanded into flat fields.

## Global Configuration

Instead of adding the annotation to each endpoint, you can enable nested JSON globally via configuration. Each endpoint source has its own independent setting:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "NestedJsonForCompositeTypes": true
    },
    "SqlFileSource": {
      "NestedJsonForCompositeTypes": true
    }
  }
}
```

When enabled globally, all composite type columns from the respective endpoint source will be serialized as nested JSON objects by default, without requiring the annotation.

## Behavior

- Only affects composite type columns in the result set — controls whether their fields are expanded flat or kept as nested JSON objects
- Arrays of composite types are always automatically serialized as JSON arrays of objects (independent of this annotation)
- Works with custom composite types (`CREATE TYPE`) and table types
- NULL composite values are serialized as `null` in JSON
- Deep nesting (composites inside composites) is resolved to any depth by default via `ResolveNestedCompositeTypes`

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Routine Options](../config/routine-options) - `NestedJsonForCompositeTypes` and `ResolveNestedCompositeTypes` for functions/procedures
- [SQL File Source](../config/sql-file-source) - `NestedJsonForCompositeTypes` for SQL file endpoints
- [Custom Types and Multiset for Nested JSON](../blog/custom-types-multiset-rest-api) - In-depth blog post with real-world examples including multiset patterns

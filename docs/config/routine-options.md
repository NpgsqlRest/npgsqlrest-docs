---
outline: [2, 3]
title: "Routine Options"
titleTemplate: NpgsqlRest
description: "Configure PostgreSQL routine handling in NpgsqlRest. Filter by language, handle custom types, and control function/procedure endpoint generation."
head:
  - - meta
    - name: keywords
      content: npgsqlrest routines, postgresql functions api, stored procedures rest, plpgsql api, custom type parameters
  - - meta
    - property: og:title
      content: "NpgsqlRest Routine Options"
  - - meta
    - property: og:description
      content: "Configure PostgreSQL function and procedure handling for REST API endpoints."
  - - meta
    - property: og:type
      content: article
---

# Routine Options

Options for handling PostgreSQL routines (functions and procedures).

## Overview

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "Enabled": true,
      "CustomTypeParameterSeparator": null,
      "IncludeLanguages": null,
      "ExcludeLanguages": null,
      "NestedJsonForCompositeTypes": false,
      "ResolveNestedCompositeTypes": true,
      "ReadMetadataFromConnections": null,
      "VerifyRoutedEndpoints": "None"
    }
  }
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Enable endpoint creation from PostgreSQL functions and procedures. Set to `false` for SQL-files-only deployments. |
| `CustomTypeParameterSeparator` | string | `null` | Separator for custom type parameter names. Uses underscore (`_`) if `null`. |
| `IncludeLanguages` | array | `null` | List of routine language names to include. Includes all if `null`. Case-insensitive. |
| `ExcludeLanguages` | array | `null` | List of routine language names to exclude. Excludes `C` and `INTERNAL` if `null`. Case-insensitive. |
| `NestedJsonForCompositeTypes` | bool | `false` | When `true`, composite type columns in return tables are serialized as nested JSON objects instead of flat structure. |
| `ResolveNestedCompositeTypes` | bool | `true` | When `true`, nested composite types are resolved to any depth, serializing inner composites as proper JSON objects/arrays instead of PostgreSQL tuple strings. |
| `ReadMetadataFromConnections` | array | `null` | Per-connection routine discovery (3.21.0+): list of `ConnectionStrings` names to read routine metadata from — one source per name, and endpoints execute on the connection they were discovered from (`@connection` annotation wins). The list replaces the default (include the main connection's name to keep it); setting it implicitly enables multiple connections. `null` = single discovery connection (previous behavior). See [Connection Settings](./connection#per-connection-routine-discovery-3-21-0). |
| `VerifyRoutedEndpoints` | string | `"None"` | Startup verification for routines routed by `@connection` to a different connection than they were discovered on (3.21.0+): `None`, `Warn` (log each missing routine), or `Fail` (stop startup). Checks content (routine existence), unlike `ConnectionSettings.TestConnectionStrings` which checks connectivity. See [Connection Settings](./connection#routed-endpoint-verification-3-21-0). |

## Custom Type Parameter Separator

When using custom types for parameters, field names are merged with the parameter name:

```sql
create type custom_type1 as (value text);

create function my_func(_p custom_type1) ...
```

With default separator (`_`), the parameter name becomes `_p_value`.

To use a different separator:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "CustomTypeParameterSeparator": "."
    }
  }
}
```

This would result in `_p.value` instead.

## Language Filtering

By default, routines written in `C` and `INTERNAL` are excluded for security reasons. You can customize which languages are included or excluded.

### Include Specific Languages

To only expose routines written in specific languages:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "IncludeLanguages": ["plpgsql", "sql"]
    }
  }
}
```

### Exclude Additional Languages

To exclude additional languages beyond the defaults:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "ExcludeLanguages": ["C", "INTERNAL", "plpython3u"]
    }
  }
}
```

### Common PostgreSQL Languages

| Language | Description |
|----------|-------------|
| `sql` | Plain SQL functions |
| `plpgsql` | PL/pgSQL procedural language |
| `plpython3u` | PL/Python (untrusted) |
| `plperl` | PL/Perl |
| `pltcl` | PL/Tcl |
| `C` | C language (excluded by default) |
| `INTERNAL` | Internal PostgreSQL functions (excluded by default) |

## Nested JSON for Composite Types

When returning composite types from functions, by default the fields are flattened into the parent object. Enable `NestedJsonForCompositeTypes` to preserve the nested structure.

**Example function:**

```sql
create type address_type as (street text, city text, zip_code text);

create function get_user_with_address()
returns table(user_id int, user_name text, address address_type)
language sql
begin atomic;
  select 1, 'Alice', row('123 Main St', 'New York', '10001')::address_type;
end;
```

**Default output (`NestedJsonForCompositeTypes: false`):**

```json
[{"userId": 1, "userName": "Alice", "street": "123 Main St", "city": "New York", "zipCode": "10001"}]
```

**With `NestedJsonForCompositeTypes: true`:**

```json
[{"userId": 1, "userName": "Alice", "address": {"street": "123 Main St", "city": "New York", "zipCode": "10001"}}]
```

To enable globally:

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "NestedJsonForCompositeTypes": true
    }
  }
}
```

For per-endpoint control, use the [`@nested` annotation](../annotations/nested).

::: tip
This setting applies to function/procedure endpoints. SQL file endpoints have their own independent `NestedJsonForCompositeTypes` setting in [SQL File Source configuration](./sql-file-source#nestedjsonforcompositetypes).
:::

## Resolve Nested Composite Types

By default, NpgsqlRest resolves nested composite types to any depth. When a composite type contains another composite type (or an array of composites), the inner composites are serialized as proper JSON objects/arrays instead of PostgreSQL tuple strings.

**Example:**

```sql
create type inner_type as (id int, name text);
create type outer_type as (label text, inner_val inner_type);
create type with_array as (group_name text, members inner_type[]);

create function get_nested_data()
returns table(data outer_type, items with_array)
language sql
begin atomic;
select
    row('outer', row(1, 'inner')::inner_type)::outer_type,
    row('group1', array[row(1,'a')::inner_type, row(2,'b')::inner_type])::with_array;
end;
```

**Output:**
```json
[{
  "data": {"label":"outer","innerVal":{"id":1,"name":"inner"}},
  "items": {"groupName":"group1","members":[{"id":1,"name":"a"},{"id":2,"name":"b"}]}
}]
```

**Configuration:**

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "ResolveNestedCompositeTypes": true
    }
  }
}
```

**Default:** `true` - nested composites are fully resolved.

**How it works:**

At application startup, when `ResolveNestedCompositeTypes` is enabled:

1. **Type Cache Initialization**: Queries `pg_catalog` to build a cache of all composite types in the database, including their field names, field types, and nested relationships.

2. **Metadata Enrichment**: For each routine that returns composite types, the field descriptors are enriched with nested type information from the cache.

3. **Runtime Serialization**: During request processing, the serializer checks each field's metadata. If the field is marked as a composite type (or array of composites), it recursively parses the PostgreSQL tuple string and outputs a proper JSON object/array.

**When to disable (`ResolveNestedCompositeTypes: false`):**

| Scenario | Reason |
|----------|--------|
| **Large schemas with thousands of composite types** | Reduces startup time by skipping the type cache initialization query |
| **No nested composites in your schema** | If your composites don't contain other composites, the cache provides no benefit |
| **Memory-constrained environments** | The type cache consumes memory proportional to the number of composite types |
| **Backward compatibility** | If you depend on the old tuple string format `"(1,x)"` in your client code |

**Performance considerations:**

- **Startup cost**: One additional query to `pg_catalog` at startup to build the type cache
- **Memory**: Cache size is proportional to: (number of composite types) × (average fields per type)
- **Runtime**: Negligible - just a dictionary lookup per composite field

## Complete Example

```json
{
  "NpgsqlRest": {
    "RoutineOptions": {
      "CustomTypeParameterSeparator": "_",
      "IncludeLanguages": ["plpgsql", "sql"],
      "ExcludeLanguages": null,
      "NestedJsonForCompositeTypes": false,
      "ResolveNestedCompositeTypes": true
    }
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Parent configuration options
- [Authentication Options](./authentication-options) - Per-endpoint authentication

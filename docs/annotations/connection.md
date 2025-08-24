---
outline: [2, 3]
title: "CONNECTION Annotation"
titleTemplate: NpgsqlRest
description: "Route PostgreSQL REST API endpoints to specific database connections. Use different databases per endpoint."
head:
  - - meta
    - name: keywords
      content: npgsqlrest connection, named connection, multiple databases, database routing, connection per endpoint
  - - meta
    - property: og:title
      content: "NpgsqlRest CONNECTION Annotation"
  - - meta
    - property: og:description
      content: "Route endpoints to specific database connections for multi-database setups."
  - - meta
    - property: og:type
      content: article
---

# CONNECTION

::: info Also known as
`connection_name` (with or without `@` prefix)
:::

Specify a named database connection for the endpoint.

## Syntax

```
@connection <connection-name>
@connection_name <connection-name>
```

## Examples

### Use Named Connection

```sql
comment on function get_analytics() is
'HTTP GET
@connection analytics_db';
```

### Reporting Database

```sql
comment on function generate_report() is
'HTTP GET
@connection_name reporting';
```

### Read Replica

```sql
comment on function read_heavy_query() is
'HTTP GET
@connection read_replica';
```

## Behavior

- References a connection string defined in `ConnectionStrings` configuration
- Allows different endpoints to use different databases
- Requires `UseMultipleConnections: true` in NpgsqlRest options
- See [Connection Settings](../config/connection) configuration

## Related

- [Connection configuration](../config/connection) - Configure database connections
- [NpgsqlRest Options configuration](../config/npgsqlrest) - Enable multiple connections
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [COMMAND_TIMEOUT](./command-timeout) - Set query timeout

## See Also

- [Connection Settings](/config/connection) - Configure database connections

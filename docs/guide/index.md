---
outline: [2, 3]
title: "NpgsqlRest Overview"
titleTemplate: NpgsqlRest
description: "NpgsqlRest is a production-ready web server that automatically transforms PostgreSQL databases into REST APIs. Auto-generate endpoints from SQL files, functions, tables, and views."
head:
  - - meta
    - name: keywords
      content: npgsqlrest, postgresql rest api, automatic api generation, postgresql to rest, sql rest api, postgresql web server
  - - meta
    - property: og:title
      content: "NpgsqlRest - Automatic PostgreSQL REST API Server"
  - - meta
    - property: og:description
      content: "Production-ready web server that automatically transforms PostgreSQL databases into REST APIs."
  - - meta
    - property: og:type
      content: article
---

# Overview

NpgsqlRest is a **production-ready**, standalone **web server** that automatically transforms your PostgreSQL database into a REST API. It provides:

- **Automatic HTTP REST endpoints** from SQL files, functions, procedures, tables, and views
- **SQL files as endpoints** — write plain `.sql` files containing PostgreSQL commands and get REST endpoints automatically
- **Code generation** for JavaScript/TypeScript client libraries
- **Code generation** for [HTTP files](https://www.google.com/search?q=http+files&oq=http+files&gs_lcrp=EgRlZGdlKgYIABBFGDkyBggAEEUYOTIGCAEQRRg8MgYIAhBFGDzSAQgxNTI4ajBqMagCALACAA&sourceid=chrome&ie=UTF-8) for a simple way to quickly invoke and TEST your API.
- **Declarative configuration** using SQL comments and annotations

To get started, you need:
- A **PostgreSQL database** for metadata and endpoint specifications
- **Configuration** via JSON files, environment variables, or command line arguments

## Declarative Approach

NpgsqlRest uses SQL comment annotations to configure API endpoints declaratively. This approach keeps your API configuration close to your SQL logic.

NpgsqlRest creates REST endpoints from two types of sources:

### Plain SQL Script Files

Place `.sql` files containing PostgreSQL commands in a directory, and NpgsqlRest creates REST endpoints automatically. Parameter types and return columns are inferred via PostgreSQL's wire protocol — no functions needed:

```sql
-- sql/get_users.sql
-- HTTP GET
-- @authorize admin
-- @cached
-- @param $1 department_id
select id, name, email from users where department_id = $1;
```

This creates a `GET /api/get-users?department_id=1` endpoint with authorization and caching.

Multi-command SQL files execute multiple statements in a single database round-trip:

```sql
-- sql/process_order.sql
-- HTTP POST
-- @result1 validate
-- @result3 confirm
-- @param $1 order_id
select count(*) from orders where id = $1;
update orders set status = 'processing' where id = $1;
select id, status from orders where id = $1;
```

See the [SQL File Source configuration](/config/sql-file-source) for details.

### PostgreSQL Routines (Functions and Procedures)

NpgsqlRest generates endpoints from PostgreSQL functions and procedures using the built-in `COMMENT` system:

```sql
create function get_user_data(id int)
returns table (name text, email text)
language sql
begin atomic;
select name, email from users where users.id = get_user_data.id;
end;

comment on function get_user_data(id int) is '
HTTP GET /admin/get-user-data
@authorize admin
Cache-Control: public, max-age=31536000';
```

This creates a GET endpoint at `/admin/get-user-data` that requires admin authorization and sets cache control headers.

### Tables and Views (CRUD)

NpgsqlRest can also auto-generate CRUD endpoints for PostgreSQL tables and views:

```sql
comment on table users is 'HTTP';
```

This automatically generates REST endpoints for SELECT, INSERT, UPDATE, and DELETE operations on the `users` table. See [CRUD Source configuration](/config/crud) for details.

All three sources generate **HTTP test files** for testing your API and **JavaScript/TypeScript client libraries** with type definitions ready for your frontend.

## Technology & Distribution

NpgsqlRest is built on the latest .NET with the Kestrel web server, compiled using AOT (Ahead-of-Time) compilation for:
- **Zero dependencies** - single executable file
- **Fast startup** - native performance
- **Cross-platform** - runs on Windows, macOS, and Linux

Built on .NET/Kestrel, NpgsqlRest includes all modern web server capabilities out of the box, ensuring enterprise-grade performance and reliability.

NpgsqlRest is **free and open-source**, allowing you to:
- Customize builds for specific platforms
- Modify functionality to meet your needs
- Contribute to the project's development

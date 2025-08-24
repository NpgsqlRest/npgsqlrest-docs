---
outline: [2, 3]
title: "NpgsqlRest Overview"
titleTemplate: NpgsqlRest
description: "NpgsqlRest is a production-ready web server that automatically transforms PostgreSQL databases into REST APIs. Auto-generate endpoints from functions, tables, and views."
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

- **Automatic HTTP REST endpoints** generated from your database metadata
- **Code generation** for JavaScript/TypeScript client libraries
- **Code generation** for [HTTP files](https://www.google.com/search?q=http+files&oq=http+files&gs_lcrp=EgRlZGdlKgYIABBFGDkyBggAEEUYOTIGCAEQRRg8MgYIAhBFGDzSAQgxNTI4ajBqMagCALACAA&sourceid=chrome&ie=UTF-8) for a simple way to quickly invoke and TEST your API.
- **Declarative configuration** using PostgreSQL comments

To get started, you need:
- A **PostgreSQL database** for metadata and endpoint specifications
- **Configuration** via JSON files, environment variables, or command line arguments

## Declarative Approach

NpgsqlRest uses PostgreSQL's built-in comment system to configure API endpoints directly in your database. This declarative approach keeps your API configuration close to your data structure.

PostgreSQL allows you to attach descriptions to database objects using the `COMMENT` command:

```sql
comment on table users is 
'Stores application user accounts';

comment on function get_user_data(id int) is 
'Gets application user account data';
```

To expose these as HTTP endpoints, simply add the `HTTP` keyword:

```sql
comment on table users is 'HTTP';
comment on function get_user_data(id int) is 'HTTP';
```

This configuration automatically generates:
- **REST endpoints** for CRUD operations on the `users` table
- **HTTP test files** for quickly testing your API
- **JavaScript/TypeScript client libraries** with type definitions ready for your frontend


The parser recognizes keywords at the start of lines, ignoring unrecognized text. This means you can combine human-readable documentation with API configuration:

```sql
comment on table users is 'Stores application user accounts
HTTP';

comment on function get_user_data(id int) is 'Gets application user account data
HTTP';
```

For more control, you can specify detailed endpoint behavior:

```sql
comment on function get_user_data(id int) is 'Gets application user account data
HTTP GET /admin/get-user-data
AUTHORIZE admin
Cache-Control: public, max-age=31536000';
```

This creates a GET endpoint at `/admin/get-user-data` that:
- Requires admin authorization
- Sets cache control headers for performance
- Remains fully readable and maintainable

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

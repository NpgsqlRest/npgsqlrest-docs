---
outline: [2, 3]
title: "Quick Start Guide"
titleTemplate: NpgsqlRest
description: "Get started with NpgsqlRest in minutes. Create your first PostgreSQL REST API endpoint with a simple SQL function and HTTP comment annotation."
head:
  - - meta
    - name: keywords
      content: npgsqlrest quick start, postgresql rest api tutorial, create rest api from postgresql, npgsqlrest getting started, sql to rest api
  - - meta
    - property: og:title
      content: "NpgsqlRest Quick Start Guide"
  - - meta
    - property: og:description
      content: "Get started with NpgsqlRest in minutes. Create your first PostgreSQL REST API endpoint with a simple SQL function."
  - - meta
    - property: og:type
      content: article
---

# Quick Start

This guide walks you through running NpgsqlRest for the first time and creating your first API endpoint. By the end, you'll have a working REST API connected to your PostgreSQL database.

## Prerequisites

Before starting, ensure you have:

- **NpgsqlRest** installed ([Installation Guide](./installation))
- **PostgreSQL** database running (version 13 or later)
- A database with connection credentials

## Step 1: Create Your First Endpoint

NpgsqlRest can create endpoints from plain SQL files or from PostgreSQL functions. **SQL files are the recommended approach** — they're simpler to set up and don't require any database DDL.

### Option A: SQL File (Recommended)

SQL file endpoints need to be enabled in your `appsettings.json` (or create one — see Step 4):

```json
{
  "NpgsqlRest": {
    "SqlFileSource": {
      "Enabled": true,
      "FilePattern": "sql/**/*.sql"
    }
  }
}
```

Then create a `sql/` directory next to the NpgsqlRest executable and add a `.sql` file:

```sql
-- sql/hello.sql
-- HTTP GET
-- @allow_anonymous
select 'Hello, World!' as message;
```

NpgsqlRest will create a `GET /api/hello` endpoint from this file automatically.

### Option B: PostgreSQL Function

Alternatively, create a function directly in your PostgreSQL database:

```sql
create function my_first_function()
returns setof text
language sql
begin atomic;
values ('Hello, World!'), ('This is my first function.'), ('Enjoy coding in SQL!');
end;

comment on function my_first_function() is 'HTTP GET';
```

Note: by default, function endpoints are created only if the function comment contains the `HTTP` keyword. This behavior can be changed in the configuration.

## Step 2: Run NpgsqlRest 

- Add connection string via command line argument `--connectionstrings:default="<npgsql connection string>"` and start NpgsqlRest. This is [Npgsql Connection String Format](https://www.npgsql.org/doc/connection-string-parameters.html), but a simple example looks like this: `Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres`. So, the command line to start NpgsqlRest would look like this:

```
❯ ./npgsqlrest --connectionstrings:default="Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres"                                                                                
[12:32:26.087 INF] Started in 00:00:00.0575787, listening on http://localhost:8080, version 3.0.0.0 [NpgsqlRest]
```

Note: NpgsqlRest supports multiple connection strings and if not configured otherwise, it uses the first available connection string.

Congratulations! NpgsqlRest is now running and connected to your database and our first endpoint is be created automatically. Let's test it.

```bash
❯ curl -i http://localhost:8080/api/my-first-function
HTTP/1.1 401 Unauthorized
Content-Length: 0
Date: Thu, 04 Dec 2025 11:42:27 GMT
Server: Kestrel
```

By default, NpgsqlRest requires authorization. We will fix that in the next step.

## Step 3: Anonymous Endpoint And Verbose Logging

To disable authorization for development purposes we can add anonymous comment annotation to our function:

```sql
comment on function my_first_function() is '
HTTP GET
@anonymous';
```

Alternatively, we can disable authorization requiremnt in command line by adding the following argument `--npgsqlrest:requiresauthorization=false`:

```
❯ ./npgsqlrest --connectionstrings:default="Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres" --npgsqlrest:requiresauthorization=false
[12:47:53.288 INF] Started in 00:00:00.0517179, listening on http://localhost:8080, version 3.0.0.0 [NpgsqlRest]
```

Also, since we are in development mode, let's enable debug logging with `--log:minimallevels:npgsqlrest=debug` to see what is happening under the hood and to make sure our endpoint is created:

```
❯ ./npgsqlrest --connectionstrings:default="Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres" --log:minimallevels:npgsqlrest=debug
[12:49:29.928 DBG] ----> Starting with configuration(s): JsonConfigurationProvider for 'appsettings.json' (Missing), JsonConfigurationProvider for 'appsettings.Development.json' (Missing), CommandLineConfigurationProvider [NpgsqlRest]
[12:49:29.937 DBG] ----> Logging enabled: Console (minimum level: Verbose) [NpgsqlRest]
[12:49:29.937 DBG] Using default as main connection string: Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=******;Application Name=example;Enlist=False;No Reset On Close=True [NpgsqlRest]
[12:49:29.937 DBG] Using connection retry options with strategy: RetrySequenceSeconds=1,3,6,12, ErrorCodes=08000,08003,08006,08001,08004,55P03,55006,53300,57P03,40001 [NpgsqlRest]
[12:49:29.939 DBG] Using EndpointSource PostgreSQL Source [NpgsqlRest]
[12:49:29.939 DBG] Routine caching is disabled. [NpgsqlRest]
[12:49:29.961 DBG] Using DataSource with schema 'public' for metadata queries. [NpgsqlRest]
[12:49:29.998 DBG] Function public.my_first_function mapped to GET /api/my-first-function has set HTTP by the comment annotation to GET /api/my-first-function [NpgsqlRest]
[12:49:29.998 DBG] Function public.my_first_function mapped to GET /api/my-first-function has set ALLOW ANONYMOUS by the comment annotation. [NpgsqlRest]
[12:49:29.999 DBG] Created endpoint GET /api/my-first-function [NpgsqlRest]
[12:49:30.002 INF] Started in 00:00:00.0760485, listening on http://localhost:8080, version 3.0.0.0 [NpgsqlRest]
```

Finally, let's test our endpoint again:

```bash
❯ curl -i http://localhost:8080/api/my-first-function
HTTP/1.1 200 OK
Content-Type: application/json
Date: Thu, 04 Dec 2025 11:47:55 GMT
Server: Kestrel
Transfer-Encoding: chunked

["Hello, World!","This is my first function.","Enjoy coding in SQL!"]
```

Function worked as expected, it returns JSON array of strings, and we have our first NpgsqlRest endpoint!

## Step 4: Create Configuration File

In order to avoid passing command line arguments every time we start NpgsqlRest, let's create a default configuration file.

Create an `appsettings.json` file in your working directory:

```json
{
  // Default connection string to the PostgreSQL database
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres"
  },

  // Logging configuration, use "Debug" level for NpgsqlRest namespace
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Debug"
    }
  },

  // Enable SQL file endpoints (scan sql/ directory recursively)
  "NpgsqlRest": {
    "SqlFileSource": {
      "Enabled": true,
      "FilePattern": "sql/**/*.sql"
    }
  }
}
```

Now you can start NpgsqlRest without any command line arguments:

```
❯ ./npgsqlrest
[12:55:09.738 DBG] ----> Starting with configuration(s): JsonConfigurationProvider for 'appsettings.json' (Optional), JsonConfigurationProvider for 'appsettings.Development.json' (Missing), CommandLineConfigurationProvider [NpgsqlRest]
[12:55:09.750 DBG] ----> Logging enabled: Console (minimum level: Verbose) [NpgsqlRest]
[12:55:09.750 DBG] Using Default as main connection string: Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=******;Application Name=example;Enlist=False;No Reset On Close=True [NpgsqlRest]
[12:55:09.750 DBG] Using connection retry options with strategy: RetrySequenceSeconds=1,3,6,12, ErrorCodes=08000,08003,08006,08001,08004,55P03,55006,53300,57P03,40001 [NpgsqlRest]
[12:55:09.753 DBG] Using EndpointSource PostgreSQL Source [NpgsqlRest]
[12:55:09.753 DBG] Routine caching is disabled. [NpgsqlRest]
[12:55:09.778 DBG] Using DataSource with schema 'public' for metadata queries. [NpgsqlRest]
[12:55:09.817 DBG] Function public.my_first_function mapped to GET /api/my-first-function has set HTTP by the comment annotation to GET /api/my-first-function [NpgsqlRest]
[12:55:09.818 DBG] Created endpoint GET /api/my-first-function [NpgsqlRest]
[12:55:09.821 INF] Started in 00:00:00.0850561, listening on http://localhost:8080, version 3.0.0.0 [NpgsqlRest]
```

## Next Steps

Now that you have NpgsqlRest running:

- [SQL File Source Tutorial](/blog/sql-file-source-rest-api-from-plain-sql) - Complete guide to building REST APIs from plain SQL files
- [SQL File Source Configuration](../config/sql-file-source) - All SQL file source options
- [Comment Annotations Guide](./annotations) - Use SQL comments to configure endpoints
- [Annotations Reference](../annotations/) - Complete reference of all annotations
- [Configuration Reference](../config/) - Complete reference for all configuration options
- [NpgsqlRest Options](../config/npgsqlrest) - Configure endpoint generation and behavior


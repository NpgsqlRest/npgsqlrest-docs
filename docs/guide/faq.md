# FAQ & Troubleshooting

## General

### What is NpgsqlRest?

NpgsqlRest is a self-contained executable that connects to PostgreSQL and automatically creates REST API endpoints from plain SQL script files, database functions, procedures, and tables. No code generation, no ORM — just SQL.

### What PostgreSQL versions are supported?

PostgreSQL 13 through 17 are tested and supported. The feature uses standard `pg_catalog` views that are stable across PostgreSQL versions.

### What .NET version is required?

NpgsqlRest 3.x targets .NET 10. If you're using the standalone executable or Docker image, no .NET installation is required.

### How does NpgsqlRest compare to PostgREST or Supabase?

See the detailed [comparison blog post](/blog/npgsqlrest-vs-postgrest-supabase-comparison) for a full feature-by-feature breakdown.

---

## Installation & Setup

### How do I install NpgsqlRest?

See the [Installation Guide](/guide/installation) for platform-specific instructions. NpgsqlRest is available as a standalone executable, Docker image, or NuGet package.

### How do I connect to my database?

Set the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "default": "Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=postgres"
  }
}
```

See [Connection Settings](/config/connection) for all options.

### Can I use environment variables for configuration?

Yes. Enable `ParseEnvironmentVariables` in the `Config` section and use `{ENV_VAR_NAME}` placeholders in your configuration values. You can also use an `.env` file with the `EnvFile` option.

### What are SQL file endpoints?

SQL file endpoints let you create REST APIs by writing plain `.sql` files containing PostgreSQL commands — no functions or procedures needed. Place SQL files in a directory, and NpgsqlRest automatically creates endpoints with parameter types and return columns inferred via PostgreSQL's wire protocol. See [SQL File Source configuration](/config/sql-file-source).

### Where do I put annotations in SQL files?

Annotations can be placed anywhere in the file as long as they are inside a valid SQL comment — line comments (`--`) or block comments (`/* */`). Position doesn't matter:

```sql
-- These annotations are at the top
-- HTTP GET
-- @authorize admin

select id, name
from users
where active = $1;

-- This annotation is at the bottom — works the same
-- @param $1 active
-- @cached
```

All comments in the file are collected and parsed together, regardless of whether they appear before, between, or after SQL statements. The order of annotations doesn't matter either.

::: tip
If you prefer to keep annotations grouped at the top of the file (header-only), you can set `CommentScope: "Header"` in the [SQL File Source configuration](/config/sql-file-source). Then only comments before the first SQL statement are parsed.
:::

### How does authorization work with SQL file endpoints?

Authorization annotations like `@authorize`, `@allow_anonymous`, `@login`, and `@logout` work exactly the same as with functions — just put them in SQL comments:

```sql
-- sql/admin_reports.sql
-- HTTP GET
-- @authorize admin, manager
select * from admin_reports;
```

To map authenticated user claims to query parameters (like auto-filling the current user's ID), you need to:

1. Use `@user_parameters` to enable claim-to-parameter mapping
2. Rename positional parameters to the claim-mapped names using `@param`

In SQL files, parameters start as `$1`, `$2`, etc. — they don't have names that match claim mappings. The `@param` annotation bridges this gap:

```sql
-- sql/my_orders.sql
-- HTTP GET
-- @authorize
-- @user_parameters
-- @param $1 _user_id
select id, total, status
from orders
where user_id = $1;
```

Here `$1` is renamed to `_user_id`, which matches the default `name_identifier` claim mapping. The authenticated user's ID is automatically injected — the client doesn't send this parameter. This works the same way as having a function parameter named `_user_id`.

See [PARAMETER_RENAME annotation](/annotations/parameter-rename) and [User Parameters annotation](/annotations/user-parameters) for details.

---

## API Endpoints

### My function doesn't appear as an endpoint

Check these common causes:

1. **Schema not included**: By default, only the `public` schema is scanned. Set `SchemaSimilarTo` in [NpgsqlRest Options](/config/npgsqlrest) to include other schemas.
2. **Function is disabled**: Check if there's a `@disabled` annotation on the function.
3. **Insufficient privileges**: The database user must have `EXECUTE` permission on the function and `USAGE` on the schema.
4. **Check logs**: Run with `Debug` log level to see which functions are discovered and why some might be skipped.

### How do I customize the endpoint URL path?

Use the `@path` annotation. Works on both SQL files and functions:

**SQL file:**
```sql
-- sql/my_query.sql
-- HTTP GET
-- @path /custom/path
select * from users;
```

**Function:**
```sql
comment on function my_func() is '
HTTP GET
@path /custom/path
';
```

See [PATH annotation](/annotations/path) for details.

### How do I restrict access to an endpoint?

Use the `@authorize` annotation:

**SQL file:**
```sql
-- sql/admin_data.sql
-- HTTP GET
-- @authorize admin
select * from admin_reports;
```

**Function:**
```sql
comment on function my_func() is '
HTTP GET
@authorize admin';
```

See [AUTHORIZE annotation](/annotations/authorize) and [Authentication config](/config/auth).

---

## Authentication

### What authentication methods are supported?

NpgsqlRest supports:

- **Cookie-based authentication** (ASP.NET Core Identity)
- **JWT Bearer tokens** (industry-standard RFC 7519)
- **Microsoft Bearer tokens** (ASP.NET Core proprietary)
- **Basic Authentication** (HTTP Basic Auth)
- **Passkey/WebAuthn** (FIDO2, passwordless)
- **External OAuth providers** (Google, GitHub, etc.)

All methods can be used simultaneously. See [Authentication config](/config/auth).

### How do I set up JWT authentication?

```json
{
  "Auth": {
    "JwtAuth": true,
    "JwtSecret": "your-secret-key-at-least-32-characters-long",
    "JwtExpireMinutes": 60
  }
}
```

See the [Multiple Auth Schemes blog post](/blog/multiple-auth-schemes-rbac-external-providers) for a complete walkthrough.

---

## Performance

### How do I enable caching?

Use the `@cached` annotation:

**SQL file:**
```sql
-- sql/get_settings.sql
-- HTTP GET
-- @cached
-- @cache_expires_in 5 minutes
select * from app_settings;
```

**Function:**
```sql
comment on function my_func() is '
@cached
@cache_expires_in 5 minutes
';
```

Configure the caching backend (Memory, Redis, or HybridCache) in [Cache Options](/config/cache-options).

### How do I enable response compression?

Enable it in configuration:

```json
{
  "ResponseCompression": {
    "Enabled": true
  }
}
```

See [Response Compression](/config/response-compression).

### How do I set up rate limiting?

Configure rate limiter policies and apply them per-endpoint:

**SQL file:**
```sql
-- sql/expensive_query.sql
-- HTTP POST
-- @rate_limiter_policy bucket
select * from generate_report($1);
```

**Function:**
```sql
comment on function my_func() is '@rate_limiter_policy bucket';
```

See [Rate Limiter config](/config/rate-limiter) and [RATE_LIMITER_POLICY annotation](/annotations/rate-limiter-policy).

---

## Debugging & Logging

### How do I see which endpoints are created and what options they have?

Set the NpgsqlRest log level to `Debug`. This logs every endpoint as it's created, including which annotations were applied (authorization, caching, custom path, etc.):

**In `appsettings.json`:**
```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Debug"
    }
  }
}
```

**Via command line:**
```bash
./npgsqlrest --log:minimallevels:npgsqlrest=debug
```

Example output:
```
[DBG] Function public.get_users mapped to GET /api/get-users has set HTTP by the comment annotation to GET /api/get-users
[DBG] Function public.get_users mapped to GET /api/get-users has set AUTHORIZE by the comment annotation with roles: admin
[DBG] Function public.get_users mapped to GET /api/get-users has set CACHED by the comment annotation.
[DBG] Created endpoint GET /api/get-users
```

This is useful for verifying that your annotations are being picked up correctly, confirming which endpoints exist, and understanding why an endpoint might behave unexpectedly.

### How do I see the actual SQL queries NpgsqlRest runs against PostgreSQL?

Set the NpgsqlRest log level to `Verbose` (also called `Trace`). This logs all metadata queries that NpgsqlRest executes at startup to discover functions, tables, and SQL files — including the full SQL text:

**In `appsettings.json`:**
```json
{
  "Log": {
    "MinimalLevels": {
      "NpgsqlRest": "Verbose"
    }
  }
}
```

**Via command line:**
```bash
./npgsqlrest --log:minimallevels:npgsqlrest=verbose
```

`Verbose` includes everything from `Debug` plus the raw metadata queries. This is helpful when:

- You want to understand exactly what NpgsqlRest queries from `pg_catalog` to discover your database objects
- A function or table isn't being discovered and you need to see the underlying query and its filters
- You're troubleshooting schema or name filtering issues
- You need to verify that the SQL file describe phase (`SchemaOnly`) is working correctly

::: tip
Use `Debug` for day-to-day development — it shows endpoints and annotations without the noise. Switch to `Verbose` only when you need to dig into the metadata discovery layer.
:::

---

## Troubleshooting

### Build error: "Unknown configuration key"

NpgsqlRest validates configuration keys on startup. If you see warnings about unknown keys, you likely have a typo in `appsettings.json`. Run `npgsqlrest --config` to see all valid configuration keys with descriptions.

### Error: "permission denied for schema"

The database user doesn't have `USAGE` permission on the schema. Grant access:

```sql
grant usage on schema my_schema to my_user;
grant execute on all functions in schema my_schema to my_user;
```

### Timeout errors (504 Gateway Timeout)

The default command timeout can be adjusted globally or per-endpoint:

**SQL file:**
```sql
-- sql/slow_report.sql
-- HTTP GET
-- @command_timeout 2 minutes
select * from generate_slow_report();
```

**Function:**
```sql
comment on function slow_func() is '@command_timeout 2 minutes';
```

Or globally in config. See [COMMAND_TIMEOUT annotation](/annotations/command-timeout).

### Encrypted data is unreadable after restart

If using Data Protection encryption on Linux without persistent key storage, keys are stored in memory and lost on restart. Configure persistent storage:

```json
{
  "DataProtection": {
    "Storage": "FileSystem",
    "FileSystemPath": "/var/lib/npgsqlrest/keys"
  }
}
```

See [Data Protection config](/config/data-protection).

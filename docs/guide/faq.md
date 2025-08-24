# FAQ & Troubleshooting

## General

### What is NpgsqlRest?

NpgsqlRest is a self-contained executable that connects to PostgreSQL and automatically creates REST API endpoints from your database functions, procedures, and tables. No code generation, no ORM — just your database schema.

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

---

## API Endpoints

### My function doesn't appear as an endpoint

Check these common causes:

1. **Schema not included**: By default, only the `public` schema is scanned. Set `SchemaSimilarTo` in [NpgsqlRest Options](/config/npgsqlrest) to include other schemas.
2. **Function is disabled**: Check if there's a `disabled` annotation on the function.
3. **Insufficient privileges**: The database user must have `EXECUTE` permission on the function and `USAGE` on the schema.
4. **Check logs**: Run with `Debug` log level to see which functions are discovered and why some might be skipped.

### How do I customize the endpoint URL path?

Use the `PATH` annotation:

```sql
comment on function my_func() is '
HTTP GET
path /custom/path
';
```

See [PATH annotation](/annotations/path) for details.

### How do I restrict access to an endpoint?

Use the `authorize` annotation:

```sql
comment on function my_func() is 'authorize admin';
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

Use the `cached` annotation on your function:

```sql
comment on function my_func() is '
cached
cache_expires_in 5 minutes
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

```sql
comment on function my_func() is 'rate_limiter_policy bucket';
```

See [Rate Limiter config](/config/rate-limiter) and [RATE_LIMITER_POLICY annotation](/annotations/rate-limiter-policy).

---

## Troubleshooting

### Build error: "Unknown configuration key"

NpgsqlRest validates configuration keys on startup. If you see warnings about unknown keys, you likely have a typo in `appsettings.json`. Run `npgsqlrest --config` to see all valid configuration keys with descriptions.

### Error: "permission denied for schema"

The database user doesn't have `USAGE` permission on the schema. Grant access:

```sql
GRANT USAGE ON SCHEMA my_schema TO my_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA my_schema TO my_user;
```

### Timeout errors (504 Gateway Timeout)

The default command timeout can be adjusted globally or per-endpoint:

```sql
-- Per-endpoint
comment on function slow_func() is 'command_timeout 2 minutes';
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

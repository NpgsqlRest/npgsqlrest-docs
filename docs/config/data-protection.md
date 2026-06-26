---
outline: [2, 3]
title: "Data Protection Configuration"
titleTemplate: NpgsqlRest
description: "Configure data protection for NpgsqlRest. Encryption keys, key storage, certificate-based encryption, and PostgreSQL key persistence."
head:
  - - meta
    - name: keywords
      content: npgsqlrest data protection, encryption keys configuration, cookie encryption, antiforgery encryption, key storage postgresql
  - - meta
    - property: og:title
      content: "NpgsqlRest Data Protection Configuration"
  - - meta
    - property: og:description
      content: "Configure encryption keys, storage, and protection for cookies and tokens."
  - - meta
    - property: og:type
      content: article
---

# Data Protection

Data protection settings control encryption and decryption for authentication cookies, antiforgery tokens, and [application-level column encryption](../annotations/encrypt-decrypt) via the `encrypt`/`decrypt` annotations.

## Overview

```json
{
  "DataProtection": {
    "Enabled": false,
    "CustomApplicationName": null,
    "DefaultKeyLifetimeDays": 90,
    "Storage": "Default",
    "FileSystemPath": "./data-protection-keys",
    "GetAllElementsCommand": "select get_data_protection_keys()",
    "StoreElementCommand": "call store_data_protection_keys($1,$2)",
    "EncryptionAlgorithm": null,
    "ValidationAlgorithm": null,
    "KeyEncryption": "None",
    "CertificatePath": null,
    "CertificatePassword": null,
    "DpapiLocalMachine": false
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable data protection. Required for the `@encrypt`/`@decrypt` annotations (the default data protector is created only when enabled). Cookie authentication and antiforgery tokens fall back to ASP.NET Core's built-in data protection when disabled; enable it to control their key storage, lifetime, and encryption. |
| `CustomApplicationName` | string | `null` | Application name for encryption scope. Uses `ApplicationName` if null. Different names cannot decrypt each other's data. |
| `DefaultKeyLifetimeDays` | int | `90` | Number of days before keys are rotated. |
| `Storage` | string | `"Default"` | Key storage location: `"Default"`, `"FileSystem"`, or `"Database"`. |
| `FileSystemPath` | string | `"./data-protection-keys"` | Path for file system storage. |
| `GetAllElementsCommand` | string | `"select get_data_protection_keys()"` | Database command to retrieve all keys. No parameters. Must return a set of rows with a single `text` column containing the key data. |
| `StoreElementCommand` | string | `"call store_data_protection_keys($1,$2)"` | Database command to store a key. Receives two `text` parameters: `$1` is the element name, `$2` is the element data. Does not return anything. |
| `EncryptionAlgorithm` | string | `null` | Encryption algorithm. Uses default if null. |
| `ValidationAlgorithm` | string | `null` | Validation algorithm. Uses default if null. |
| `KeyEncryption` | string | `"None"` | Key encryption method: `"None"`, `"Certificate"`, or `"Dpapi"` (Windows only). |
| `CertificatePath` | string | `null` | Path to X.509 certificate file (.pfx) when using Certificate encryption. |
| `CertificatePassword` | string | `null` | Password for the certificate file (can be null for passwordless certificates). |
| `DpapiLocalMachine` | bool | `false` | When using DPAPI, set to `true` to protect keys to the local machine instead of current user. |

## Storage Options

### Default Storage

```json
{
  "DataProtection": {
    "Storage": "Default"
  }
}
```

Uses the platform's default key storage location.

::: warning Linux Users
On Linux, `Default` storage does not persist keys. When keys are lost on restart, encrypted tokens (authentication cookies) will stop working. Linux deployments should use `FileSystem` or `Database` storage.
:::

### File System Storage

```json
{
  "DataProtection": {
    "Storage": "FileSystem",
    "FileSystemPath": "/var/lib/npgsqlrest/keys"
  }
}
```

Stores keys in the specified directory.

::: tip Docker
When running in Docker, ensure `FileSystemPath` points to a Docker volume to persist keys across container restarts.
:::

### Database Storage

```json
{
  "DataProtection": {
    "Storage": "Database",
    "GetAllElementsCommand": "select get_data_protection_keys()",
    "StoreElementCommand": "call store_data_protection_keys($1,$2)"
  }
}
```

Stores keys in the PostgreSQL database using custom functions. You must create the backing table, function, and procedure yourself. The two commands work as follows:

- **`GetAllElementsCommand`**: Retrieves all stored keys. Takes no parameters. Must return a set of rows with a single `text` column containing the key data.
- **`StoreElementCommand`**: Stores a single key. Receives two `text` parameters: `$1` is the element name (unique identifier), `$2` is the element data (XML key content). Does not return anything.

Example SQL setup:

```sql
create table data_protection_keys (
  name text not null primary key,
  data text not null
);

create function get_data_protection_keys()
returns setof text
security definer
language sql
begin atomic;
select data from data_protection_keys;
end;

create procedure store_data_protection_keys(
  _name text,
  _data text
)
security definer
language sql
begin atomic;
insert into data_protection_keys (name, data)
values (_name, _data)
on conflict (name) do update set data = excluded.data;
end;
```

## Encryption Algorithms

Configure the encryption algorithm for data protection keys:

| Value | Description |
|-------|-------------|
| `null` | Use default algorithm |
| `AES_128_CBC` | AES 128-bit CBC mode |
| `AES_192_CBC` | AES 192-bit CBC mode |
| `AES_256_CBC` | AES 256-bit CBC mode |
| `AES_128_GCM` | AES 128-bit GCM mode |
| `AES_192_GCM` | AES 192-bit GCM mode |
| `AES_256_GCM` | AES 256-bit GCM mode |

```json
{
  "DataProtection": {
    "EncryptionAlgorithm": "AES_256_GCM"
  }
}
```

## Validation Algorithms

Configure the validation algorithm for data protection keys:

| Value | Description |
|-------|-------------|
| `null` | Use default algorithm |
| `HMACSHA256` | HMAC SHA-256 |
| `HMACSHA512` | HMAC SHA-512 |

```json
{
  "DataProtection": {
    "ValidationAlgorithm": "HMACSHA512"
  }
}
```

## Application Name Scope

The `CustomApplicationName` determines the encryption scope. Applications with different names cannot decrypt each other's data:

```json
{
  "DataProtection": {
    "CustomApplicationName": "my-app-production"
  }
}
```

If `null`, uses the top-level `ApplicationName` setting.

## Key Encryption Options

Data protection keys can be encrypted at rest using X.509 certificates or Windows DPAPI for additional security.

### No Encryption (Default)

```json
{
  "DataProtection": {
    "KeyEncryption": "None"
  }
}
```

Keys are stored without additional encryption at rest.

### Certificate Encryption

```json
{
  "DataProtection": {
    "Enabled": true,
    "Storage": "Database",
    "KeyEncryption": "Certificate",
    "CertificatePath": "/path/to/cert.pfx",
    "CertificatePassword": "{CERT_PASSWORD}"
  }
}
```

Encrypts keys using an X.509 certificate. The certificate must be a .pfx file containing both the public and private key.

::: tip Environment Variables
Use environment variable substitution for the certificate password to avoid storing secrets in configuration files.
:::

### DPAPI Encryption (Windows Only)

```json
{
  "DataProtection": {
    "Enabled": true,
    "Storage": "FileSystem",
    "FileSystemPath": "./keys",
    "KeyEncryption": "Dpapi",
    "DpapiLocalMachine": true
  }
}
```

Uses Windows Data Protection API to encrypt keys. Only available on Windows.

| DpapiLocalMachine | Scope |
|-------------------|-------|
| `false` (default) | Keys are protected to the current user account |
| `true` | Keys are protected to the local machine (any user on the machine can decrypt) |

::: warning Windows Only
DPAPI encryption is only available on Windows. On other platforms, use Certificate encryption instead.
:::

## Complete Example

Production configuration with database storage:

```json
{
  "DataProtection": {
    "Enabled": true,
    "CustomApplicationName": null,
    "DefaultKeyLifetimeDays": 90,
    "Storage": "Database",
    "GetAllElementsCommand": "select get_data_protection_keys()",
    "StoreElementCommand": "call store_data_protection_keys($1,$2)",
    "EncryptionAlgorithm": "AES_256_GCM",
    "ValidationAlgorithm": "HMACSHA512"
  }
}
```

Production configuration with file system storage (Docker):

```json
{
  "DataProtection": {
    "Enabled": true,
    "DefaultKeyLifetimeDays": 90,
    "Storage": "FileSystem",
    "FileSystemPath": "/app/keys"
  }
}
```

## Column Encryption with Annotations

Data Protection powers the [`encrypt` and `decrypt` annotations](../annotations/encrypt-decrypt), which provide transparent application-level column encryption. Parameter values are encrypted before being sent to PostgreSQL, and result column values are decrypted before being returned to the API client.

```sql
-- Store with encryption
create function store_secret(_key text, _value text) returns void ...
comment on function store_secret(text, text) is '
HTTP POST
@encrypt _value
';

-- Retrieve with decryption
create function get_secret(_key text) returns table(key text, value text) ...
comment on function get_secret(text) is '
@decrypt value
';
```

**Equivalent as SQL file endpoints**:

```sql
-- sql/store-secret.sql
/*
HTTP POST
@encrypt value
@param $1 key
@param $2 value
*/
insert into secrets (key, value) values ($1, $2)
on conflict (key) do update set value = excluded.value;
```

```sql
-- sql/get-secret.sql
/*
HTTP GET
@decrypt value
@param $1 key
*/
select key, value from secrets where key = $1;
```

The database stores ciphertext; the API consumer sees plaintext. This is useful for storing PII (SSN, medical records, credit card numbers) or other sensitive data that must be encrypted at rest but is only ever looked up by an unencrypted key (e.g., `user_id`).

::: warning Key Persistence Required
If encryption keys are lost, encrypted data is **permanently unrecoverable**. Always use `FileSystem` or `Database` storage in production — never rely on `Default` storage on Linux.
:::

See the [ENCRYPT / DECRYPT annotation reference](../annotations/encrypt-decrypt) for full syntax, behavior notes, and examples.

## Related

- [ENCRYPT / DECRYPT Annotations](../annotations/encrypt-decrypt) - Annotation syntax and examples
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Authentication](./auth) - Configure authentication methods
- [Server & SSL](./server) - Configure HTTPS and Kestrel web server

## See Also

- [ENCRYPT_DECRYPT](/annotations/encrypt-decrypt) - Column encryption and decryption

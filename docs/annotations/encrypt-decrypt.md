---
outline: [2, 3]
title: "ENCRYPT / DECRYPT Annotations"
titleTemplate: NpgsqlRest
description: "Transparent application-level column encryption using ASP.NET Data Protection. Encrypt parameter values before PostgreSQL, decrypt result columns before returning to client."
head:
  - - meta
    - name: keywords
      content: npgsqlrest encrypt, npgsqlrest decrypt, data protection encryption, column encryption postgresql, encrypt parameters, decrypt results
  - - meta
    - property: og:title
      content: "NpgsqlRest ENCRYPT / DECRYPT Annotations"
  - - meta
    - property: og:description
      content: "Transparent column encryption and decryption using ASP.NET Data Protection."
  - - meta
    - property: og:type
      content: article
---

# ENCRYPT / DECRYPT

::: info Also known as
`encrypt`: `encrypted`, `protect`, `protected`
`decrypt`: `decrypted`, `unprotect`, `unprotected`
:::

Transparent application-level column encryption using ASP.NET [Data Protection](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction). Parameter values are encrypted before being sent to PostgreSQL, and result column values are decrypted before being returned to the API client. The database stores ciphertext; the API consumer sees plaintext. No `pgcrypto` or client-side encryption required.

> **Prerequisite**: The `DataProtection` section must be enabled in `appsettings.json` (it is by default). See [Data Protection Configuration](../config/data-protection).

## Encrypt Parameters

### Syntax

```
encrypt [parameter_name, ...]
```

Mark specific parameters to encrypt before they are sent to PostgreSQL:

```sql
create function store_patient_ssn(_patient_id int, _ssn text)
returns void
language plpgsql as $$
begin
    insert into patients (id, ssn) values (_patient_id, _ssn)
    on conflict (id) do update set ssn = excluded.ssn;
end;
$$;
comment on function store_patient_ssn(int, text) is '
HTTP POST
encrypt _ssn
';
```

The client calls `POST /api/store-patient-ssn/` with `{"patientId": 1, "ssn": "123-45-6789"}`. The server encrypts `_ssn` using Data Protection before executing the SQL — the database stores ciphertext like `CfDJ8N...`, never the plaintext SSN.

Use `encrypt` without arguments to encrypt **all** text parameters:

```sql
comment on function store_all_secrets(text, text) is '
HTTP POST
encrypt
';
```

## Decrypt Result Columns

### Syntax

```
decrypt [column_name, ...]
```

Mark specific result columns to decrypt before returning to the client:

```sql
create function get_patient(_patient_id int)
returns table(id int, ssn text, name text)
language plpgsql as $$
begin
    return query select p.id, p.ssn, p.name from patients p where p.id = _patient_id;
end;
$$;
comment on function get_patient(int) is '
decrypt ssn
';
```

The client calls `GET /api/get-patient/?patientId=1`. The `ssn` column is decrypted from ciphertext back to `"123-45-6789"` before being included in the JSON response. The `id` and `name` columns are returned as-is.

Use `decrypt` without arguments to decrypt **all** result columns:

```sql
comment on function get_all_secrets(text) is '
decrypt
';
```

Decrypt also works on scalar (single-value) return types:

```sql
create function get_secret(_id int) returns text ...
comment on function get_secret(int) is 'decrypt';
```

## Full Roundtrip Example

```sql
-- Store with encryption
create function store_secret(_key text, _value text) returns void ...
comment on function store_secret(text, text) is '
HTTP POST
encrypt _value
';

-- Retrieve with decryption
create function get_secret(_key text) returns table(key text, value text) ...
comment on function get_secret(text) is '
decrypt value
';
```

```
POST /api/store-secret/  {"key": "api-key", "value": "sk-abc123"}
GET  /api/get-secret/?key=api-key  →  {"key": "api-key", "value": "sk-abc123"}
```

The value is stored encrypted in PostgreSQL and decrypted transparently on read.

## Behavior

- **NULL values**: NULL parameters are not encrypted (passed as `DBNull`). NULL columns are not decrypted (returned as JSON `null`).
- **Non-text types**: Only `string` parameter values are encrypted. Integer, boolean, and other types are unaffected even when `encrypt` is used without arguments.
- **Decryption failures**: If a column value cannot be decrypted (e.g., it was not encrypted, or keys were rotated/lost), the raw value is returned as-is — no error is thrown.
- **Key rotation**: ASP.NET Data Protection maintains a key ring. Old keys still decrypt old ciphertext. Keys rotate based on `DefaultKeyLifetimeDays` (default: 90 days).
- **Encrypted columns are opaque to PostgreSQL**: The database cannot filter, join, sort, or index on encrypted values. Use encryption only for columns that are written and read back, never queried by content.

## Related

- [Data Protection Configuration](../config/data-protection) - Key storage, rotation, and encryption settings
- [Comment Annotations Guide](../guide/annotations) - How annotations work

## Related Annotations

- [PARAMETER_HASH](./parameter-hash) - Hash password parameters
- [SECURITY_SENSITIVE](./security-sensitive) - Obfuscate parameters in logs

## See Also

- [Data Protection](/config/data-protection) - Configure encryption and key settings

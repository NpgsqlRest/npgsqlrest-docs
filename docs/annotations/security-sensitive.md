---
outline: [2, 3]
title: "SECURITY_SENSITIVE Annotation"
titleTemplate: NpgsqlRest
description: "Mark PostgreSQL REST API endpoints as security-sensitive. Obfuscate passwords and sensitive data in logs."
head:
  - - meta
    - name: keywords
      content: npgsqlrest security sensitive, obfuscate logs, password logging, sensitive data protection, secure logging
  - - meta
    - property: og:title
      content: "NpgsqlRest SECURITY_SENSITIVE Annotation"
  - - meta
    - property: og:description
      content: "Mark endpoints as security-sensitive to obfuscate parameter values in logs."
  - - meta
    - property: og:type
      content: article
---

# SECURITY_SENSITIVE

::: info Also known as
`sensitive`, `security` (with or without `@` prefix)
:::

Mark endpoint as security-sensitive to obfuscate parameter values in logs.

## Syntax

```
@sensitive
```

## Examples

### Password Change Endpoint

```sql
create function change_password(_old_password text, _new_password text)
returns boolean
language sql
begin atomic;
...;
end;

comment on function change_password(text, text) is
'HTTP POST
@authorize
@sensitive';
```

**Equivalent as a SQL file endpoint** (`sql/change-password.sql`):

```sql
/*
HTTP POST
@authorize
@sensitive
@param $1 old_password
@param $2 new_password
*/
update users
set password_hash = crypt($2, gen_salt('bf'))
where id = current_user_id()
  and password_hash = crypt($1, password_hash)
returning true;
```

### Login Endpoint

```sql
create function authenticate(_username text, _password text)
returns json
language sql
begin atomic;
...;
end;

comment on function authenticate(text, text) is
'HTTP POST
@login
@sensitive';
```

### Payment Processing

```sql
create function process_payment(_card_number text, _cvv text, _amount numeric)
returns json
language sql
begin atomic;
...;
end;

comment on function process_payment(text, text, numeric) is
'HTTP POST
@authorize
@security_sensitive';
```

## Behavior

- Parameter values are replaced with `***` in logs
- Helps prevent sensitive data from appearing in log files
- Applies to all parameters of the endpoint

## Related

- [Logging Guide](../guide/logging) — command logging and parameter obfuscation
- [Logging configuration](../config/logging) - Configure logging output
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [AUTHORIZE](./authorize) - Require authentication
- [LOGIN](./login) - Mark as sign-in endpoint

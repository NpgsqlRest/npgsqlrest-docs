---
outline: [2, 3]
title: "VALIDATE Annotation"
titleTemplate: NpgsqlRest
description: "Validate endpoint parameters before database execution. Apply validation rules like NotNull, NotEmpty, Required, Regex, MinLength, and MaxLength to PostgreSQL function parameters."
head:
  - - meta
    - name: keywords
      content: npgsqlrest validate, parameter validation, api input validation, postgresql validation, request validation annotation
  - - meta
    - property: og:title
      content: "NpgsqlRest VALIDATE Annotation"
  - - meta
    - property: og:description
      content: "Validate endpoint parameters before database execution using predefined validation rules."
  - - meta
    - property: og:type
      content: article
---

# VALIDATE

Validate endpoint parameters before database execution. Validation is performed immediately after parameters are parsed, before any database connection is opened, authorization checks, or proxy handling.

## Keywords

`@validate`, `validate`

## Syntax

```
@validate <parameter_name> using <rule_name>
@validate <parameter_name> using <rule1>, <rule2>, <rule3>, ...
```

- `parameter_name` - The parameter to validate. Can use either the original PostgreSQL name (`_email`) or the converted camelCase name (`email`). Matching is case-insensitive.
- `rule_name` - The name of a validation rule defined in [ValidationOptions](../config/validation) configuration.

Multiple rules can be specified as comma-separated values or on separate lines.

## Examples

### Single Rule Validation

```sql
create function get_user(_user_id int)
returns json
language sql
begin atomic;
select row_to_json(u) from users u where id = _user_id;
end;

comment on function get_user(int) is '
HTTP GET
@validate _user_id using not_null
';
```

**Equivalent as a SQL file endpoint** (`sql/get-user.sql`):

```sql
/*
HTTP GET
@validate user_id using not_null
@param $1 user_id int
*/
select row_to_json(u) from users u where id = $1;
```

### Multiple Rules on One Parameter

```sql
create function update_email(_user_id int, _email text)
returns json
language plpgsql
as $$
begin
    update users set email = _email where id = _user_id;
    return json_build_object('success', true);
end;
$$;

comment on function update_email(int, text) is '
HTTP PUT
@validate _user_id using not_null
@validate _email using required, email
';
```

The `_email` parameter must pass both `required` (not null and not empty) and `email` (regex pattern) validation.

### Multiple Parameters

```sql
create function register_user(_email text, _password text, _name text)
returns json
language plpgsql
as $$
begin
    insert into users (email, password_hash, name)
    values (_email, crypt(_password, gen_salt('bf')), _name);
    return json_build_object('success', true);
end;
$$;

comment on function register_user(text, text, text) is '
HTTP POST
@validate _email using required, email
@validate _password using required
@validate _name using not_empty
';
```

### Using Converted Parameter Names

Parameter names can use the converted camelCase format:

```sql
create function create_product(_product_name text, _unit_price numeric)
returns json
language plpgsql
as $$
begin
    insert into products (name, price) values (_product_name, _unit_price);
    return json_build_object('success', true);
end;
$$;

comment on function create_product(text, numeric) is '
HTTP POST
@validate productName using required
@validate unitPrice using not_null
';
```

Both `productName` and `_product_name` refer to the same parameter.

### With Authorization

Validation works alongside other annotations:

```sql
create function update_profile(_user_id int, _bio text, _website text)
returns json
language plpgsql
as $$
begin
    update profiles set bio = _bio, website = _website where user_id = _user_id;
    return json_build_object('success', true);
end;
$$;

comment on function update_profile(int, text, text) is '
HTTP PUT
@authorize
@user_params
@validate _bio using not_empty
';
```

## Default Rules

Four validation rules are available by default without additional configuration:

| Rule Name | Type | Description |
|-----------|------|-------------|
| `not_null` | NotNull | Value cannot be null |
| `not_empty` | NotEmpty | Value cannot be empty string (nulls pass) |
| `required` | Required | Value cannot be null or empty |
| `email` | Regex | Value must match email pattern |

## Custom Rules

Custom validation rules are defined in [ValidationOptions](../config/validation) configuration:

```json
{
  "ValidationOptions": {
    "Rules": {
      "phone": {
        "Type": "Regex",
        "Pattern": "^\\+?[1-9]\\d{1,14}$",
        "Message": "Parameter '{0}' must be a valid phone number",
        "StatusCode": 400
      },
      "password_min": {
        "Type": "MinLength",
        "MinLength": 8,
        "Message": "Password must be at least 8 characters"
      }
    }
  }
}
```

Then use in annotations:

```sql
comment on function create_user(text, text, text) is '
HTTP POST
@validate _phone using phone
@validate _password using required, password_min
';
```

## Behavior

- Validation runs before database connections are opened
- Rules are evaluated in the order specified
- Validation stops on first failure
- Failed validation returns the configured HTTP status code and error message
- Parameter names are matched case-insensitively
- Original PostgreSQL names (`_email`) and converted names (`email`) both work

## Error Response

When validation fails, the endpoint returns an error response:

```json
{
  "title": "Parameter '_email' must be a valid email address",
  "status": 400,
  "detail": null
}
```

The HTTP status code and message are configured per rule in [ValidationOptions](../config/validation).

## Related

- [ValidationOptions configuration](../config/validation) - Configure validation rules
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [AUTHORIZE](./authorize) - Require authentication
- [USER_PARAMETERS](./user-parameters) - Map user claims to parameters

## See Also

- [Validation Config](/config/validation) - Configure validation rules

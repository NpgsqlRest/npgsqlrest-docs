---
outline: [2, 3]
title: "Validation Options Configuration"
titleTemplate: NpgsqlRest
description: "Configure parameter validation for NpgsqlRest APIs. Define validation rules for endpoint parameters before database execution using NotNull, NotEmpty, Required, Regex, MinLength, and MaxLength validators."
head:
  - - meta
    - name: keywords
      content: npgsqlrest validation, api parameter validation, postgresql api validation, request validation, input validation configuration
  - - meta
    - property: og:title
      content: "NpgsqlRest Validation Options Configuration"
  - - meta
    - property: og:description
      content: "Configure parameter validation rules for NpgsqlRest endpoints before database execution."
  - - meta
    - property: og:type
      content: article
---

# Validation Options

Parameter validation configuration for validating endpoint parameters before database execution. Validation is performed immediately after parameters are parsed, before any database connection is opened, authorization checks, or proxy handling.

## Overview

```json
{
  "ValidationOptions": {
    "Enabled": true,
    "Rules": {
      "not_null": {
        "Type": "NotNull",
        "Message": "Parameter '{0}' cannot be null",
        "StatusCode": 400
      }
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `true` | Enable parameter validation. |
| `Rules` | object | See [Default Rules](#default-rules) | Named validation rules that can be referenced in comment annotations. |

## Validation Types

Six validation types are available:

| Type | Description |
|------|-------------|
| `NotNull` | Parameter value cannot be null (DBNull.Value) |
| `NotEmpty` | Parameter value cannot be an empty string (null values pass) |
| `Required` | Combines NotNull and NotEmpty - value cannot be null or empty |
| `Regex` | Parameter value must match the specified regular expression pattern |
| `MinLength` | Parameter value must have at least N characters |
| `MaxLength` | Parameter value must have at most N characters |

## Rule Properties

Each rule can have the following properties:

| Property | Required | Description |
|----------|----------|-------------|
| `Type` | Yes | Validation type: `NotNull`, `NotEmpty`, `Required`, `Regex`, `MinLength`, `MaxLength` |
| `Pattern` | For Regex | Regular expression pattern to match against |
| `MinLength` | For MinLength | Minimum number of characters required |
| `MaxLength` | For MaxLength | Maximum number of characters allowed |
| `Message` | No | Error message with placeholders: `{0}`=original parameter name, `{1}`=converted parameter name, `{2}`=rule name. Default: `"Validation failed for parameter '{0}'"` |
| `StatusCode` | No | HTTP status code returned on validation failure. Default: `400` |

## Default Rules

Four validation rules are available by default:

```json
{
  "ValidationOptions": {
    "Enabled": true,
    "Rules": {
      "not_null": {
        "Type": "NotNull",
        "Message": "Parameter '{0}' cannot be null",
        "StatusCode": 400
      },
      "not_empty": {
        "Type": "NotEmpty",
        "Message": "Parameter '{0}' cannot be empty",
        "StatusCode": 400
      },
      "required": {
        "Type": "Required",
        "Message": "Parameter '{0}' is required",
        "StatusCode": 400
      },
      "email": {
        "Type": "Regex",
        "Pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
        "Message": "Parameter '{0}' must be a valid email address",
        "StatusCode": 400
      }
    }
  }
}
```

## Adding Custom Rules

You can add custom validation rules to the `Rules` object. The key becomes the rule name used in the [validate annotation](../annotations/validate).

### Regex Pattern Rule

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
      "username": {
        "Type": "Regex",
        "Pattern": "^[a-zA-Z0-9_]{3,20}$",
        "Message": "Parameter '{0}' must be 3-20 alphanumeric characters or underscores",
        "StatusCode": 400
      },
      "uuid": {
        "Type": "Regex",
        "Pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        "Message": "Parameter '{0}' must be a valid UUID",
        "StatusCode": 400
      }
    }
  }
}
```

### Length Validation Rules

```json
{
  "ValidationOptions": {
    "Rules": {
      "password_length": {
        "Type": "MinLength",
        "MinLength": 8,
        "Message": "Parameter '{0}' must be at least 8 characters",
        "StatusCode": 400
      },
      "short_text": {
        "Type": "MaxLength",
        "MaxLength": 100,
        "Message": "Parameter '{0}' must not exceed 100 characters",
        "StatusCode": 400
      }
    }
  }
}
```

## Complete Example

Configuration with multiple custom validation rules:

```json
{
  "ValidationOptions": {
    "Enabled": true,
    "Rules": {
      "not_null": {
        "Type": "NotNull",
        "Message": "Parameter '{0}' cannot be null",
        "StatusCode": 400
      },
      "not_empty": {
        "Type": "NotEmpty",
        "Message": "Parameter '{0}' cannot be empty",
        "StatusCode": 400
      },
      "required": {
        "Type": "Required",
        "Message": "Parameter '{0}' is required",
        "StatusCode": 400
      },
      "email": {
        "Type": "Regex",
        "Pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
        "Message": "Parameter '{0}' must be a valid email address",
        "StatusCode": 400
      },
      "phone": {
        "Type": "Regex",
        "Pattern": "^\\+?[1-9]\\d{1,14}$",
        "Message": "Parameter '{0}' must be a valid phone number (E.164 format)",
        "StatusCode": 400
      },
      "password_min": {
        "Type": "MinLength",
        "MinLength": 8,
        "Message": "Password must be at least 8 characters",
        "StatusCode": 400
      },
      "name_max": {
        "Type": "MaxLength",
        "MaxLength": 50,
        "Message": "Name must not exceed 50 characters",
        "StatusCode": 400
      },
      "slug": {
        "Type": "Regex",
        "Pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        "Message": "Parameter '{0}' must be a valid URL slug",
        "StatusCode": 400
      }
    }
  }
}
```

## Usage with Annotations

Once validation rules are configured, use the [validate annotation](../annotations/validate) in PostgreSQL function comments to apply validation:

```sql
create function register_user(_email text, _password text, _name text)
returns json
language plpgsql
as $$
begin
    -- validation already passed, safe to use parameters
    insert into users (email, password_hash, name)
    values (_email, crypt(_password, gen_salt('bf')), _name);
    return json_build_object('success', true);
end;
$$;

comment on function register_user(text, text, text) is '
HTTP POST
@validate _email using required, email
@validate _password using required, password_min
@validate _name using not_empty, name_max
';
```

**Equivalent as a SQL file endpoint** (`sql/register-user.sql`):

```sql
/*
HTTP POST
@validate email using required, email
@validate password using required, password_min
@validate name using not_empty, name_max
@param $1 email
@param $2 password
@param $3 name
*/
insert into users (email, password_hash, name)
values ($1, crypt($2, gen_salt('bf')), $3)
returning json_build_object('success', true);
```

## Programmatic Configuration

When using NpgsqlRest as a library, you can configure validation options programmatically:

```csharp
var options = new NpgsqlRestOptions
{
    ValidationOptions = new ValidationOptions
    {
        Rules = new Dictionary<string, ValidationRule>
        {
            ["required"] = new ValidationRule
            {
                Type = ValidationType.Required,
                Message = "Parameter '{0}' is required",
                StatusCode = 400
            },
            ["phone"] = new ValidationRule
            {
                Type = ValidationType.Regex,
                Pattern = @"^\+?[1-9]\d{1,14}$",
                Message = "Parameter '{0}' must be a valid phone number"
            },
            ["min_age"] = new ValidationRule
            {
                Type = ValidationType.MinLength,
                MinLength = 2,
                Message = "Parameter '{0}' must be at least 2 characters"
            }
        }
    }
};
```

## Behavior

- Validation runs immediately after parameter parsing, before database connections are opened
- Multiple rules can be applied to a single parameter
- Rules are evaluated in order; validation stops on first failure
- Failed validation returns the configured HTTP status code (default 400)
- Null values pass `NotEmpty` validation (use `Required` to reject nulls and empty strings)

## Related

- [validate annotation](../annotations/validate) - Apply validation rules to endpoint parameters
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [Error Handling](./error-handling) - Configure error responses
- [Authentication Options](./authentication-options) - Configure authentication per endpoint

## See Also

- [VALIDATE](/annotations/validate) - Apply validation rules to parameters

---
outline: [2, 3]
title: "ERROR_CODE_POLICY Annotation"
titleTemplate: NpgsqlRest
description: "Associate error handling policies with PostgreSQL REST API endpoints. Map PostgreSQL errors to custom HTTP responses."
head:
  - - meta
    - name: keywords
      content: npgsqlrest error policy, postgresql error handling, custom error responses, error code mapping
  - - meta
    - property: og:title
      content: "NpgsqlRest ERROR_CODE_POLICY Annotation"
  - - meta
    - property: og:description
      content: "Associate error handling policies for custom PostgreSQL error responses."
  - - meta
    - property: og:type
      content: article
---

# ERROR_CODE_POLICY

::: info Also known as
`error_code_policy_name`, `error_code` (with or without `@` prefix)
:::

Associate an error handling policy with the endpoint.

## Syntax

```
@error_code_policy <policy-name>
@error_code <policy-name>
```

## Examples

### Named Policy

```sql
comment on function risky_operation() is
'HTTP POST
@error_code_policy strict_errors';
```

### Short Form

```sql
comment on function api_endpoint() is
'HTTP GET
@error_code default_policy';
```

## Behavior

- References an error policy defined in the [ErrorCodePolicies](../config/error-handling#error-code-policies) configuration
- Controls how PostgreSQL errors are mapped to HTTP status codes
- Defines error response format

## Related

- [Error Handling configuration](../config/error-handling) - Configure error code policies
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Related Annotations

- [SECURITY_SENSITIVE](./security-sensitive) - Hide error details

## See Also

- [Error Handling](/config/error-handling) - Configure error code policies

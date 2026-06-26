---
outline: [2, 3]
title: "TEST @claim Directive"
titleTemplate: NpgsqlRest
description: "Set the acting principal's claims for an in-process endpoint call inside a SQL test file HTTP block. Test-runner (--test) test files only."
head:
  - - meta
    - name: keywords
      content: npgsqlrest test claim, test authentication, claims principal, authorized endpoint testing
  - - meta
    - property: og:title
      content: "NpgsqlRest TEST @claim Directive"
  - - meta
    - property: og:description
      content: "Set the acting principal's claims for an in-process endpoint call in a SQL test file."
  - - meta
    - property: og:type
      content: article
---

# TEST @claim

::: warning Test files only
This directive applies **only inside HTTP blocks of test files** run by the [SQL test runner](../guide/testing) (`npgsqlrest --test`).
:::

Add a claim to the **acting principal** of an in-process endpoint call. Placed inside an [HTTP block](../guide/testing#http-blocks-invoking-endpoints), after the request line and before the body:

```sql
/*
GET /api/get-users
# @claim user_id=42
# @claim roles=admin
# @claim roles=auditor
*/
select status = 200, 'authorized call succeeds' from _response;
```

## Semantics

- **Repeatable** — including the *same* claim type twice (two `roles` claims above), exactly like a real multi-valued principal.
- Any `# @claim` makes the request **authenticated**; a block with **no** `# @claim` is **anonymous** — an `@authorize` endpoint returns `401`.
- Role checks (`@authorize roles ...`) and claim-to-parameter bindings (`@user_parameters`, `ParameterNameClaimsMapping`) run **exactly as in production** — the directive injects the principal, everything downstream is the real authorization path.
- `// @claim` is accepted as an alternative to `# @claim`.

## Why not call the login endpoint?

`@login`/`@logout` endpoints are rejected in test mode (they manipulate real authentication schemes that don't exist in-process). Inject the principal directly instead — it is both faster and lets a test act as *any* user:

```sql
/*
POST /api/admin/delete-user
Content-Type: application/json
# @claim user_id=1
# @claim roles=admin

{"id": 42}
*/
select status = 200, 'admin can delete' from _response;

/*
POST /api/admin/delete-user
Content-Type: application/json
# @claim user_id=2
# @claim roles=viewer

{"id": 42}
*/
-- second block → second response table (_response_1, _response_2)
select status = 403, 'viewer cannot delete' from _response_2;
```

## Related

- [TEST @response](./test-response) — name the captured response table
- [AUTHORIZE](./authorize) / [USER_PARAMETERS](./user-parameters) — what the injected principal exercises
- [Testing Guide](../guide/testing) — HTTP block syntax in full

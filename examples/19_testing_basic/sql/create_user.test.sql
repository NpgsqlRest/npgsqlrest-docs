-- Test for POST /api/create-user (co-located with sql/create_user.sql).
-- Demonstrates: the file owns its transaction (begin/rollback), authorization via `# @claim`,
-- multi-capture via `# @response <name>`, and that the in-process HTTP call sees this transaction's
-- uncommitted data (the created user shows up in a subsequent GET, then rollback discards it).

begin;

-- 1) Anonymous → 401 (no `# @claim` ⇒ unauthenticated principal).
--    This file has multiple HTTP blocks, so each response lands in its own temp table: block 1 → _response_1,
--    block 2 → _response_2, … (a block with `# @response <name>` uses that name instead).
/*
POST /api/create-user
Content-Type: application/json

{"name": "Grace Hopper", "email": "GRACE@Example.com"}
*/
select status = 401,
       'anonymous caller must be rejected (401)'
from _response_1;

-- 2) Authenticated but wrong role → 403. (`roles` is the configured DefaultRoleClaimType.)
/*
POST /api/create-user
# @claim roles=user

{"name": "Grace Hopper", "email": "GRACE@Example.com"}
*/
select status = 403,
       'non-admin must be forbidden (403)'
from _response_2;

-- 3) Admin → success. Capture this response under its own name `created` (multi-capture).
/*
POST /api/create-user
# @claim roles=admin
# @response created

{"name": "Grace Hopper", "email": "GRACE@Example.com"}
*/
select status = 200,
       'admin create should succeed (200)'
from created;
select body::jsonb ->> 'email' = 'grace@example.com',
       'email should be normalized to lowercase by example_19.normalize_email()'
from created;

-- 4) The new user is visible to a follow-up GET — same connection, same uncommitted transaction.
/*
GET /api/get-users
# @response listing
*/
select body::jsonb @> '[{"name": "Grace Hopper"}]'::jsonb,
       'the just-created user should appear in the listing'
from listing;

-- Discard everything; the next test run starts from the seeded baseline.
rollback;

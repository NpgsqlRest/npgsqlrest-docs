-- @tag smoke
-- Test: GET /api/get-users returns an empty addresses array for a user with no address rows.
--
-- Arrange: baseline seed — grace (id 3) has no row in `addresses`.
-- Act:     GET /api/get-users authenticated as ada (user_id=1), so grace is in the (non-excluded) result.
-- Assert:  grace's `addresses` is `[]` — not null, not missing. The query's
--          `coalesce(jsonb_agg(...), '[]'::jsonb)` turns "no matching rows" into an empty array.
--
-- No `begin`/`rollback`: this test writes nothing, so there is nothing to discard.

/*
GET /api/get-users
# @claim user_id=1
*/
select body::jsonb @> '[{"email": "grace@example.com", "addresses": []}]',
       'grace (no address rows) is listed with an empty addresses array'
from _response;

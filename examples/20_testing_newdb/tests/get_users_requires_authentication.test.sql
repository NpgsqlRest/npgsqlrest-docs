-- @tag auth, smoke
-- Test: GET /api/get-users requires authentication.
--
-- Arrange: nothing — the endpoint is @authorize, so an anonymous request must be rejected before it
--          ever reaches user-parameter resolution.
-- Act:     GET /api/get-users with no principal (no `# @claim`).
-- Assert:  the captured response's status is 401.
--
-- No `begin`/`rollback`: this test writes nothing, so there is nothing to discard.

/*
GET /api/get-users
*/
select status = 401,
       'anonymous caller must be rejected (401)'
from _response;

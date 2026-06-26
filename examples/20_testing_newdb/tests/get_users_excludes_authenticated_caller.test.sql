-- @tag auth, smoke
-- Test: GET /api/get-users excludes the authenticated caller from the result.
--
-- Arrange: baseline seed (ada, alan, grace) — no fixture needed.
-- Act:     GET /api/get-users authenticated as ada (user_id=1). `_user_id` is filled from the claim
--          (@user_parameters), never from the request, and the query filters `where u.id <> _user_id`.
-- Assert:  ada is NOT in the result; the other two seeded users ARE.
--
-- No `begin`/`rollback`: this test writes nothing, so there is nothing to discard.

/*
GET /api/get-users
# @claim user_id=1
*/
select status = 200,
       'authenticated caller gets 200'
from _response;
select jsonb_array_length(body::jsonb) = 2,
       'the caller is excluded — 2 of 3 users listed'
from _response;
select body::jsonb @> '[{"email": "alan@example.com"}]',
       'another user (alan) is listed'
from _response;
select not body::jsonb @> '[{"email": "ada@example.com"}]',
       'the caller (ada) is NOT listed'
from _response;

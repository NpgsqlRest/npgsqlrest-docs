-- @tag auth
-- Test: GET /api/get-users does not validate _user_id against an existing user.
--
-- Arrange: baseline seed — no fixture needed.
-- Act:     GET /api/get-users authenticated with a user_id claim (999) that matches no `users` row.
-- Assert:  all three seeded users are listed. `_user_id` is only ever used to filter (`u.id <> _user_id`);
--          it is never checked for existence, so an authenticated caller with no matching row still gets
--          the full list — nothing is (incorrectly) excluded.
--
-- No `begin`/`rollback`: this test writes nothing, so there is nothing to discard.

/*
GET /api/get-users
# @claim user_id=999
*/
select status = 200,
       'authenticated (unknown user_id) gets 200'
from _response;
select jsonb_array_length(body::jsonb) = 3,
       'no user is excluded — all three seeded users are listed'
from _response;

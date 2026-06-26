-- @tag login
-- Test: POST /api/login returns an empty result for an email that does not exist at all.
--
-- Arrange: nothing — the email deliberately matches no row in the seed or any other test's fixture.
-- Act:     POST /api/login with an email that was never inserted.
-- Assert:  200 with an empty body, same shape as a wrong-password non-match — the query is a single
--          credential-matching SELECT either way, so there is no distinct "user not found" case.
--
-- No `begin`/`rollback`: this test writes nothing, so there is nothing to discard.

/*
POST /api/login
Content-Type: application/json

{"email": "nobody@example.com", "password": "irrelevant"}
*/
select status = 200,
       'an unknown email still returns 200'
from _response;
select coalesce(body, '') = '',
       'an unknown email yields an empty result'
from _response;

-- @tag smoke
-- Test: GET /api/get-users lists the seed plus a fixture reused from an included file.
--
-- Arrange: `\ir` splices the statements of fixtures/extra_users.sql in place — same connection, same
--          transaction, so the fixture rolls back with the test. Reuse without copy-paste.
-- Act:     GET /api/get-users (shared per-run test database).
-- Assert:  three seeded + two fixture users are listed.

begin;

\ir fixtures/extra_users.sql

/*
GET /api/get-users
*/
select status = 200,
       'listing returns 200'
from _response;
select jsonb_array_length(body::jsonb) = 5,
       'three seeded + two fixture users are listed'
from _response;
select body::jsonb @> '[{"email": "fixture1@example.com"}]',
       'a fixture user from the included file is listed'
from _response;

rollback;

-- @tag smoke
-- Test: POST /api/create-user returns the created user (shared per-run test database).
--
-- Note what this test deliberately does NOT assert: the generated `id`. Sequences are non-transactional —
-- every nextval() sticks even when the transaction rolls back — so on the SHARED test database the id
-- depends on which other tests (including this one, on previous statements) have burned sequence values.
-- The id IS asserted in create_user_ids_are_deterministic.test.sql, which runs in its own cloned database.

begin;

/*
POST /api/create-user
Content-Type: application/json

{"name": "New User", "email": "new@example.com"}
*/
select status = 200,
       'create returns 200'
from _response;
select body::jsonb ->> 'name' = 'New User',
       'the created user is returned'
from _response;
select (select count(*) from example_21.users where email = 'new@example.com') = 1,
       'the user is inserted (visible inside this transaction)';

rollback;

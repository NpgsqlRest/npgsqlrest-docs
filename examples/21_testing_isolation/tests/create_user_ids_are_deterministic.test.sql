-- Test: sequence-generated ids are exactly 4 and 5 — provable only with per-test database isolation.
--
-- The include below pulls in the shared isolation profile (shared/isolated_database.sql): includes behave
-- as if pasted, so the profile's header annotations apply to THIS file — a setup step clones the template
-- into this test's own database, the connection annotation runs the file (and its in-process endpoint
-- calls) on that clone, and a teardown step drops it afterwards (always, even if the test fails).
--
-- Why: sequences are non-transactional. On the shared test database, any test that inserts (even rolled
-- back!) advances the sequence, so "the next id" is unknowable. A fresh clone starts from the template's
-- exact state — seeded ids 1..3, sequence set to 3 — so the next two ids are provably 4 and 5.
-- No begin/rollback needed: the whole database is disposable.

\ir shared/isolated_database.sql

/*
POST /api/create-user
Content-Type: application/json

{"name": "First In Clone", "email": "first@example.com"}
*/
select (body::jsonb ->> 'id')::int = 4,
       'first created user gets id 4 (seeded 1..3, sequence at 3)'
from _response_1;

/*
POST /api/create-user
Content-Type: application/json

{"name": "Second In Clone", "email": "second@example.com"}
*/
select (body::jsonb ->> 'id')::int = 5,
       'second created user gets id 5'
from _response_2;

select (select count(*) from example_21.users) = 5,
       'the clone now holds exactly the 3 seeded + 2 created users';

-- @tag isolation, slow
-- Test: a SECOND isolated clone is fully independent of the first.
--
-- This file gets its own database (clone 2), declared with inline header annotations — the sibling test
-- create_user_ids_are_deterministic.test.sql attaches clone 1 via the shared profile include; both styles
-- are equivalent. The two clones have different names because {rnd5_1} and {rnd5_2} are two INDEPENDENT
-- random tokens of the same length (see test-config.json), so both databases coexist in one run.
--
-- The proof of independence: BOTH isolated tests assert the very same generated id (4) — which can only
-- hold if each runs against its own fresh clone; on any shared database one of them would observe the
-- other's sequence consumption.

-- @setup CreateIsolatedDb2
-- @teardown DropIsolatedDb2
-- @connection Isolated2

/*
POST /api/create-user
Content-Type: application/json

{"name": "Solo In Clone Two", "email": "solo@example.com"}
*/
select (body::jsonb ->> 'id')::int = 4,
       'clone 2 also hands out id 4 — untouched by the sibling isolated test'
from _response;

select (select count(*) from example_21.users) = 4,
       'clone 2 holds exactly the 3 seeded users + this one';

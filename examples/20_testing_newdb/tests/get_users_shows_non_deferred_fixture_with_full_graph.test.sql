-- @tag fixtures
-- Test: a normal (non-deferred) fixture inserts the full graph in dependency order — for contrast with the
-- deferred-fixture test above.
--
-- Arrange: insert a country, a role, a user (referencing both), and an address (referencing the user and
--          the country) — in that order, so every FK is satisfied immediately. No
--          `set constraints ... deferred` needed: this is the ordinary way to build a fixture when you do
--          want the full graph.
-- Act:     GET /api/get-users authenticated as ada (user_id=1).
-- Assert:  the fixture user is listed with its real role, and its address with its real country.

begin;
insert into example_20.countries (id, code, name) values (9101, 'FR', 'France');
insert into example_20.roles (id, name) values (9101, 'contributor');
insert into example_20.users (id, email, full_name, password_hash, role_id)
    values (9101, 'full-graph-fixture@example.com', 'Full Graph Fixture', 'x', 9101);
insert into example_20.addresses (id, user_id, country_id, line1, city)
    values (9101, 9101, 9101, '1 Fixture Street', 'Paris');

/*
GET /api/get-users
# @claim user_id=1
*/
select (
    jsonb_path_query_first(body::jsonb, '$[*] ? (@.email == $e)', jsonb_build_object('e', 'full-graph-fixture@example.com')) ->> 'role'
) = 'contributor',
       'the fixture user is listed with its real role'
from _response;
select (
    jsonb_path_query_first(body::jsonb, '$[*] ? (@.email == $e)', jsonb_build_object('e', 'full-graph-fixture@example.com')) -> 'addresses' -> 0 ->> 'country'
) = 'France',
       'the fixture address is listed with its real country'
from _response;

rollback;

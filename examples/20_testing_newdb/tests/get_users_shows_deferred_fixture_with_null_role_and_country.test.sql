-- @tag fixtures
-- Test: a DEFERRABLE-constraint fixture can reference a role/country that is never inserted.
--
-- Arrange: defer constraints, then insert a user (role_id=9999) and its address (country_id=9998) —
--          neither the role nor the country row is ever inserted. This is only legal because every FK here
--          is DEFERRABLE: the check would run at COMMIT, which this test never reaches (it rolls back).
-- Act:     GET /api/get-users authenticated as ada (user_id=1), so the fixture user is in the result.
-- Assert:  the fixture user is listed with a null role, and its address is listed with a null country —
--          the LEFT JOINs resolve the missing rows to null instead of failing.
--
-- Looked up by email with jsonb_path_query_first rather than a fixed array index, since the fixture's
-- position in the (ordered-by-id) result depends on which other tests seeded which ids.

begin;
set constraints all deferred;
insert into example_20.users (id, email, full_name, password_hash, role_id)
    values (9001, 'deferred-fixture@example.com', 'Deferred Fixture', 'x', 9999);
insert into example_20.addresses (id, user_id, country_id, line1, city)
    values (9001, 9001, 9998, '99 Test Lane', 'Testville');

/*
GET /api/get-users
# @claim user_id=1
*/
select (
    jsonb_path_query_first(body::jsonb, '$[*] ? (@.email == $e)', jsonb_build_object('e', 'deferred-fixture@example.com')) ->> 'role'
) is null,
       'the fixture user is listed with a null role'
from _response;
select (
    jsonb_path_query_first(body::jsonb, '$[*] ? (@.email == $e)', jsonb_build_object('e', 'deferred-fixture@example.com')) -> 'addresses' -> 0 ->> 'country'
) is null,
       'the fixture address is listed with a null country'
from _response;

rollback;

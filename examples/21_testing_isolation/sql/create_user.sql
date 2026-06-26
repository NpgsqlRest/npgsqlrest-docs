/*
HTTP POST
@param $1 name text
@param $2 email text
@single
*/
-- POST /api/create-user — insert a user with a DEFAULT (sequence-generated) id and return the row.
-- The generated id is what makes this endpoint interesting for testing: sequences are non-transactional,
-- so the id value depends on every nextval() that ever ran in the database — including from tests that
-- rolled back. See tests/create_user_ids_are_deterministic.test.sql for the isolated-database solution.
insert into example_21.users (name, email)
values ($1, $2)
returning id, name, email;

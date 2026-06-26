-- @tag login
-- Test: POST /api/login rejects a correct email with the wrong password.
--
-- Arrange: same fixture shape as the "succeeds" test, under its own id range — each test file runs on its
--          own connection, and the test DATABASE is created once per RUN (not per file), so fixture ids
--          must not collide across files that may run concurrently.
-- Act:     POST /api/login with the right email but a wrong password.
-- Assert:  with `@single`, zero matching rows is still a 200 with an empty body — this endpoint is a plain
--          credential SELECT, not a `@login`-annotated endpoint that would return 401 on failure.

begin;
set constraints all deferred;
insert into example_20.users (id, email, full_name, password_hash, role_id)
    values (9301, 'login-wrong-password@example.com', 'Login Wrong Password', crypt('s3cret', gen_salt('bf')), 9301);
insert into example_20.roles (id, name) values (9301, 'tester');

/*
POST /api/login
Content-Type: application/json

{"email": "login-wrong-password@example.com", "password": "not-the-password"}
*/
select status = 200,
       'a non-match still returns 200'
from _response;
select coalesce(body, '') = '',
       'wrong password yields an empty result (no user returned)'
from _response;

rollback;

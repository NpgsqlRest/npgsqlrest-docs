-- @tag login, smoke
-- Test: POST /api/login succeeds with correct credentials.
--
-- Arrange: a role + a user fixture with a pgcrypto-hashed password. Constraints are deferred so the user
--          can be inserted before its role, in this arbitrary order (a DEFERRABLE-fixture, like the
--          get-users tests above, just applied to login instead).
-- Act:     POST /api/login with the matching email + password. `login` is `@allow_anonymous`, so no
--          principal is needed to call it.
-- Assert:  200, and the response is the authenticated user (email + role).

begin;
set constraints all deferred;
insert into example_20.users (id, email, full_name, password_hash, role_id)
    values (9201, 'login-success@example.com', 'Login Success', crypt('s3cret', gen_salt('bf')), 9201);
insert into example_20.roles (id, name) values (9201, 'tester');

/*
POST /api/login
Content-Type: application/json

{"email": "login-success@example.com", "password": "s3cret"}
*/
select status = 200,
       'correct credentials return 200'
from _response;
select body::jsonb ->> 'email' = 'login-success@example.com',
       'login returns the authenticated user'
from _response;
select body::jsonb ->> 'role' = 'tester',
       'login returns the user role'
from _response;

rollback;

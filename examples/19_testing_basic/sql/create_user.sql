/*
HTTP POST
@authorize admin
@param $1 name text
@param $2 email text
@single
*/
-- POST /create-user — admin-only. Inserts a user (email normalized) and returns the created row.
-- `@authorize admin` gates by role: no token → 401, non-admin → 403, admin → 200.
insert into example_19.users (name, email, role)
values ($1, example_19.normalize_email($2), 'user')
returning id, name, email, role;

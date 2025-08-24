create or replace function example_4.login(
    _scheme text,
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    username text,
    roles text[],
    email text,
    password_hash text
)
language sql
set search_path = pg_catalog, pg_temp
as $$
select
    -- configured schemes are 'cookies', 'token' and 'jwt' and any other scheme is rejected (404)
    _scheme,
    user_id,
    username,
    roles,
    email,
    password_hash
from example_4.users
where 
    username = _username;
$$;

comment on function example_4.login(text, text, text) is '
HTTP POST
@login
@anonymous';

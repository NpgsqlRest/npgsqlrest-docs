-- Login function for demo authentication
create or replace function example_11.login(
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    user_name text
)
language sql
set search_path = pg_catalog, pg_temp
security definer
as $$
select
    'cookies' as scheme,
    u.user_id,
    u.username
from example_11.users u
where
    u.username = _username
    and u.password = _password -- no hashing for simplicity
$$;

comment on function example_11.login(text, text) is '
HTTP POST
@login
@anonymous';

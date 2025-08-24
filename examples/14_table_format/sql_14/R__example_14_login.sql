create or replace function example_14.login(
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    username text
)
language sql
set search_path = pg_catalog, pg_temp
as $$
select
    'cookies' as scheme,
    u.user_id,
    u.username
from example_14.users u
where
    u.username = _username
    and u.password_hash = example_14.crypt(_password, u.password_hash);
$$;

comment on function example_14.login(text, text) is '
HTTP POST
@login
@anonymous';

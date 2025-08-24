create or replace function example_4.get_users()
returns table (
    users example_4.users,
    is_this_me boolean
)
set search_path = pg_catalog, pg_temp
language sql
as $$
select
    (u.*)::example_4.users,
    (u.user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int) is true as is_this_me
from example_4.users u;
$$;

comment on function example_4.get_users() is '
HTTP GET
@authorize admin'; -- authize admin role only

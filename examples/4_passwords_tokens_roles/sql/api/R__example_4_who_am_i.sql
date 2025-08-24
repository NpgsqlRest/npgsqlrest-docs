drop type if exists example_4.who_am_i_response cascade;
create type example_4.who_am_i_response as (
    user_id int,
    username text,
    email text,
    roles text[],
    last_login timestamp with time zone,
    last_login_provider text
);

create function example_4.who_am_i()
returns example_4.who_am_i_response
set search_path = pg_catalog, pg_temp
language sql
as $$
select
    -- user claims are stored in current settings by npgsqlrest
    nullif(pg_catalog.current_setting('request.user_id', true), '')::int as user_id,
    nullif(pg_catalog.current_setting('request.username', true), '') as username,
    nullif(pg_catalog.current_setting('request.email', true), '') as email,
    nullif(pg_catalog.current_setting('request.roles', true), '')::text[] as roles,
    last_login,
    last_login_provider
from example_4.users
where user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int
$$;

comment on function example_4.who_am_i() is '
HTTP GET
@authorize'; -- authize all roles

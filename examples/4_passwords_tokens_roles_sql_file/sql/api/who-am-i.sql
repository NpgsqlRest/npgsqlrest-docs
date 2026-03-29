-- HTTP GET
-- @authorize
select
    -- user claims are stored in current settings by npgsqlrest
    nullif(pg_catalog.current_setting('request.user_id', true), '')::int as user_id,
    nullif(pg_catalog.current_setting('request.username', true), '') as username,
    nullif(pg_catalog.current_setting('request.email', true), '') as email,
    nullif(pg_catalog.current_setting('request.roles', true), '')::text[] as roles,
    last_login,
    last_login_provider
from example_4.users
where user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int;

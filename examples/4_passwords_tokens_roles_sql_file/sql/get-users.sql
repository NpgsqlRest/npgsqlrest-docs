-- HTTP GET
-- @authorize admin
select
    (u.*)::example_4.users,
    (u.user_id = nullif(pg_catalog.current_setting('request.user_id', true), '')::int) is true as is_this_me
from example_4.users u;

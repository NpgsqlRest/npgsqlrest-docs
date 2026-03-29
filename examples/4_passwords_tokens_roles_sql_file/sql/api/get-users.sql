-- HTTP GET
-- @authorize admin
select
    u.user_id,
    u.username,
    u.email,
    u.roles,
    u.last_login,
    u.last_login_provider
from example_4.users u
order by u.user_id;

/*
HTTP POST
@login
@allow_anonymous
@param $1 username
@param $2 password
*/
select
    'cookies' as scheme,
    u.user_id,
    u.username as user_name
from example_9.users u
where
    u.username = $1
    and u.password_hash = example_9.crypt($2, u.password_hash);

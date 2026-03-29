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
    u.username,
    u.email,
    jsonb_build_object('userId', u.user_id, 'username', u.username, 'email', u.email) as message
from example_13.users u
where
    u.username = $1
    and u.password = $2;

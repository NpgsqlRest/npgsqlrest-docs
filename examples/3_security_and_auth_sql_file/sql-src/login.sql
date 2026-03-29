/*
HTTP POST
@login
@allow_anonymous
@param $1 username
@param $2 password
*/
select
    'cookies' as scheme,
    u.user_id::text as user_id,
    u.username,
    u.email
from example_3.users u
where
    u.username = $1
    and example_3.verify_password($2, u.password_hash);

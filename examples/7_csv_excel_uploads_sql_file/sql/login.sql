/*
HTTP POST
@login
@anonymous
@param $1 username
@param $2 password
*/
select
    'cookies' as scheme,
    u.user_id,
    u.username
from example_7.users u
where
    u.username = $1
    and u.password_hash = example_7.crypt($2, u.password_hash);

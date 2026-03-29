/*
HTTP POST
@login
@allow_anonymous
@param $1 scheme text
@param $2 username text
@define_param password text
*/
select
    -- configured schemes are 'cookies', 'token' and 'jwt' and any other scheme is rejected (404)
    $1 as scheme,
    user_id,
    username,
    roles,
    email,
    password_hash
from example_4.users
where 
    username = $2;

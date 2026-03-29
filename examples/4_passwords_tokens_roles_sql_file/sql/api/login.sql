/*
HTTP POST
@login
@allow_anonymous
@param $1 username
@param $2 password
@param $3 provider
*/
select
    coalesce($3, 'cookies') as scheme,
    u.user_id::text as user_id,
    u.username as user_name,
    array_to_string(u.roles, ',') as roles,
    u.email,
    u.password_hash
from example_4.users u
where u.username = $1;

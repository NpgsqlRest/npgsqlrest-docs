/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id default null
@param $2 _username default null
@param $3 _email default null
*/
select $1 as user_id, $2 as username, $3 as email;

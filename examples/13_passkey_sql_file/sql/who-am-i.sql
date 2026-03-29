/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id
@param $2 _username
@param $3 _email
*/
select $1 as user_id, $2 as username, $3 as email;

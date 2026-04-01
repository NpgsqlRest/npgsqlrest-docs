/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id text = null
*/
select *
from example_6.uploads
where user_id = $1::int
order by uploaded_at desc;

/*
HTTP GET
@authorize
@path /api/contacts
@param $1 id
@param $2 name
*/
select id, name, email, phone, created_at
from example_11.contacts
where
    ($1::int is null or id = $1::int)
    and ($2 is null or name ilike '%' || $2 || '%')
order by id;

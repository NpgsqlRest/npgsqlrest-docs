/*
HTTP DELETE
@authorize
@path /api/contacts
@param $1 id
*/
delete from example_11.contacts where id = $1::int;

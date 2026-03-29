/*
HTTP PUT
@authorize
@path /api/contacts
@param $1 name
@param $2 email
@param $3 phone
*/
insert into example_11.contacts (name, email, phone)
values ($1, $2, $3)
returning id, name, email, phone, created_at;

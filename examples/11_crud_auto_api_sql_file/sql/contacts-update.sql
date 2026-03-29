/*
HTTP POST
@authorize
@path /api/contacts
@param $1 id
@param $2 name
@param $3 email
@param $4 phone
*/
update example_11.contacts
set
    name = coalesce($2, name),
    email = coalesce($3, email),
    phone = coalesce($4, phone)
where id = $1::int
returning id, name, email, phone, created_at;

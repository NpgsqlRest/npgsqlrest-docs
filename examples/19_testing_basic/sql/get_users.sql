/*
HTTP GET
*/
-- GET /get-users — list all users. Anonymous (no @authorize).
select id, name, email, role
from example_19.users
order by id;

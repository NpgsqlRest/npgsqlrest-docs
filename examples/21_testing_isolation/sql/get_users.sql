/*
HTTP GET
*/
-- GET /api/get-users — list all users. Anonymous (this example focuses on isolation, not auth).
select id, name, email
from example_21.users
order by id;

-- Test for GET /get-users (co-located with sql/get_users.sql).
-- Read-only: no arrange, no transaction needed. Demonstrates an HTTP block + boolean-select asserts.
--
-- An HTTP request is any /* ... */ block whose first line is a request line ([HTTP] METHOD /path).
-- The runner invokes the endpoint in-process and stores the response in the temp table `_response`.

/*
GET /api/get-users
*/

-- A SELECT whose first column is boolean is an assertion: false/NULL fails, the 2nd column is the message.
select status = 200,
       'GET /get-users should return 200'
from _response;

select body::jsonb @> '[{"email": "ada@example.com"}]'::jsonb,
       'seeded user ada should be in the list'
from _response;

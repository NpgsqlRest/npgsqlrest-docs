-- HTTP GET
-- @param $1 id
select *
from example_12.authors
where $1::int is null or id = $1::int;

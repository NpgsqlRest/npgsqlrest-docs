-- HTTP GET
-- @param $1 id
select * from example_12.authors where id = $1::int;

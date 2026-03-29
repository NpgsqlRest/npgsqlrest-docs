-- HTTP POST
-- @param $1 first_name
-- @param $2 last_name
insert into example_12.authors (first_name, last_name)
values ($1, $2)
returning *;

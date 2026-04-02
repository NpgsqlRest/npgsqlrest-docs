/*
HTTP GET
@param $1 authorId int
*/
select author_id, first_name, last_name
from example_12.authors
where author_id = $1;

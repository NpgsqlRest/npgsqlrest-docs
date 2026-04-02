/*
HTTP GET
@param $1 authorId int default null
*/
select author_id, first_name, last_name
from example_12.authors
where
    $1 is null or author_id = $1;

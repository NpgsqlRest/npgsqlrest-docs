/*
HTTP GET
@param $1 author example_12.authors
*/
select author_id, first_name, last_name
from example_12.authors
where
    ($1::example_12.authors) is null
    or author_id = ($1::example_12.authors).author_id
    or last_name = ($1::example_12.authors).last_name

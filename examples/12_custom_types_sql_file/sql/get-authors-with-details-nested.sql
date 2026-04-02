/*
HTTP GET
@nested
@param $1 authorId int default null
*/
select
    row(a.author_id, first_name, last_name)::example_12.authors as author,
    count(b.*) as books
from example_12.authors a
left join example_12.books b using (author_id)
where
    $1 is null or author_id = $1
group by
    a.author_id, first_name, last_name;

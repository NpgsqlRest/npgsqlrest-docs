/*
HTTP GET
@param $1 authorId int
*/
select first_name, last_name, count(b.*) as books
from example_12.authors a
left join example_12.books b using (author_id)
where author_id = $1
group by author_id, first_name, last_name;

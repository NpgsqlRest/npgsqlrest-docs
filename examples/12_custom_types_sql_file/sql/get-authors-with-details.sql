-- HTTP GET
-- @param $1 id
select a.*, count(b.id) as books
from example_12.authors a
left join example_12.books b on b.author_id = a.id
where $1::int is null or a.id = $1::int
group by a.id;

-- HTTP GET
-- @param $1 id
select a.first_name, a.last_name, count(b.id) as books
from example_12.authors a
left join example_12.books b on b.author_id = a.id
where a.id = $1::int
group by a.first_name, a.last_name;

-- HTTP GET
-- @param $1 id
select
    a.id,
    a.first_name,
    a.last_name,
    coalesce(
        json_agg(
            json_build_object('id', b.id, 'title', b.title, 'published_year', b.published_year)
        ) filter (where b.id is not null),
        '[]'::json
    ) as books
from example_12.authors a
left join example_12.books b on b.author_id = a.id
where $1::int is null or a.id = $1::int
group by a.id;

-- HTTP GET
-- @param $1 id
select
    a.id,
    a.first_name,
    a.last_name,
    coalesce(
        json_agg(
            json_build_object(
                'id', b.id,
                'title', b.title,
                'published_year', b.published_year,
                'reviews', (
                    select coalesce(json_agg(
                        json_build_object('reviewer', r.reviewer, 'rating', r.rating, 'comment', r.comment)
                    ), '[]'::json)
                    from example_12.reviews r where r.book_id = b.id
                )
            )
        ) filter (where b.id is not null),
        '[]'::json
    ) as books
from example_12.authors a
left join example_12.books b on b.author_id = a.id
where $1::int is null or a.id = $1::int
group by a.id;

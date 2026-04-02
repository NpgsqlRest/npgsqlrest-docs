/*
HTTP GET
@nested
@param $1 authorId int default null
*/
select
    row(
        a.author_id,
        first_name,
        last_name
    )::example_12.authors as author,
    row(
        count(distinct b.book_id),
        count(r.review_id),
        avg(r.rating)
    )::example_12.books_info as books_info
from
    example_12.authors a
    left join example_12.books b using (author_id)
    left join example_12.reviews r on b.book_id = r.book_id
where
    $1 is null or author_id = $1
group by
    a.author_id, first_name, last_name;

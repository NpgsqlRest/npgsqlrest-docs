drop schema if exists example_12 cascade;
create schema example_12;

create table example_12.authors (
    author_id int not null generated always as identity primary key,
    first_name text,
    last_name text
);

create table example_12.books (
    book_id int not null generated always as identity primary key,
    title text not null,
    author_id int references example_12.authors(author_id)
);

create table example_12.reviews (
    review_id int not null generated always as identity primary key,
    book_id int references example_12.books(book_id),
    reviewer_name text,
    rating int check (rating between 1 and 5),
    review_text text,
    created_at timestamp default now()
);

-- Test data for authors
insert into example_12.authors (first_name, last_name) values
    ('George', 'Orwell'),
    ('Jane', 'Austen'),
    ('Ernest', 'Hemingway'),
    ('Virginia', 'Woolf'),
    ('Franz', 'Kafka');

-- Test data for books
insert into example_12.books (title, author_id) values
    ('1984', 1),
    ('Animal Farm', 1),
    ('Pride and Prejudice', 2),
    ('Sense and Sensibility', 2),
    ('The Old Man and the Sea', 3),
    ('A Farewell to Arms', 3),
    ('Mrs Dalloway', 4),
    ('To the Lighthouse', 4),
    ('The Metamorphosis', 5),
    ('The Trial', 5);

-- Test data for reviews
insert into example_12.reviews (book_id, reviewer_name, rating, review_text) values
    (1, 'Alice Johnson', 5, 'A chilling and prophetic masterpiece.'),
    (1, 'Bob Smith', 4, 'Thought-provoking but bleak.'),
    (1, 'Carol White', 5, 'Essential reading for everyone.'),
    (2, 'David Brown', 5, 'Brilliant political allegory.'),
    (2, 'Eve Davis', 4, 'Simple yet profound.'),
    (3, 'Frank Miller', 5, 'The perfect romance novel.'),
    (3, 'Grace Lee', 5, 'Witty and timeless.'),
    (4, 'Henry Wilson', 4, 'Austen at her finest.'),
    (5, 'Ivy Chen', 5, 'Beautiful and moving.'),
    (5, 'Jack Taylor', 4, 'A short but powerful read.'),
    (6, 'Karen Adams', 4, 'Hemingway''s prose shines.'),
    (7, 'Leo Garcia', 5, 'Stream of consciousness done right.'),
    (8, 'Mia Robinson', 4, 'Poetic and haunting.'),
    (9, 'Noah Martinez', 5, 'Surreal and unforgettable.'),
    (9, 'Olivia Clark', 3, 'Disturbing but brilliant.'),
    (10, 'Paul Wright', 4, 'Kafka at his most absurd.');


/*
* Get author by ID or all authors if ID is null and return author object from table type
*/
create function example_12.get_author(
    _author_id int
)
returns example_12.authors
language sql
as $$
select author_id, first_name, last_name
from example_12.authors
where author_id = _author_id;
$$;
comment on function example_12.get_author(int) is 'HTTP GET';


create type example_12.author_info as (
    first_name text,
    last_name text,
    books int
);

/*
* Get author info by ID and return custom type with additional info
*/
create function example_12.get_author_info(
    _author_id int
)
returns example_12.author_info
language sql
as $$
select first_name, last_name, count(b.*)
from example_12.authors a
left join example_12.books b using (author_id)
where author_id = _author_id
group by author_id, first_name, last_name;
$$;
comment on function example_12.get_author_info(int) is 'HTTP GET';

/*
* Get author by ID or all authors if ID is null and return author object from table type
*/
create function example_12.get_authors(
    _author_id int
)
returns setof example_12.authors
language sql
as $$
select author_id, first_name, last_name
from example_12.authors
where 
    _author_id is null or author_id = _author_id;
$$;
comment on function example_12.get_authors(int) is 'HTTP GET';



/*
* Get authors by matching fields in author object or all authors if all fields are null
* Demonstrates passing custom type as parameter to function. It can be user-defined type or table type.
* Type fields are unnested into individual parameters: authorAuthorId, authorFirstName, authorLastName
*/
create function example_12.get_authors(
    _author example_12.authors
)
returns setof example_12.authors
language sql
as $$
select author_id, first_name, last_name
from example_12.authors
where 
    (_author.author_id is null or author_id = _author.author_id)
    and (_author.first_name is null or first_name = _author.first_name)
    and (_author.last_name is null or last_name = _author.last_name);
$$;
comment on function example_12.get_authors(example_12.authors) is 'HTTP GET'; 


/*
* Create author by passing author object as parameter to function.
* Demonstrates passing custom type as parameter to function. It can be user-defined type or table type.
* Type fields are unnested into individual parameters: authorFirstName, authorLastName
*/
create function example_12.create_author(
    _author example_12.authors
)
returns example_12.authors
language sql
as $$
insert into example_12.authors (first_name, last_name)
values (_author.first_name,  _author.last_name)
returning author_id, first_name, last_name;
$$;
comment on function example_12.create_author(example_12.authors) is 'HTTP POST'; 

/*
* Demostrates returning custom type from function along with additional fields.
* Type can be user-defined type or table type.
* Results are unnested by default into individual fields in the response:
[{
    "authorId": 1,
    "firstName": "George",
    "lastName": "Orwell",
    "books": 2
}, ...]
*/
create function example_12.get_authors_with_details(
    _author_id int
)
returns table(
    author example_12.authors,
    books int
)
language sql
as $$
select 
    row(a.author_id, first_name, last_name), 
    count(b.*)
from example_12.authors a join example_12.books b using (author_id)
where 
    _author_id is null or author_id = _author_id
group by 
    a.author_id, first_name, last_name;
$$;
comment on function example_12.get_authors_with_details(int) is 'HTTP GET';


/*
* Demostrates returning custom type from function along with additional fields where custom type is nested in response.
* Results are nested under "author" field in the response:
[{
    "author": {
        "authorId": 1,
        "firstName": "George",
        "lastName": "Orwell"
    },
    "books": 2
}, ...]
*/
create function example_12.get_authors_with_details_nested(
    _author_id int
)
returns table(
    author example_12.authors,
    books int
)
language sql
as $$
select 
    row(a.author_id, first_name, last_name), 
    count(b.*)
from 
    example_12.authors a 
    left join example_12.books b using (author_id)
where 
    _author_id is null or author_id = _author_id
group by 
    a.author_id, first_name, last_name;
$$;
comment on function example_12.get_authors_with_details_nested(int) is '
HTTP GET
@nested
';



create type example_12.books_info as (
    books int,
    active_reviews int,
    avg_rating numeric
);

create function example_12.get_authors_with_details_type(
    _author_id int
)
returns table(
    author example_12.authors,
    books_info example_12.books_info
)
language sql
as $$
select 
    row(
        a.author_id, 
        first_name, 
        last_name
    ), (
        count(distinct b.book_id), 
        count(r.review_id), 
        avg(r.rating)
    )
from 
    example_12.authors a 
    left join example_12.books b using (author_id)
    left join example_12.reviews r on b.book_id = r.book_id
where 
    _author_id is null or author_id = _author_id
group by 
    a.author_id, first_name, last_name;
$$;
comment on function example_12.get_authors_with_details_type(int) is '
HTTP GET
';

/*
* Demostrates returning two custom types from function, first is table type and second is user-defined type.
* Results are nested under "booksInfo" field in the response:
[{
    "author": {
        "authorId": 1,
        "firstName": "George",
        "lastName": "Orwell"
    },
    "booksInfo": {
        "books": 2,
        "activeReviews": 3,
        "avgRating": 4.67
    }
}, ...]
*/
create function example_12.get_authors_with_details_type_nested(
    _author_id int
)
returns table(
    author example_12.authors,
    books_info example_12.books_info
)
language sql
as $$
select 
    row(
        a.author_id, 
        first_name, 
        last_name
    ), (
        count(distinct b.book_id), 
        count(r.review_id), 
        avg(r.rating)
    )
from 
    example_12.authors a 
    left join example_12.books b using (author_id)
    left join example_12.reviews r on b.book_id = r.book_id
where 
    _author_id is null or author_id = _author_id
group by 
    a.author_id, first_name, last_name;
$$;
comment on function example_12.get_authors_with_details_type_nested(int) is '
HTTP GET
@nested
';


/*
* Demostrates returning custom type array from function along with additional fields where custom type is nested in response.
* Essentially PostgreSQL's practical equivalent to MULTISET for REST API scenarios.
* Results are nested under "books" field in the response:
[{
    "author": {
        "authorId": 1,
        "firstName": "George",
        "lastName": "Orwell"
    },
    "books": [
        {
            "bookId": 1,
            "title": "1984",
            "authorId": 1
        },
        {
            "bookId": 2,
            "title": "Animal Farm",
            "authorId": 1
        }
    ]
}, ...]
*/
create function example_12.get_authors_and_books(
    _author_id int
)
returns table(
    author example_12.authors,
    books example_12.books[]
)
language sql
as $$
select
    row(
        a.author_id, first_name, last_name
    ),
    array_agg(
        row(b.book_id, b.title, b.author_id)::example_12.books
    )
from 
    example_12.authors a 
    left join example_12.books b using (author_id)
where 
    _author_id is null or author_id = _author_id
group by 
    a.author_id, first_name, last_name;
$$;
comment on function example_12.get_authors_and_books(int) is '
HTTP GET
@nested
';




create type example_12.book_details as (
    book_id int,
    title text,
    reviews example_12.reviews[]
);

create or replace function example_12.get_authors_and_books_and_reviews(
    _author_id int
)
returns table(
    author example_12.authors,
    books example_12.book_details[]
)
language plpgsql
as $$
begin
    create temporary table temp_book_reviews on commit drop as
    select
        book_id,
        array_agg(
            row(
                review_id,
                book_id,
                reviewer_name,
                rating,
                review_text,
                created_at
            )::example_12.reviews
        ) as reviews
    from example_12.reviews
    where book_id in (
        select book_id
        from example_12.books
        where 
            _author_id is null or author_id = _author_id
    )
    group by book_id;

    return query
    select
        row(
            a.author_id, 
            first_name, 
            last_name
        )::example_12.authors,

        array_agg(
            row(
                b.book_id,
                b.title,
                (select reviews from temp_book_reviews tbr where tbr.book_id = b.book_id limit 1)
            )::example_12.book_details
        )
    from 
        example_12.authors a 
        left join example_12.books b using (author_id)
        --left join example_12.reviews r using (book_id)
    where 
        _author_id is null or author_id = _author_id
    group by 
        a.author_id, first_name, last_name;
end;
$$;
comment on function example_12.get_authors_and_books_and_reviews(int) is '
HTTP GET
@nested
';


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

create type example_12.author_info as (
    first_name text,
    last_name text,
    books int
);

create type example_12.books_info as (
    books int,
    active_reviews int,
    avg_rating numeric
);

create type example_12.book_details as (
    book_id int,
    title text,
    reviews example_12.reviews[]
);

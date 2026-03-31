-- recreate entire schema example_2
drop schema if exists example_2 cascade;
create schema example_2;

create table example_2.users (
    user_id int primary key generated always as identity,
    username text not null,
    email text not null,
    active boolean not null default true
);

insert into example_2.users (username, email, active) values
('alice', 'alice@example.com', true),
('bob', 'bob@example.com', true),
('charlie', 'charlie@example.com', true);

create table example_2.posts (
    post_id int primary key generated always as identity,
    user_id int references example_2.users(user_id) deferrable,
    content text not null,
    created_at timestamp not null default now()
);

insert into example_2.posts (user_id, content, created_at) values
(1, 'Hello world! This is my first post.', '2024-01-15 10:30:00'),
(1, 'Learning PostgreSQL is fun!', '2024-01-16 14:20:00'),
(2, 'Just joined this platform.', '2024-01-17 09:00:00'),
(3, 'Anyone here interested in databases?', '2024-01-18 11:45:00'),
(2, 'Working on a new project today.', '2024-01-19 16:30:00');

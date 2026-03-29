drop schema if exists example_2 cascade;
create schema if not exists example_2;

create table example_2.users (
    id int generated always as identity primary key,
    username text not null,
    email text not null
);

create table example_2.posts (
    id int generated always as identity primary key,
    user_id int not null references example_2.users(id),
    content text not null,
    created_at timestamptz not null default now()
);

insert into example_2.users (username, email)
values
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com');

insert into example_2.posts (user_id, content)
values
    (1, 'Hello from Alice!'),
    (2, 'Hello from Bob!'),
    (1, 'Another post from Alice.');

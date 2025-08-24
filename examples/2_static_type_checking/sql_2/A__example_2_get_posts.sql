create or replace function example_2.get_posts()
returns table(
    username text,
    content text,
    created_at timestamp
)
language sql
as $$
select u.username, p.content, p.created_at
from example_2.posts p join example_2.users u using(user_id)
where u.active = true
$$;

comment on function example_2.get_posts() is 'HTTP GET';

do
$$
begin
    assert (
        select count(*) = 5 
        from example_2.get_posts() 
        where (username, content, created_at) in (
            ('alice', 'Hello world! This is my first post.', '2024-01-15 10:30:00'::timestamp),
            ('alice', 'Learning PostgreSQL is fun!', '2024-01-16 14:20:00'::timestamp),
            ('bob', 'Just joined this platform.', '2024-01-17 09:00:00'::timestamp),
            ('charlie', 'Anyone here interested in databases?', '2024-01-18 11:45:00'::timestamp),
            ('bob', 'Working on a new project today.', '2024-01-19 16:30:00'::timestamp)
        )
    ), 'get_posts() does not contain expected data';
end;
$$;

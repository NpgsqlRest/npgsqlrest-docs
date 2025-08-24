create or replace function example_2.get_users()
returns setof example_2.users
language sql
as $$
select user_id, username, email, active from example_2.users;
$$;

comment on function example_2.get_users() is 'HTTP GET';

do
$$
begin
    assert (
        select count(*) = 3 
        from example_2.get_users() 
        where (user_id, username, email, active) in (
            (1, 'alice', 'alice@example.com', true),
            (2, 'bob', 'bob@example.com', true),
            (3, 'charlie', 'charlie@example.com', true)
        )
    ), 'get_users() does not contain expected data';
end;
$$;
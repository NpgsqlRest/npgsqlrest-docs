create or replace function example_3_public.login(
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    username text,
    email text
)
language sql
set search_path = pg_catalog, pg_temp
security definer
as $$
select
    -- only 'cookies' scheme is supported in this example
    'cookies' as scheme,
    user_id,
    username,
    email
from example_3.users
where 
    username = _username
    and example_3.verify_password(_password, password_hash);
$$;

comment on function example_3_public.login(text, text) is '
HTTP POST
login
@anonymous';

do
$$
begin
    assert (
        select count(*) = 1 
        from example_3_public.login('alice', 'password123')
        where (scheme, user_id, username, email) in (
            ('cookies', 1, 'alice', 'alice@example.com')
        )
    );

    assert (
        select count(*) = 0
        from example_3_public.login('alice', 'wrongpassword')
        where (scheme, user_id, username, email) in (
            ('cookies', 1, 'alice', 'alice@example.com')
        )
    );
end;
$$;

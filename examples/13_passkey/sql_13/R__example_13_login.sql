-- Login function for demo authentication
create or replace function example_13.login(
    _username text,
    _password text
)
returns table (
    scheme text,
    user_id int,
    username text,
    email text,
    message jsonb
)
language sql
as $$
select
    'cookies' as scheme,
    u.user_id,
    u.username,
    u.email,
    jsonb_build_object('userId', u.user_id, 'username', u.username, 'email', u.email)
from example_13.users u
where 
    u.username = _username 
    and u.password = _password -- no hashing for simplicity
$$;

comment on function example_13.login(text, text) is '
HTTP POST
@login
@anonymous';

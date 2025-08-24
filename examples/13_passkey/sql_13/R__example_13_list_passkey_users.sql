/*
Lists all users with passwordsalong with their passkey status
This is for demo purposes only. In real applications, never expose passwords.
*/
create or replace function example_13.list_passkey_users()
returns table (
    user_id int,
    username text,
    pass text,
    email text,
    passkey_enabled boolean
)
language sql
as $$
select
    u.user_id,
    username,
    password,
    email,
    p.credential_id is not null as passkey_enabled
from example_13.users u left join example_13.passkeys p using(user_id)
$$;

comment on function example_13.list_passkey_users() is '
HTTP GET
@anonymous';

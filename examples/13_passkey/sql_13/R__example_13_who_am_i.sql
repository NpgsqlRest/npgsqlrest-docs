create or replace function example_13.who_am_i(
    _user_id text = null,
    _username text = null,
    _email text = null
)
returns table (
    user_id text,
    username text,
    email text
)
language sql
as $$
select 
    _user_id,
    _username,
    _email
$$;

comment on function example_13.who_am_i(text, text, text) is '
HTTP GET
@authorize';

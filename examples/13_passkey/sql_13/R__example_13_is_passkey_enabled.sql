create or replace function example_13.is_passkey_enabled(
    _user_id text = null
)
returns boolean
language sql
as $$
select exists (
    select 1
    from example_13.passkeys
    where user_id = _user_id::int
);
$$;

comment on function example_13.is_passkey_enabled(text) is '
HTTP GET
@authorize';

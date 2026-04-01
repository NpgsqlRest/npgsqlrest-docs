-- Set by configuration, executed when password verification succeeds
create or replace procedure example_4.password_verification_succeeded(
    _scheme text,
    _user_id text,
    _user_name text
) 
language plpgsql
set search_path = pg_catalog, pg_temp
as 
$$
begin
    -- update last login timestamp and provider
    update example_4.users
    set 
        last_login = now(),
        last_login_provider = _scheme
    where user_id = _user_id::int;

    raise notice 'Password verification succeeded for user % (ID: %) using scheme %', _user_name, _user_id, _scheme;
end;
$$;

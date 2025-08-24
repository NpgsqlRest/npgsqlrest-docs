-- Set by configuration, executed when password verification fails
create or replace procedure example_4.password_verification_failed(
    _scheme text,
    _user_id text,
    _user_name text
) 
language plpgsql
set search_path = pg_catalog, pg_temp
as 
$$
begin
    -- log failed attempt, increment counters, etc.
    raise warning 'Password verification failed for user % (ID: %) using scheme %', _user_name, _user_id, _scheme;
end;
$$;

create or replace function example_4.external_login(
    _provider text,
    _email text,
    _name text,
    _provider_data json,
    _analytics_data json
)
returns table (
    scheme text,
    user_id int,
    username text,
    roles text[],
    email text
)
language plpgsql
set search_path = public, pg_catalog
as
$$
declare 
    _user_id int;
begin
    return query
    select
        'cookies' as scheme, -- external logins use 'cookies' scheme by default
        u.user_id,
        u.username,
        u.roles,
        u.email
    from example_4.users u
    where
        u.username = _email;

    if not found then
        raise warning 'Could not not find user with email % for external provider %, provider data %, user analytics data %', 
            _email, _provider, _provider_data, _analytics_data;
    else 
        _user_id = (
            select u.user_id
            from example_4.users u
            where u.username = _email
        );
        
        raise notice 'External login succeeded for user % (ID: %) using provider %, provider data %, user analytics data %', 
            _email, _user_id, _provider, _provider_data, _analytics_data;

        update example_4.users
        set 
            last_login = now(),
            last_login_provider = _provider
        where example_4.users.user_id = _user_id;
    end if;
end
$$;

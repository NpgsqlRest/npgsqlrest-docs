create or replace function example_13.passkey_complete_authenticate(
    _credential_id bytea,
    _new_sign_count bigint,
    _user_context json,
    _analytics_data json default null
)
returns table (
    scheme text,
    user_id int,
    username text,
    email text,
    message jsonb
)
security definer
language plpgsql
as $$
declare
    _user_id int = (_user_context->>'id')::int;
begin
    -- Update sign count and last used timestamp
    if _new_sign_count > 0 then
        update example_13.passkeys
        set sign_count = _new_sign_count, last_used_at = now()
        where credential_id = _credential_id;
    else
        update example_13.passkeys
        set last_used_at = now()
        where credential_id = _credential_id;
    end if;

    -- Log authentication event with analytics data
    if _analytics_data is not null then
        insert into example_13.auth_audit_log (user_id, event_type, analytics_data, ip_address)
        values (
            _user_id,
            'passkey_login',
            _analytics_data,
            _analytics_data->>'ip'
        );
    end if;

    -- Return user claims for JWT/cookie authentication
    return query
    select
        'cookies' as scheme,
        u.user_id,
        u.username,
        u.email,
        jsonb_build_object('userId', u.user_id, 'username', u.username, 'email', u.email)
    from example_13.users u
    where u.user_id = _user_id;
end;
$$;
create or replace function example_13.passkey_challenge_authentication(
    _user_name text,
    _body json
)
returns table (
    status int,
    message text,
    challenge text,
    challenge_id bigint,
    allow_credentials text
)
security definer
language plpgsql
as $$
declare
    _challenge bytea;
    _challenge_id bigint;
    _allow_creds jsonb;
    _user_id int;
    _expire_interval interval = interval '5 minutes';
begin
    -- Generate challenge
    _challenge = example_13.gen_random_bytes(32);

    -- If userName provided, look up user and get their credentials
    if _user_name is not null and _user_name <> '' then
        _user_id = (select user_id from example_13.users where username = _user_name);
        if _user_id is null then
            -- User not found
            return query select 400, 'Bad request'::text, null::text, null::bigint, null::text;
            return;
        end if;

        -- Get user's existing credentials for allowCredentials list
        select jsonb_agg(jsonb_build_object(
            'type', 'public-key',
            'id', encode(pk.credential_id, 'base64'),
            'transports', pk.transports
        ))
        into _allow_creds
        from example_13.passkeys pk
        where pk.user_id = _user_id;
    end if;
    -- If userName is null/empty, _user_id stays null and _allow_creds stays null
    -- This is the discoverable credential flow

    -- Store challenge (user_id may be null for discoverable credentials)
    insert into example_13.passkey_challenges (challenge, user_id, operation, expires_at)
    values (_challenge, _user_id, 'authentication', now() + _expire_interval)
    returning id into _challenge_id;

    -- Return options
    -- For discoverable credentials: allowCredentials is null/empty, authenticator shows all passkeys
    -- For non-discoverable: allowCredentials contains user's credentials
    return query select
        200,
        null::text,
        encode(_challenge, 'base64'),
        _challenge_id,
        coalesce(_allow_creds::text, '[]');
end;
$$;

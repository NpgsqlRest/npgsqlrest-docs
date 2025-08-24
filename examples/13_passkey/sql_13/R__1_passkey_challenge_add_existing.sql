create or replace function example_13.passkey_challenge_add_existing(
    _claims json,
    _body json
)
returns table (
    status int,
    message text,
    challenge text,
    challenge_id bigint,
    user_handle text,
    user_name text,
    user_display_name text,
    exclude_credentials text,
    user_context json
)
security definer
language plpgsql
as $$
declare
    _expire_interval interval = interval '5 minutes';

    -- User info comes from authenticated session claims
    _user_id int = (_claims->>'user_id')::int;
    _device_name text = _body->>'deviceName';

    _user record;
    _user_handle bytea;
    _challenge bytea;
    _challenge_id bigint;
    _exclude_creds jsonb;
begin
    -- Verify user exists
    select user_id, username
    into _user
    from example_13.users
    where user_id = _user_id;

    if _user is null then
        return query select 404, 'User not found'::text, null::text, null::bigint,
            null::text, null::text, null::text, null::text, null::json;
        return;
    end if;

    -- Generate new user handle (random 32 bytes, unique per passkey)
    _user_handle = example_13.gen_random_bytes(32);

    -- Generate challenge
    _challenge = example_13.gen_random_bytes(32);

    -- Store challenge with user_id (for add-passkey flow)
    insert into example_13.passkey_challenges (challenge, user_id, operation, expires_at)
    values (_challenge, _user_id, 'registration', now() + _expire_interval)
    returning id into _challenge_id;

    -- Get user's existing credentials for excludeCredentials list
    -- This prevents re-registering the same authenticator
    select jsonb_agg(jsonb_build_object(
        'type', 'public-key',
        'id', encode(pk.credential_id, 'base64'),
        'transports', pk.transports
    ))
    into _exclude_creds
    from example_13.passkeys pk
    where pk.user_id = _user_id;

    -- Return options
    return query select
        200,                                            -- HTTP status
        null::text,                                     -- message (null on success)
        encode(_challenge, 'base64'),                   -- challenge for WebAuthn
        _challenge_id,                                  -- challenge id to verify later
        encode(_user_handle, 'base64'),                 -- user handle for WebAuthn
        _user.username,                                 -- user name for WebAuthn prompt
        coalesce(
            _body->>'displayName', 
            _user.username
        ),                                              -- display name for WebAuthn prompt
        coalesce(_exclude_creds::text, '[]'),           -- exclude_credentials: user's existing passkeys
        json_build_object(                              -- user_context: passed through to passkey_registration_complete
            'id', _user_id,                             -- existing user id (triggers add-passkey flow)
            'userHandle', encode(_user_handle, 'base64'),
            'deviceName', _device_name
        );
end;
$$;

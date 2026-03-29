create or replace function example_13.passkey_challenge_registration(
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

    _user_name text = _body->>'userName';
    _email text = _body->>'email';

    _user_handle bytea;
    _challenge bytea;
    _challenge_id bigint;
begin
    assert _user_name is not null and _user_name <> '';
 
    -- Generate new user handle (random 32 bytes, will be stored with the passkey)
    _user_handle = example_13.gen_random_bytes(32);

    -- Generate challenge
    _challenge = example_13.gen_random_bytes(32);

    -- Store challenge (user_id is null since user doesn't exist yet)
    insert into example_13.passkey_challenges (challenge, user_id, operation, expires_at)
    values (_challenge, null, 'registration', now() + _expire_interval)
    returning id into _challenge_id;

    -- Return options - user creation is deferred to passkey_registration_complete
    -- exclude_credentials is always empty for standalone registration (new user)
    return query select
        200,                                -- HTTP status
        null::text,                         -- message (null on success)
        encode(_challenge, 'base64'),       -- challenge for WebAuthn
        _challenge_id,                      -- challenge id to verify later
        encode(_user_handle, 'base64'),     -- user handle for WebAuthn
        _user_name,                         -- user name for WebAuthn prompt
        coalesce(
            _body->>'displayName', 
            _user_name
        ),                                  -- display name for WebAuthn prompt
        '[]'::text,                         -- exclude_credentials: always empty for new user
        json_build_object(                  -- user_context: passed through to passkey_registration_complete
            'userName', _user_name,
            'email', _email,
            'deviceName', _body->>'deviceName'
        );
end;
$$;

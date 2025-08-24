create function example_13.passkey_authenticate_data(
    _credential_id bytea
)
returns table (
    status int,
    message text,
    public_key bytea,
    public_key_algorithm int,
    sign_count bigint,
    user_context json
)
security definer
language plpgsql
as $$
declare
    _cred record;
begin
    -- Get credential data
    select p.user_id, p.public_key, p.public_key_algorithm, p.sign_count
    into _cred
    from example_13.passkeys p
    where p.credential_id = _credential_id;

    if _cred is null then
        return query select 404, 'Credential not found'::text, null::bytea, null::int, null::bigint, null::json;
        return;
    end if;

    raise info 'passkey_authenticate_data: found credential for user_id=%', _cred.user_id;

    -- Return all data needed for signature verification
    return query select
        200,                                -- status
        'OK'::text,                         -- message
        _cred.public_key,                   -- public_key
        _cred.public_key_algorithm,         -- public_key_algorithm
        _cred.sign_count,                   -- sign_count
        json_build_object(                  -- user_context: passed through to passkey_authenticate_complete
            'id', _cred.user_id
        );
end;
$$;
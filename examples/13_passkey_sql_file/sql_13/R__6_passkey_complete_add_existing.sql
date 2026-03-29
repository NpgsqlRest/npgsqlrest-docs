create or replace function example_13.passkey_complete_add_existing(
    _credential_id bytea,
    _user_handle bytea,
    _public_key bytea,
    _algorithm int,
    _transports text[],
    _backup_eligible boolean,
    _user_context json,
    _analytics_data json default null
)
returns table (status int, message text)
security definer
language plpgsql
as $$
declare
    _user_id int;
    _device_name text;
begin
    -- Check for duplicate credential first
    if exists (select 1 from example_13.passkeys where credential_id = _credential_id) then
        return query select 409, 'Credential already registered'::text;
        return;
    end if;

    -- Extract user_id from user_context (REQUIRED for add-existing flow)
    _user_id = (_user_context->>'id')::int;
    _device_name = _user_context->>'deviceName';

    if _user_id is null then
        return query select 400, 'user_context must contain user id for add-existing flow'::text;
        return;
    end if;

    -- Verify user exists
    if not exists (select 1 from example_13.users where _user_id = _user_id) then
        return query select 404, 'User not found'::text;
        return;
    end if;

    -- Store the credential
    insert into example_13.passkeys (
        credential_id, user_id, user_handle, public_key,
        public_key_algorithm, transports, backup_eligible, device_name
    ) values (
        _credential_id, _user_id, _user_handle, _public_key,
        _algorithm, _transports, _backup_eligible, _device_name
    );

    -- Log registration event with analytics data (optional)
    if _analytics_data is not null then
        insert into example_13.auth_audit_log (user_id, event_type, analytics_data, ip_address)
        values (
            _user_id,
            'passkey_add_existing',
            _analytics_data,
            _analytics_data->>'ip'
        );
    end if;

    return query select 200, 'Passkey added successfully'::text;
end;
$$;

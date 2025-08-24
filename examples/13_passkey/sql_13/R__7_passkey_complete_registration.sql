create or replace function example_13.passkey_complete_registration(
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
    _user_name text;
    _email text;
    _device_name text;
    _unique_username text;
    _suffix text;
    _attempt int = 0;
    _max_attempts int = 10;
begin
    -- Check for duplicate credential first
    if exists (select 1 from example_13.passkeys where credential_id = _credential_id) then
        return query select 409, 'Credential already registered'::text;
        return;
    end if;

    _user_name = _user_context->>'userName';
    _email = _user_context->>'email';
    _device_name = _user_context->>'deviceName';

    if _user_name is null or _user_name = '' then
        return query select 400, 'userName is required'::text;
        return;
    end if;

    -- Try to create user, adding random suffix on conflict
    _suffix = '';
    loop
        _unique_username = _user_name || _suffix;

        begin
            insert into example_13.users (username, email)
            values (_unique_username, _email)
            returning user_id into _user_id;

            exit; -- Success, exit loop
        exception when unique_violation then
            _attempt = _attempt + 1;
            if _attempt >= _max_attempts then
                return query select 500, 'Failed to create unique username'::text;
                return;
            end if;
            _suffix = '_' || substr(md5(random()::text), 1, 4);
        end;
    end loop;

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
            'passkey_register',
            _analytics_data,
            _analytics_data->>'ip'
        );
    end if;

    return query select 200, 'Passkey registered successfully'::text;
end;
$$;
/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id
*/
select exists (
    select 1
    from example_13.passkeys
    where user_id = $1::int
) as is_passkey_enabled;

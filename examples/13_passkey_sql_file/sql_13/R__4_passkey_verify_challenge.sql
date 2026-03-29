create or replace function example_13.passkey_verify_challenge(
    _challenge_id bigint,
    _operation text
) 
returns bytea 
security definer
language plpgsql
as $$
declare
    _challenge bytea;
begin
    -- Delete and return the challenge (atomic consume)
    delete from example_13.passkey_challenges
    where 
        id = _challenge_id
        and operation = _operation
        and expires_at > now()
    returning challenge into _challenge;

    return _challenge;
end;
$$;
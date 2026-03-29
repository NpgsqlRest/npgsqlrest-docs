create or replace function example_3.verify_password(
    _input text,
    _array text[]
)
returns boolean
parallel safe
set search_path = pg_catalog, pg_temp
language plpgsql
as
$$
declare
    _segment text;
    _max_len constant int = 72;
    _expected_segments int;
    _segment_count int = 0;
begin
    for _i in 0..ceil(length(_input) / _max_len) + 1 loop
        _segment = substring(_input from _i * _max_len + 1 for _max_len);
        if length(_segment) > 0 then
            _segment_count = _segment_count + 1;
            if example_3.crypt(_segment, _array[_i+1]) <> _array[_i+1] then
                return false;
            end if;
        end if;
    end loop;

    -- Ensure the hash array has exactly the expected number of segments
    if coalesce(array_length(_array, 1), 0) <> _segment_count then
        return false;
    end if;

    return true;
end;
$$;

do
$$
declare
    _hash text[];
    _long_password text;
begin
    -- Test 1: Simple password hash and verify
    _hash = example_3.hash_password('mypassword123');
    assert example_3.verify_password('mypassword123', _hash),
        'Test 1 failed: correct password should verify';

    -- Test 2: Wrong password should not verify
    assert not example_3.verify_password('wrongpassword', _hash),
        'Test 2 failed: wrong password should not verify';

    -- Test 3: Empty string vs actual password
    assert not example_3.verify_password('', _hash),
        'Test 3 failed: empty string should not verify against non-empty hash';

    -- Test 4: Empty password hash and verify
    _hash = example_3.hash_password('');
    assert example_3.verify_password('', _hash),
        'Test 4 failed: empty password should verify against its own hash';

    -- Test 5: Long password (> 72 chars to test segmentation)
    _long_password = repeat('a', 100);
    _hash = example_3.hash_password(_long_password);
    assert array_length(_hash, 1) > 1,
        'Test 5a failed: long password should produce multiple hash segments';
    assert example_3.verify_password(_long_password, _hash),
        'Test 5b failed: long password should verify correctly';

    -- Test 6: Very long password (> 144 chars for 3 segments)
    _long_password = repeat('x', 200);
    _hash = example_3.hash_password(_long_password);
    assert array_length(_hash, 1) >= 3,
        'Test 6a failed: very long password should produce 3+ hash segments';
    assert example_3.verify_password(_long_password, _hash),
        'Test 6b failed: very long password should verify correctly';
    assert not example_3.verify_password(repeat('y', 200), _hash),
        'Test 6c failed: different long password should not verify';

    -- Test 7: Special characters
    _hash = example_3.hash_password('p@!?w0rd!#%&*()');
    assert example_3.verify_password('p@!?w0rd!#%&*()', _hash),
        'Test 7 failed: special characters should hash and verify correctly';

    -- Test 8: Unicode characters
    _hash = example_3.hash_password('пароль密码🔐');
    assert example_3.verify_password('пароль密码🔐', _hash),
        'Test 8 failed: unicode characters should hash and verify correctly';

    raise notice 'All password hash/verify tests passed!';
end;
$$;

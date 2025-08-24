--
-- Bcrypt has a 72-byte input limit - any characters beyond that are silently ignored.
-- This function overcomes that limitation by splitting passwords into 72-char segments,
-- hashing each segment separately, and returning an array of hashes.
-- This allows secure hashing of passwords with unlimited length.
--
create or replace function example_3.hash_password(
    _input text
)
returns text[]
set search_path = pg_catalog, pg_temp
language plpgsql
as
$$
declare
    _segment text;
    _result text[] = '{}';
    _alg text = 'bf';
    _i int;
    _max_len constant int = 72;
begin
    for _i in 0..ceil(length(_input) / _max_len) + 1 loop
        _segment = substring(_input from _i * _max_len + 1 for _max_len);
        if length(_segment) > 0 then
            _result = array_append(_result, example_3.crypt(_segment, example_3.gen_salt(_alg)));
        end if;
    end loop;

    return _result;
end;
$$;
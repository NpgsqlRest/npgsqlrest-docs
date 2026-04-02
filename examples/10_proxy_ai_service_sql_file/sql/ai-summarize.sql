/*
HTTP POST /ai/summarize
@authorize
@proxy POST

@param $1 text text
@param $2 maxLength int default 150

@param $3 _proxy_status_code int default null
@param $4 _proxy_body text default null
@param $5 _proxy_success boolean default null
@param $6 _proxy_error_message text default null
*/

begin;

-- @skip
create temp table _var on commit drop as
select
    $1::text as _text,
    $2::int as _max_length,
    $3::int as _proxy_status_code,
    $4::text as _proxy_body,
    $5::boolean as _proxy_success,
    $6::text as _proxy_error_message;

do
$$
declare
    _text text = (select _text from _var);
    _max_length int = (select _max_length from _var);
    _proxy_status_code int = (select _proxy_status_code from _var);
    _proxy_body text = (select _proxy_body from _var);
    _proxy_success boolean = (select _proxy_success from _var);
    _proxy_error_message text = (select _proxy_error_message from _var);

    _text_hash text;
    _cached json;
    _result json;
begin
    -- Check cache first
    _text_hash := md5(_text || '::' || _max_length::text);

    select json_build_object(
        'summary', ac.summary,
        'original_length', length(_text),
        'summary_length', length(ac.summary),
        'cached', true,
        'cache_hits', ac.accessed_count
    )
    into _cached
    from example_10.analysis_cache ac
    where ac.text_hash = _text_hash;

    if _cached is not null then
        -- Update cache stats
        update example_10.analysis_cache
        set accessed_count = accessed_count + 1,
            last_accessed_at = now()
        where text_hash = _text_hash;

        create temp table _result_out on commit drop as
        select _cached as result;
        return;
    end if;

    -- Handle proxy errors
    if not _proxy_success then
        create temp table _result_out on commit drop as
        select json_build_object(
            'error', coalesce(_proxy_error_message, 'AI service unavailable'),
            'status_code', _proxy_status_code
        ) as result;
        return;
    end if;

    -- Parse and cache the response
    _result := _proxy_body::json;

    insert into example_10.analysis_cache (text_hash, text_preview, summary, model_version)
    values (
        _text_hash,
        left(_text, 100),
        _result->>'summary',
        _result->>'model'
    );

    -- Return enriched response
    create temp table _result_out on commit drop as
    select json_build_object(
        'summary', _result->>'summary',
        'original_length', (_result->>'original_length')::int,
        'summary_length', (_result->>'summary_length')::int,
        'model', _result->>'model',
        'cached', false
    ) as result;
end;
$$;

-- @returns json
-- @single
-- @result result
select result from _result_out;

end;

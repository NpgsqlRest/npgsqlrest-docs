--------------------------------------------------------------------------------
-- Transform Proxy: Text Summarization with Caching
--
-- This function demonstrates TRANSFORM mode:
-- - Has proxy response parameters (_proxy_body, _proxy_success, etc.)
-- - Upstream response is passed to this function for processing
-- - Function can enrich, transform, cache, or validate the response
--
-- Use case: Cache expensive AI calls, enrich with local data, audit logging
--------------------------------------------------------------------------------

drop function if exists example_10.ai_summarize;
create function example_10.ai_summarize(
    _text text,
    _max_length int default 150,
    -- Proxy response parameters (filled by NpgsqlRest from upstream response)
    _proxy_status_code int default null,
    _proxy_body text default null,
    _proxy_success boolean default null,
    _proxy_error_message text default null
)
returns json
language plpgsql
as $$
declare
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

        return _cached;
    end if;

    -- Handle proxy errors
    if not _proxy_success then
        return json_build_object(
            'error', coalesce(_proxy_error_message, 'AI service unavailable'),
            'status_code', _proxy_status_code
        );
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
    return json_build_object(
        'summary', _result->>'summary',
        'original_length', (_result->>'original_length')::int,
        'summary_length', (_result->>'summary_length')::int,
        'model', _result->>'model',
        'cached', false
    );
end;
$$;

comment on function example_10.ai_summarize is '
HTTP POST /ai/summarize
@authorize
@proxy POST
';

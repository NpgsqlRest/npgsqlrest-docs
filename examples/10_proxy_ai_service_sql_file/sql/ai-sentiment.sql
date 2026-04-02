/*
HTTP POST /ai/sentiment
@authorize
@proxy POST

@param $1 text text

@param $2 _proxy_status_code int default null
@param $3 _proxy_body text default null
@param $4 _proxy_success boolean default null
@param $5 _proxy_error_message text default null
*/

begin;

-- @skip
create temp table _var on commit drop as
select
    $1::text as _text,
    $2::int as _proxy_status_code,
    $3::text as _proxy_body,
    $4::boolean as _proxy_success,
    $5::text as _proxy_error_message;

do
$$
declare
    _text text = (select _text from _var);
    _proxy_status_code int = (select _proxy_status_code from _var);
    _proxy_body text = (select _proxy_body from _var);
    _proxy_success boolean = (select _proxy_success from _var);
    _proxy_error_message text = (select _proxy_error_message from _var);

    _text_hash text;
    _cached record;
    _result json;
begin
    -- Check cache
    _text_hash := md5(_text || '::sentiment');

    select sentiment, sentiment_score, sentiment_confidence, accessed_count
    into _cached
    from example_10.analysis_cache
    where text_hash = _text_hash;

    if _cached.sentiment is not null then
        update example_10.analysis_cache
        set accessed_count = accessed_count + 1,
            last_accessed_at = now()
        where text_hash = _text_hash;

        create temp table _result_out on commit drop as
        select json_build_object(
            'sentiment', _cached.sentiment,
            'score', _cached.sentiment_score,
            'confidence', _cached.sentiment_confidence,
            'cached', true,
            'cache_hits', _cached.accessed_count
        ) as result;
        return;
    end if;

    -- Handle errors
    if not _proxy_success then
        create temp table _result_out on commit drop as
        select json_build_object(
            'error', coalesce(_proxy_error_message, 'AI service unavailable'),
            'status_code', _proxy_status_code
        ) as result;
        return;
    end if;

    -- Parse response
    _result := _proxy_body::json;

    -- Cache the result
    insert into example_10.analysis_cache (
        text_hash, text_preview, sentiment, sentiment_score, sentiment_confidence, model_version
    ) values (
        _text_hash,
        left(_text, 100),
        _result->>'sentiment',
        (_result->>'score')::numeric,
        (_result->>'confidence')::numeric,
        _result->>'model'
    )
    on conflict (text_hash) do update set
        sentiment = excluded.sentiment,
        sentiment_score = excluded.sentiment_score,
        sentiment_confidence = excluded.sentiment_confidence,
        accessed_count = example_10.analysis_cache.accessed_count + 1,
        last_accessed_at = now();

    create temp table _result_out on commit drop as
    select json_build_object(
        'sentiment', _result->>'sentiment',
        'score', (_result->>'score')::numeric,
        'confidence', (_result->>'confidence')::numeric,
        'text_length', (_result->>'text_length')::int,
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

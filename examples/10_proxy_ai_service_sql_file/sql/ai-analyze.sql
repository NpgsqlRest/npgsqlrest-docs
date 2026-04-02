/*
HTTP POST /ai/analyze
@authorize
@proxy POST

@param $1 text text
@param $2 maxLength int default 150
@param $3 maxKeywords int default 5

@param $4 _proxy_status_code int default null
@param $5 _proxy_body text default null
@param $6 _proxy_success boolean default null
@param $7 _proxy_error_message text default null
*/

begin;

-- @skip
create temp table _var on commit drop as
select 
    $1::text as _text,
    $2::int as _max_length,
    $3::int as _max_keywords,
    $4::int as _proxy_status_code,
    $5::text as _proxy_body,
    $6::boolean as _proxy_success,
    $7::text as _proxy_error_message;

do
$$
declare
    _text text = (select _text from _var);
    _max_length int = (select _max_length from _var);
    _max_keywords int = (select _max_keywords from _var);
    _proxy_status_code int = (select _proxy_status_code from _var);
    _proxy_body text = (select _proxy_body from _var);
    _proxy_success boolean = (select _proxy_success from _var);
    _proxy_error_message text = (select _proxy_error_message from _var);

    _text_hash text;
    _cached record;
    _result json;
begin
    -- Check cache
    _text_hash := md5(_text || '::full::' || _max_length || '::' || _max_keywords);

    select summary, sentiment, sentiment_score, sentiment_confidence, keywords, accessed_count
    into _cached
    from example_10.analysis_cache
    where text_hash = _text_hash
        and summary is not null
        and sentiment is not null
        and keywords is not null;

    if found then
        update example_10.analysis_cache
        set accessed_count = accessed_count + 1,
            last_accessed_at = now()
        where text_hash = _text_hash;

        create temp table _result_out on commit drop as
        select json_build_object(
            'summary', json_build_object(
                'text', _cached.summary,
                'original_length', length(_text)
            ),
            'sentiment', json_build_object(
                'sentiment', _cached.sentiment,
                'score', _cached.sentiment_score,
                'confidence', _cached.sentiment_confidence
            ),
            'keywords', json_build_object(
                'words', to_json(_cached.keywords),
                'count', array_length(_cached.keywords, 1)
            ),
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
        text_hash,
        text_preview,
        summary,
        sentiment,
        sentiment_score,
        sentiment_confidence,
        keywords,
        model_version
    ) values (
        _text_hash,
        left(_text, 100),
        _result->'summary'->>'text',
        _result->'sentiment'->>'sentiment',
        (_result->'sentiment'->>'score')::numeric,
        (_result->'sentiment'->>'confidence')::numeric,
        array(select jsonb_array_elements_text((_result->'keywords'->'words')::jsonb)),
        _result->>'model'
    )
    on conflict (text_hash) do update set
        summary = excluded.summary,
        sentiment = excluded.sentiment,
        sentiment_score = excluded.sentiment_score,
        sentiment_confidence = excluded.sentiment_confidence,
        keywords = excluded.keywords,
        accessed_count = example_10.analysis_cache.accessed_count + 1,
        last_accessed_at = now();

    -- Return enriched response
    create temp table _result_out on commit drop as
    select 
        json_build_object(
            'summary', _result->'summary',
            'sentiment', _result->'sentiment',
            'keywords', _result->'keywords',
            'model', _result->>'model',
            'processed_at', _result->>'processed_at',
            'cached', false
        ) as result;
end;
$$;

-- @returns json
-- @single
-- @result result
select result from _result_out;

end;

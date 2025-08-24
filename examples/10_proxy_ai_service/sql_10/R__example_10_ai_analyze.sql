--------------------------------------------------------------------------------
-- Transform Proxy: Full Text Analysis
--
-- Comprehensive analysis that:
-- - Proxies to AI service for full analysis (summary + sentiment + keywords)
-- - Caches all results
-- - Returns combined enriched response
--------------------------------------------------------------------------------

drop function if exists example_10.ai_analyze;
create function example_10.ai_analyze(
    _text text,
    _max_length int default 150,
    _max_keywords int default 5,
    -- Proxy response parameters
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

        return json_build_object(
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
        );
    end if;

    -- Handle errors
    if not _proxy_success then
        return json_build_object(
            'error', coalesce(_proxy_error_message, 'AI service unavailable'),
            'status_code', _proxy_status_code
        );
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
    return json_build_object(
        'summary', _result->'summary',
        'sentiment', _result->'sentiment',
        'keywords', _result->'keywords',
        'model', _result->>'model',
        'processed_at', _result->>'processed_at',
        'cached', false
    );
end;
$$;

comment on function example_10.ai_analyze is '
HTTP POST /ai/analyze
@authorize
@proxy POST
';

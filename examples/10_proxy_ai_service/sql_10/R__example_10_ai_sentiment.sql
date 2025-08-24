--------------------------------------------------------------------------------
-- Transform Proxy: Sentiment Analysis
--
-- Demonstrates transform mode with sentiment analysis:
-- - Proxies to AI service for sentiment analysis
-- - Stores results in database for later querying
-- - Returns enriched response with additional metadata
--------------------------------------------------------------------------------

drop function if exists example_10.ai_sentiment;
create function example_10.ai_sentiment(
    _text text,
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

        return json_build_object(
            'sentiment', _cached.sentiment,
            'score', _cached.sentiment_score,
            'confidence', _cached.sentiment_confidence,
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

    return json_build_object(
        'sentiment', _result->>'sentiment',
        'score', (_result->>'score')::numeric,
        'confidence', (_result->>'confidence')::numeric,
        'text_length', (_result->>'text_length')::int,
        'model', _result->>'model',
        'cached', false
    );
end;
$$;

comment on function example_10.ai_sentiment is '
HTTP POST /ai/sentiment
@authorize
@proxy POST
';

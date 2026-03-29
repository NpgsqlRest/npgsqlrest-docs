--------------------------------------------------------------------------------
-- Cache Statistics
--
-- View cached analysis results and statistics
-- This demonstrates that proxy responses are being stored in PostgreSQL
--------------------------------------------------------------------------------

drop function if exists example_10.cache_stats;
create function example_10.cache_stats()
returns table (
    total_cached bigint,
    total_cache_hits bigint,
    most_accessed_preview text,
    most_accessed_hits int,
    oldest_entry timestamptz,
    newest_entry timestamptz
)
language sql
as $$
    select
        count(*)::bigint as total_cached,
        coalesce(sum(accessed_count), 0)::bigint as total_cache_hits,
        (select text_preview from example_10.analysis_cache order by accessed_count desc limit 1) as most_accessed_preview,
        (select accessed_count from example_10.analysis_cache order by accessed_count desc limit 1) as most_accessed_hits,
        min(created_at) as oldest_entry,
        max(created_at) as newest_entry
    from example_10.analysis_cache;
$$;

comment on function example_10.cache_stats is '
HTTP GET /cache/stats
authorize
';

--------------------------------------------------------------------------------
-- List Recent Cache Entries
--------------------------------------------------------------------------------

drop function if exists example_10.cache_entries;
create function example_10.cache_entries(_limit int default 10)
returns table (
    id int,
    text_preview text,
    has_summary boolean,
    sentiment text,
    keywords text[],
    accessed_count int,
    created_at timestamptz
)
language sql
as $$
    select
        id,
        text_preview,
        summary is not null as has_summary,
        sentiment,
        keywords,
        accessed_count,
        created_at
    from example_10.analysis_cache
    order by created_at desc
    limit _limit;
$$;

comment on function example_10.cache_entries is '
HTTP GET /cache/entries
authorize
';

--------------------------------------------------------------------------------
-- Clear Cache
--------------------------------------------------------------------------------

drop function if exists example_10.cache_clear;
create function example_10.cache_clear()
returns json
language plpgsql
as $$
declare
    _deleted int;
begin
    delete from example_10.analysis_cache;
    get diagnostics _deleted = row_count;
    return json_build_object('deleted', _deleted);
end;
$$;

comment on function example_10.cache_clear is '
HTTP DELETE /cache/clear
@authorize
';

/*
HTTP GET /cache/stats
@authorize
*/
select
    count(*)::bigint as total_cached,
    coalesce(sum(accessed_count), 0)::bigint as total_cache_hits,
    (select text_preview from example_10.analysis_cache order by accessed_count desc limit 1) as most_accessed_preview,
    (select accessed_count from example_10.analysis_cache order by accessed_count desc limit 1) as most_accessed_hits,
    min(created_at) as oldest_entry,
    max(created_at) as newest_entry
from example_10.analysis_cache;

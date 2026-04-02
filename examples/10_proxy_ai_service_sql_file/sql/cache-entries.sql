/*
HTTP GET /cache/entries
@authorize
@param $1 _limit int default 10
*/
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
limit $1;

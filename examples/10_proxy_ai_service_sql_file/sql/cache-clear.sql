/*
HTTP DELETE /cache/clear
@authorize
@single
*/
with deleted as (
    delete from example_10.analysis_cache
    returning 1
)
select json_build_object('deleted', count(*)) as result
from deleted;

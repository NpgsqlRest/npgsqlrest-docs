/*
HTTP POST
@upload for large_object
@param $1 _user_id text = null
@param $2 _meta json = null
@param _meta is upload metadata
@check_image = true
*/
with inserted as (
    insert into example_6.uploads (user_id, file_name, content_type, file_size, oid)
    select
        $1::int,
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        (m->>'oid')::bigint
    from json_array_elements($2) as m
    where (m->>'success')::boolean = true
    returning file_name, content_type, file_size, oid
)
select (
        (m->>'success')::boolean,
        m->>'status',
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        (m->>'oid')::bigint,
        null::text
    )::example_6.upload_response
from json_array_elements($2) as m;

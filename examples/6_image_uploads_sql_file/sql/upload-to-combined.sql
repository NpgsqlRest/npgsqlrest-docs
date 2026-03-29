/*
HTTP POST
@upload for large_object, file_system
@param $1 _user_id
@param $2 _meta
@param _meta is upload metadata
@check_image = true
@path = ./6_image_uploads/public/uploads
@unique_name = true
@create_path = true
*/
with inserted as (
    insert into example_6.uploads (user_id, file_name, content_type, file_size, oid, file_path)
    select
        $1::int,
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        (m->>'oid')::bigint,
        m->>'filePath'
    from json_array_elements($2) as m
    where (m->>'success')::boolean = true
    returning file_name, content_type, file_size, oid, file_path
)
select
    (m->>'success')::boolean,
    m->>'status',
    m->>'fileName',
    m->>'contentType',
    (m->>'size')::bigint,
    (m->>'oid')::bigint,
    m->>'filePath'
from json_array_elements($2) as m;

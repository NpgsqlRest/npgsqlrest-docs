create or replace function example_6.upload_to_large_object(
    _user_id text = null,
    _meta json = null
)
returns setof example_6.upload_response
language sql
as $$
    with inserted as (
        insert into example_6.uploads (user_id, file_name, content_type, file_size, oid)
        select
            _user_id::int,
            m->>'fileName',
            m->>'contentType',
            (m->>'size')::bigint,
            (m->>'oid')::bigint
        from json_array_elements(_meta) as m
        where (m->>'success')::boolean = true
        returning file_name, content_type, file_size, oid
    )
    select
        (m->>'success')::boolean,
        m->>'status',
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        (m->>'oid')::bigint,
        null::text
    from json_array_elements(_meta) as m;
$$;

comment on function example_6.upload_to_large_object(text, json) is '
HTTP POST
@upload for large_object
@param _meta is upload metadata
@check_image = true';

create or replace function example_6.upload_to_file_system(
    _user_id text = null,
    _meta json = null
)
returns setof example_6.upload_response
language sql
as $$
    with inserted as (
        insert into example_6.uploads (user_id, file_name, content_type, file_size, file_path)
        select
            _user_id::int,
            m->>'fileName',
            m->>'contentType',
            (m->>'size')::bigint,
            m->>'filePath'
        from json_array_elements(_meta) as m
        where (m->>'success')::boolean = true
        returning file_name, content_type, file_size, file_path
    )
    select
        (m->>'success')::boolean,
        m->>'status',
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        null::bigint,
        m->>'filePath'
    from json_array_elements(_meta) as m;
$$;

-- upload to /public/uploads
comment on function example_6.upload_to_file_system(text, json) is '
HTTP POST
@upload for file_system
@param _meta is upload metadata
@check_image = true
@path = ./6_image_uploads/public/uploads
@unique_name = true
@create_path = true';

create or replace function example_6.get_image(
    _oid bigint,
    _mime_type text
)
returns bytea
language sql
as $$
    select lo_get(_oid);
$$;

comment on function example_6.get_image(bigint, text) is '
HTTP GET
@raw
@tsclient = false
content_type: {_mime_type}
';

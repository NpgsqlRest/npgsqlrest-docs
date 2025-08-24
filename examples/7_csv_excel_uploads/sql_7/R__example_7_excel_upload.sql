-- Excel upload endpoint
-- Returns upload metadata after processing
create or replace function example_7.excel_upload(
    _meta json = null
)
returns json
language sql
as $$
select _meta;
$$;

comment on function example_7.excel_upload(json) is '
HTTP POST
@authorize
@upload for excel
@param _meta is upload metadata
@all_sheets = true
@row_command = select example_7.excel_upload_row($1,$2,$3,$4)';

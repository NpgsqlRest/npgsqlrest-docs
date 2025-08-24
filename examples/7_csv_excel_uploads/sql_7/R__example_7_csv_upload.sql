-- CSV upload endpoint
-- Returns upload metadata after processing
create or replace function example_7.csv_upload(
    _meta json = null
)
returns json
language sql
as $$
select _meta;
$$;

comment on function example_7.csv_upload(json) is '
HTTP POST
@authorize
@upload for csv
@param _meta is upload metadata
@delimiters = ,;
@row_command = select example_7.csv_upload_row($1,$2,$3,$4)';

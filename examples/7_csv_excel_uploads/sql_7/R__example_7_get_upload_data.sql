create or replace function example_7.get_upload_data(
    _type text,
    _user_id text = null
)
returns setof text[]
language sql
as $$
select row_data
from example_7.csv_uploads
where _type = 'csv' and (_user_id is null or user_id = _user_id::int)
union all
select row_data
from example_7.excel_uploads
where _type = 'excel' and (_user_id is null or user_id = _user_id::int)
order by 1;
$$;

comment on function example_7.get_upload_data(text, text) is '
HTTP GET
@authorize';

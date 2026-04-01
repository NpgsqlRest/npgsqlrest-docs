/*
HTTP GET
@authorize
@param $1 type text
@param $2 _user_id text = null
*/
select row_data
from example_7.csv_uploads
where $1 = 'csv' and ($2::int is null or user_id = $2::int)
union all
select row_data
from example_7.excel_uploads
where $1 = 'excel' and ($2::int is null or user_id = $2::int)
order by 1;

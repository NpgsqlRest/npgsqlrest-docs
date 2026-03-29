/*
HTTP GET
@authorize
@user_parameters
@param $1 type
@param $2 _user_id
*/
select row_data
from example_7.csv_uploads
where $1 = 'csv' and ($2 is null or user_id = $2::int)
union all
select row_data
from example_7.excel_uploads
where $1 = 'excel' and ($2 is null or user_id = $2::int)
order by 1;

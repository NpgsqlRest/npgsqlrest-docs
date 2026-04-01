/*
HTTP POST
@authorize
@upload for csv
@param $1 meta json = null
@param meta is upload metadata
@delimiters = ,;
@row_command = select example_7.csv_upload_row($1,$2,$3,$4)
*/
select $1;

/*
HTTP POST
@authorize
@upload for csv
@param $1 _meta
@param _meta is upload metadata
@delimiters = ,;
@row_command = select example_7.csv_upload_row($1,$2,$3,$4)
*/
select $1::json;

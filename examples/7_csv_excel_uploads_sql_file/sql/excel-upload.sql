/*
HTTP POST
@authorize
@upload for excel
@param $1 _meta
@param _meta is upload metadata
@all_sheets = true
@row_command = select example_7.excel_upload_row($1,$2,$3,$4)
*/
select $1::json;

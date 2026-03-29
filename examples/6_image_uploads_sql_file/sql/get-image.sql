/*
HTTP GET
@raw
@tsclient = false
@param $1 oid
@param $2 mime_type
content_type: {mime_type}
*/
select lo_get($1::bigint);

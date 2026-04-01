/*
HTTP GET
@raw
@tsclient = false
@param $1 oid bigint
@define_param mimeType
content_type: {mimeType}
*/
select lo_get($1);

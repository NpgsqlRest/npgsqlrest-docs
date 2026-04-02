/*
HTTP GET
@authorize
@define_param format text
@define_param excelFileName text
@define_param excelSheet text
@table_format = {format}
@excel_file_name = {excelFileName}
@excel_sheet = {excelSheet}
@tsclient_url_only = true
*/
select * from (values
    (42,        9999999999::bigint, 3.1415::numeric(10,4), 2.71828::float8, true,  'hello world',      '2025-06-15'::date, '2025-06-15 14:30:00'::timestamp, '09:45:30'::time, '{"key":"value"}'::json, null::text, null::int),
    (-1,        0::bigint,          0.0001::numeric(10,4), -99.99::float8,  false, 'special <chars> &', '2000-01-01'::date, '2000-01-01 00:00:00'::timestamp, '23:59:59'::time, '[1,2,3]'::json,        'not null', 7),
    (2147483647, -1::bigint,        99999.9999::numeric(10,4), 0::float8,   true,  '',                  '1999-12-31'::date, '1999-12-31 23:59:59'::timestamp, '00:00:00'::time, 'null'::json,           null::text, null::int)
) as t(int_val, bigint_val, numeric_val, float_val, bool_val, text_val, date_val, timestamp_val, time_val, json_val, null_text, null_int);

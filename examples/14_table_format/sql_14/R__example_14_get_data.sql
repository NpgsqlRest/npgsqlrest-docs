create or replace function example_14.get_data(
    _format text,
    _excel_file_name text = null,
    _excel_sheet text = null
)
returns table (
    int_val int,
    bigint_val bigint,
    numeric_val numeric(10,4),
    float_val double precision,
    bool_val bool,
    text_val text,
    date_val date,
    timestamp_val timestamp,
    time_val time,
    json_val json,
    null_text text,
    null_int int
)
language sql as $$
select * from (values
    (42,        9999999999::bigint, 3.1415::numeric(10,4), 2.71828::float8, true,  'hello world',      '2025-06-15'::date, '2025-06-15 14:30:00'::timestamp, '09:45:30'::time, '{"key":"value"}'::json, null::text, null::int),
    (-1,        0::bigint,          0.0001::numeric(10,4), -99.99::float8,  false, 'special <chars> &', '2000-01-01'::date, '2000-01-01 00:00:00'::timestamp, '23:59:59'::time, '[1,2,3]'::json,        'not null', 7),
    (2147483647, -1::bigint,        99999.9999::numeric(10,4), 0::float8,   true,  '',                  '1999-12-31'::date, '1999-12-31 23:59:59'::timestamp, '00:00:00'::time, 'null'::json,           null::text, null::int)
);
$$;

comment on function example_14.get_data(text,text,text) is '
HTTP GET
@authorize
@table_format = {_format}
@excel_file_name = {_excel_file_name}
@excel_sheet = {_excel_sheet}
@tsclient_url_only = true
';

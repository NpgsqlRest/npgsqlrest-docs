-- Repeatable migration: R__example_5_sales_report.sql
-- Sales report function in the PUBLIC schema (exposed as API endpoint)
-- Uses SECURITY DEFINER to access private example_5.sales table

create type example_5_public.sales_report_record as (
    exported_by text,
    order_id int,
    customer_name text,
    product text,
    quantity int,
    unit_price numeric(10,2),
    total numeric(10,2),
    order_date date
);

create function example_5_public.sales_report(
    _user_name text default null  -- mapped from basic auth name claim
)
returns setof example_5_public.sales_report_record
language sql
set search_path = pg_catalog, pg_temp  -- Protect against search path attacks
security definer  -- Runs as migration user (superuser), not app_user
as $$
-- This function can access example_5.sales table because of SECURITY DEFINER
-- The app_user role cannot access this table directly - only through this function
select
    _user_name as exported_by,  -- Shows who exported the report (from basic auth)
    order_id,
    customer_name,
    product,
    quantity,
    unit_price,
    total,
    order_date
from example_5.sales
order by order_date;
$$;

-- Annotations:
-- - HTTP GET method
-- - raw: return plain text instead of JSON
-- - separator ,: use comma as column delimiter (CSV)
-- - new_line \n: use newline as row delimiter
-- - columns: include column header row
-- - Content-Type: text/csv: set response content type
-- - Content-Disposition: make it downloadable as a file
-- - basic_auth: require HTTP Basic Authentication with user "admin" and password "secret123"
-- - user_params: map authenticated username to _user_name parameter

-- Generate hash: ./npgsqlrest --hash secret123
-- Output: lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp

comment on function example_5_public.sales_report(text) is '
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
Content-Disposition: attachment; filename="sales_report.csv"
@basic_auth admin lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp
@user_params';

-- ============================================================================
-- Public version WITHOUT authentication (for Excel/BI tool demos)
-- ============================================================================
-- This endpoint is publicly accessible - no authentication required
-- Use this for connecting Excel, Power BI, or other BI tools that have
-- difficulty with Basic Auth or self-signed certificates

create function example_5_public.sales_report_public()
returns table (
    record example_5_public.sales_report_record,
    message text
)
language sql
set search_path = pg_catalog, pg_temp
security definer
as $$
select 
    (report.*)::example_5_public.sales_report_record,
    'WARNING: This is a public endpoint without authentication. Data access is not logged.' as message
from example_5_public.sales_report('public_user') report;
$$;

comment on function example_5_public.sales_report_public() is '
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
Content-Disposition: attachment; filename="sales_report.csv"';



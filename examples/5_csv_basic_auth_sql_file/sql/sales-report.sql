/*
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
Content-Disposition: attachment; filename="sales_report.csv"
@basic_auth admin lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp
@user_parameters
@param $1 _user_name text default null
*/
select
    $1 as exported_by, 
    order_id,
    customer_name,
    product,
    quantity,
    unit_price,
    total,
    order_date
from example_5.sales
order by order_date;
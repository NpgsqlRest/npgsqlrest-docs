/*
HTTP GET
@allow_anonymous
@raw
@separator ,
@columns
*/
select
    s.order_id,
    s.customer_name,
    s.product,
    s.quantity,
    s.unit_price,
    s.total,
    s.order_date
from example_5.sales s
order by s.order_date desc;

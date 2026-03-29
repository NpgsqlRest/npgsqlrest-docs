/*
HTTP GET
@raw
@separator ,
@columns
@basic_auth admin $2a$10$b73LXI5VuNOm7oue2RGYxeGLr2aJJHisrHCrBaFMsaHA8LHMVJhKu
@user_parameters
@param $1 _username
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

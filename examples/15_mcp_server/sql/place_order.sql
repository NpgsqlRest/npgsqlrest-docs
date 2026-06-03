/*
HTTP POST
@param $1 productId int
@param $2 quantity int default 1
@single
@mcp Place an order for a product. Decrements stock and returns the created order.
*/
with ordered as (
    update example_15.products
    set stock = stock - $2
    where id = $1
    returning id, name, price
),
created as (
    insert into example_15.orders (product_id, quantity, total)
    select id, $2, price * $2 from ordered
    returning id as order_id, quantity, total, status
)
select c.order_id, o.name as product, c.quantity, c.total, c.status
from created c cross join ordered o;

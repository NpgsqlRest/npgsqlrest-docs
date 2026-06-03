/*
HTTP DELETE
@param $1 orderId int
@mcp Cancel an order by id and return its quantity to stock.
*/
with cancelled as (
    update example_15.orders set status = 'cancelled'
    where id = $1 and status <> 'cancelled'
    returning product_id, quantity
),
restocked as (
    update example_15.products p set stock = stock + c.quantity
    from cancelled c where p.id = c.product_id
    returning c.quantity
)
select case
    when exists (select 1 from restocked)
        then format('Order %s cancelled; %s unit(s) returned to stock', $1, (select quantity from restocked))
        else format('Order %s not found or already cancelled', $1)
    end as result;

/*
HTTP GET
@param $1 query text default null
@param $2 maxPrice numeric default null
@mcp Search the product catalog by name or category and/or a maximum price; returns matching products with their price and stock.
*/
select id, name, category, price, stock
from example_15.products
where ($1 is null or name ilike '%' || $1 || '%' or category ilike '%' || $1 || '%')
  and ($2 is null or price <= $2)
order by price;

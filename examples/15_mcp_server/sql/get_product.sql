/*
HTTP GET
@param $1 id int
@single
@mcp_description Get a single product by its id, including price and current stock.
*/
select id, name, category, price, stock
from example_15.products
where id = $1;
-- Dev note: @mcp_description above is the authoritative tool description and opts the routine in (like
-- @mcp), so this comment is IGNORED — an explicit description suppresses comment prose, so notes like this
-- never leak into what the agent sees. (Without an explicit description, prose would become the description.)

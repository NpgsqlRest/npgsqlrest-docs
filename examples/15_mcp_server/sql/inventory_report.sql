/*
@mcp Low-stock report (3 or fewer in stock); staff/agent-only.
*/
select name, category, stock from example_15.products where stock <= 3 order by stock;

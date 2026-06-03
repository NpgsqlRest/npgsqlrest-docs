/*
HTTP GET
@single
@mcp Total number of products in the catalog.
@mcp_name catalog_size
*/
select count(*)::int as count from example_15.products;

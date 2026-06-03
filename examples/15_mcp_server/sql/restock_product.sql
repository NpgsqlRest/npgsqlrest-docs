/*
HTTP POST
@param $1 productId int
@param $2 newStock int
@single
@authorize manager
@mcp Set a product's stock to an exact value. Manager-only — a privileged, mutating operation.
*/
-- The ONLY protected operation in this example. `@authorize manager` gates it by role, so the same
-- routine enforces auth on BOTH interfaces it is exposed on:
--   • REST   POST /api/restock-product   (Authorization: Bearer <jwt>)
--   • MCP    tools/call restock_product  (Authorization: Bearer <jwt> on the /mcp request)
-- Outcomes the demo shows: no token → 401; a 'staff'-role token (clerk) → 403; a 'manager' token → success.
-- Everything else in the store stays anonymous — enabling JWT auth does not require gating the endpoint.
update example_15.products
set stock = $2
where id = $1
returning id, name, category, stock;

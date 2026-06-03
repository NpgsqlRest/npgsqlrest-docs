/*
HTTP POST
@login
@allow_anonymous
@param $1 username
@define_param password text
*/
-- Issues a JWT for a staff member. `scheme = 'jwt'` selects the JWT auth scheme (see config.json Auth),
-- so a successful response body carries { accessToken, refreshToken, tokenType, expiresIn, ... }.
-- `password` is declared with @define_param: it is accepted from the request but NOT bound to the SQL —
-- NpgsqlRest's built-in verifier matches it against the returned password_hash column (HashColumnName).
-- The `roles` column becomes the token's role claims, which is what `@authorize manager` checks later.
-- This is a REST-only endpoint (no @mcp): you log in over HTTP, then present the token to the MCP tools.
select
    'jwt'      as scheme,
    s.id::text as user_id,
    s.username,
    s.roles,
    s.password_hash
from example_15.staff s
where s.username = $1;

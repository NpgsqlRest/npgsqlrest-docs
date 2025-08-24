--------------------------------------------------------------------------------
-- Passthrough Proxy: AI Service Health Check
--
-- This function demonstrates PASSTHROUGH mode:
-- - Returns void (no proxy response parameters)
-- - NO database connection is opened
-- - Response from upstream is returned directly to client
--
-- Use case: Simple health checks, static content, or when you don't need
-- to process the response in PostgreSQL
--------------------------------------------------------------------------------

drop function if exists example_10.ai_health;
create function example_10.ai_health()
returns void
language sql
as $$select$$;

comment on function example_10.ai_health is '
HTTP GET /ai/health
@proxy
';

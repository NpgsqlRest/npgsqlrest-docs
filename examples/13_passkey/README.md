# Example 10: Proxy AI Service

This example demonstrates NpgsqlRest's **reverse proxy feature**, which allows you to forward HTTP requests to upstream services and optionally process the responses in PostgreSQL.

## Key Concepts

### Passthrough Mode
When a proxy endpoint function has **no proxy response parameters**, NpgsqlRest:
- Forwards the request to the upstream service
- Returns the upstream response **directly** to the client
- **Does NOT open a database connection** (saves connection pool resources)

```sql
-- Passthrough: no DB connection opened
create function ai_health()
returns void
language sql as $$select$$;

comment on function ai_health is '@proxy http://localhost:3001/health';
```

### Transform Mode
When a proxy endpoint function has **proxy response parameters** (`_proxy_body`, `_proxy_status_code`, etc.), NpgsqlRest:
- Forwards the request to the upstream service
- Passes the upstream response to your PostgreSQL function
- Your function can **transform, enrich, cache, or validate** the response

```sql
-- Transform: response is passed to PostgreSQL for processing
create function ai_summarize(
    _text text,
    _proxy_body text default null,
    _proxy_success boolean default null
)
returns json
language plpgsql as $$
begin
    -- Cache the result, enrich with metadata, etc.
    return _proxy_body::json;
end;
$$;

comment on function ai_summarize is '@proxy POST http://localhost:3001/summarize';
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────>│  NpgsqlRest │────>│  AI Service │
│  (Browser)  │<────│   (Proxy)   │<────│    (Bun)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                    ┌─────v─────┐
                    │ PostgreSQL │
                    │  (Cache)   │
                    └───────────┘
```

## Running This Example

### 1. Start the upstream AI service (in one terminal)

```bash
cd examples/10_proxy_ai_service
bun run upstream
```

### 2. Run database migrations (once)

```bash
bun run db:up
```

### 3. Start NpgsqlRest (in another terminal)

```bash
bun run dev
```

### 4. Open the browser

Navigate to http://127.0.0.1:8080

## Endpoints

| Endpoint | Mode | Description |
|----------|------|-------------|
| `GET /ai/health` | Passthrough | Health check - no DB connection |
| `POST /ai/summarize` | Transform | Summarize text with caching |
| `POST /ai/sentiment` | Transform | Sentiment analysis with caching |
| `POST /ai/analyze` | Transform | Full analysis (summary + sentiment + keywords) |
| `GET /cache/stats` | Regular | View cache statistics |
| `DELETE /cache/clear` | Regular | Clear the cache |

## Configuration

The proxy feature is enabled in `config.json`:

```json
{
  "NpgsqlRest": {
    "ProxyOptions": {
      "Enabled": true,
      "Host": "http://localhost:3001",
      "DefaultTimeout": "00:00:30"
    }
  }
}
```

## Use Cases for Proxy Feature

1. **API Gateway**: Route requests to different microservices
2. **Caching Layer**: Cache expensive external API calls in PostgreSQL
3. **Data Enrichment**: Combine external data with local database data
4. **Rate Limiting**: Track and limit API calls per user
5. **Response Transformation**: Modify external API responses before returning
6. **Audit Logging**: Log all external API interactions
7. **Fallback Handling**: Return cached data when upstream is unavailable

## Files

| File | Description |
|------|-------------|
| `upstream/server.ts` | Bun server simulating an AI text analysis service |
| `sql_10/*.sql` | PostgreSQL schema and proxy endpoint functions |
| `config.json` | NpgsqlRest configuration with proxy enabled |
| `src/app.ts` | Frontend TypeScript application |
| `public/index.html` | Demo web interface |

# Getting Started with NpgsqlRest

Transform your PostgreSQL database into a production-ready REST API server in minutes with automatic code generation and static type checking.

## What You'll Build

In this guide, you'll:
- Create a simple PostgreSQL function
- Annotate it for HTTP exposure
- Set up NpgsqlRest server
- Generate TypeScript client code automatically
- Test your API endpoint

## Prerequisites

- PostgreSQL 13+ database
- Basic knowledge of SQL and REST APIs

## Step 1: Create Your First API Function

Connect to your PostgreSQL database and create a simple function:

```sql
CREATE FUNCTION my_todo(_user TEXT)
RETURNS TABLE (
  what TEXT, 
  who TEXT
)
LANGUAGE SQL AS $$
  SELECT 'Hello World', _user
$$;
```

## Step 2: Add HTTP Annotation

Add a comment to expose this function as an HTTP endpoint:

```sql
COMMENT ON FUNCTION my_todo(TEXT) IS '
HTTP GET /hello
authorize admin
';
```

This creates:
- **GET endpoint** at `/hello`
- **Authorization** restricted to admin role
- **Automatic parameter mapping** from query string

## Step 3: Install NpgsqlRest

Choose your preferred installation method:

### Option A: Download Executable (Recommended)
```bash
# Download from GitHub releases and make executable
chmod +x npgsqlrest
```

### Option B: NPM Package
```bash
npm i npgsqlrest
```

### Option C: Docker
```bash
docker pull vbilopav/npgsqlrest:latest
```

## Step 4: Configure Database Connection

Create `appsettings.json` with your PostgreSQL connection:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=my_db;Username=postgres;Password=postgres"
  }
}
```

## Step 5: Enable Code Generation (Optional)

For automatic TypeScript generation, enhance your configuration:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=my_db;Username=postgres;Password=postgres"
  },
  "NpgsqlRest": {
    "HttpFileOptions": {
      "Enabled": true,
      "NamePattern": "./src/http/{0}_{1}"
    },
    "ClientCodeGen": {
      "Enabled": true,
      "FilePath": "./src/app/api/{0}Api.ts"
    }
  }
}
```

## Step 6: Start Your API Server

Run the server:

```bash
# Executable
./npgsqlrest

# NPM
npx npgsqlrest

# Docker
docker run -p 8080:8080 -v ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest
```

You'll see:
```
[11:33:35.440 INF] Started in 00:00:00.0940095, listening on ["http://localhost:8080"], version 2.27.0.0 [NpgsqlRest]
```

## Step 7: Test Your API

Your API is now live at `http://localhost:8080/hello`

### Manual Testing
```bash
curl "http://localhost:8080/hello?user=John"
```

### Generated HTTP File
NpgsqlRest automatically creates `todo_public.http`:
```http
@host=http://localhost:8080

GET {{host}}/hello?user=ABC
```

### Generated TypeScript Client
Automatically generated `publicApi.ts`:
```typescript
interface IPublicMyTodoRequest {
    user: string | null;
}

interface IPublicMyTodoResponse {
    what: string | null;
    who: string | null;
}

export async function publicMyTodo(
    request: IPublicMyTodoRequest
): Promise<{status: number, response: IPublicMyTodoResponse[] | string}> {
    // ... implementation
}
```

## What You've Accomplished

✅ **Database-First API**: Function definitions drive your API  
✅ **Zero Boilerplate**: No manual REST endpoint coding  
✅ **Type Safety**: Automatic TypeScript generation  
✅ **Production Ready**: Built-in security, performance, and scalability  
✅ **Developer Experience**: HTTP files and client code generated automatically  

## Next Steps

- [Authentication & Authorization](./authentication.md) - Secure your endpoints
- [Advanced Annotations](./annotations.md) - Custom headers, caching, streaming
- [Code Generation](./code-generation.md) - TypeScript, HTTP files, and more
- [Performance Tuning](./performance.md) - Connection pooling and optimization
- [Deployment](./deployment.md) - Production deployment strategies

## Common Patterns

### REST CRUD Operations
```sql
-- Enable CRUD for a table
COMMENT ON TABLE users IS 'HTTP';
```

### Custom Response Headers
```sql
COMMENT ON FUNCTION get_data() IS '
HTTP GET /data
Content-Type: application/json
Cache-Control: max-age=3600
';
```

### Real-time Streaming
```sql
COMMENT ON FUNCTION live_updates() IS '
HTTP GET /stream
event-stream
';
```

### Multiple HTTP Methods
```sql
COMMENT ON FUNCTION save_user(jsonb) IS '
HTTP POST,PUT /users
Content-Type: application/json
';
```

Ready to build production APIs? Your PostgreSQL database is now a powerful REST API server with full type safety and automatic client generation.
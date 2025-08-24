# Quick Start

This guide will walk you through creating your first NpgsqlRest API in under 5 minutes.

## Prerequisites

- PostgreSQL 13+ running locally or accessible
- .NET 8+ SDK installed
- Your favorite code editor

## Step 1: Prepare Your Database

Create a sample database and function:

```sql
-- Connect to your PostgreSQL instance and create a database
CREATE DATABASE quickstart_demo;

-- Switch to the new database
\c quickstart_demo;

-- Create a simple function
CREATE OR REPLACE FUNCTION get_current_time()
RETURNS timestamptz
LANGUAGE sql
AS $$
    SELECT now()
$$;

-- Create a function with parameters
CREATE OR REPLACE FUNCTION greet_user(user_name text)
RETURNS text
LANGUAGE sql
AS $$
    SELECT 'Hello, ' || user_name || '! Welcome to NpgsqlRest.'
$$;

-- Create a simple table for CRUD operations
CREATE TABLE users (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com');
```

## Step 2: Create Your .NET Project

```bash
# Create a new web project
dotnet new web -n QuickStartDemo
cd QuickStartDemo

# Add NpgsqlRest package
dotnet add package NpgsqlRest
```

## Step 3: Configure Your Application

Replace the contents of `Program.cs`:

```csharp
var builder = WebApplication.CreateSlimBuilder(args);
var app = builder.Build();

// Configure your connection string
var connectionString = "Host=localhost;Port=5432;Database=quickstart_demo;Username=postgres;Password=your_password";

// Add NpgsqlRest middleware with basic configuration
app.UseNpgsqlRest(new(connectionString)
{
    // Enable automatic HTTP file generation
    HttpFileOptions = new() { CreateHttpFile = true },
    
    // Enable TypeScript client generation
    TsClientOptions = new() { CreateTsClientFile = true }
});

app.Run();
```

## Step 4: Run Your Application

```bash
dotnet run
```

Your API is now running at `http://localhost:5000`!

## Step 5: Test Your Endpoints

### Test the time function
```bash
curl -X POST http://localhost:5000/api/get-current-time/
```

### Test the greeting function
```bash
curl -X POST http://localhost:5000/api/greet-user/ \
  -H "Content-Type: application/json" \
  -d '{"user_name": "Alice"}'
```

### Test CRUD operations (if enabled)
```bash
# Get all users
curl http://localhost:5000/api/users/

# Get user by ID
curl http://localhost:5000/api/users/1

# Create new user
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
```

## Step 6: Explore Generated Files

NpgsqlRest automatically generates helpful files:

### HTTP File (`rest.http`)
Contains ready-to-use HTTP requests:

```http
@host=http://localhost:5000

###
// function public.get_current_time()
// returns timestamp with time zone
POST {{host}}/api/get-current-time/

###
// function public.greet_user(user_name text)
// returns text
POST {{host}}/api/greet-user/
Content-Type: application/json

{
  "user_name": "string"
}
```

### TypeScript Client (`rest-client.ts`)
Type-safe client functions:

```typescript
/**
 * function public.get_current_time()
 * returns timestamp with time zone
 */
export async function getCurrentTime(): Promise<string> {
    const response = await fetch(_baseUrl + "/api/get-current-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    return await response.text() as string;
}

/**
 * function public.greet_user(user_name text)
 * returns text
 */
export async function greetUser(user_name: string): Promise<string> {
    const response = await fetch(_baseUrl + "/api/greet-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name })
    });
    return await response.text() as string;
}
```

## Customization with Comments

Enhance your functions with PostgreSQL comments:

```sql
-- Custom HTTP method and path
CREATE OR REPLACE FUNCTION get_user_profile(user_id int)
RETURNS json
LANGUAGE sql
AS $$
    SELECT row_to_json(u) FROM users u WHERE id = user_id
$$;

COMMENT ON FUNCTION get_user_profile(int) IS '
HTTP GET /users/{user_id}/profile
Content-Type: application/json';

-- Function requiring authentication
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM users),
        'timestamp', now()
    )
$$;

COMMENT ON FUNCTION get_admin_stats() IS '
HTTP GET /admin/stats
authorize admin
Content-Type: application/json';
```

## Next Steps

Congratulations! You've created your first NpgsqlRest API. Here's what to explore next:

- [Configuration Options](/guide/options) - Learn about all available options
- [Authentication](/guide/authentication) - Secure your API
- [Comment Annotations](/guide/annotations) - Customize endpoints
- [File Uploads](/guide/uploads) - Handle file operations
- [Real-time Features](/guide/real-time) - Add server-sent events
- [Production Deployment](/guide/deployment) - Deploy your API

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check connection string parameters
- Ensure database exists and user has proper permissions

### No Endpoints Generated
- Verify functions exist in the `public` schema
- Check function permissions
- Enable logging to see what functions are discovered

### CORS Issues
Enable CORS if calling from a browser:

```csharp
app.UseCors(builder => builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseNpgsqlRest(options);
```
# API Reference

This section provides comprehensive documentation for the NpgsqlRest API, including middleware configuration, options, and extension methods.

## Core Classes

### NpgsqlRestOptions

The main configuration class for NpgsqlRest middleware.

```csharp
public class NpgsqlRestOptions
{
    public string ConnectionString { get; set; }
    public bool RequiresAuthorization { get; set; } = false;
    public string DefaultSchema { get; set; } = "public";
    public bool LogConnectionString { get; set; } = false;
    // ... more properties
}
```

### Key Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ConnectionString` | `string` | `null` | PostgreSQL connection string |
| `RequiresAuthorization` | `bool` | `false` | Global authorization requirement |
| `DefaultSchema` | `string` | `"public"` | Default schema to scan |
| `LogConnectionString` | `bool` | `false` | Whether to log connection string |
| `LogCommands` | `bool` | `false` | Whether to log SQL commands |
| `CommentsMode` | `CommentsMode` | `ParseAll` | How to handle PostgreSQL comments |
| `UrlPathPrefix` | `string` | `"api"` | URL prefix for all endpoints |

## Middleware Extension

### UseNpgsqlRest

Extension method to add NpgsqlRest middleware to the application pipeline.

```csharp
public static IApplicationBuilder UseNpgsqlRest(
    this IApplicationBuilder app, 
    NpgsqlRestOptions options)
```

#### Usage Examples

**Basic Usage:**
```csharp
app.UseNpgsqlRest(new("Host=localhost;Database=mydb;Username=user;Password=pass"));
```

**With Configuration:**
```csharp
app.UseNpgsqlRest(new("connection_string")
{
    RequiresAuthorization = true,
    DefaultSchema = "api",
    UrlPathPrefix = "rest",
    LogCommands = true
});
```

## Authentication & Authorization

### Authentication Options

```csharp
public class NpgsqlRestOptions
{
    public bool RequiresAuthorization { get; set; } = false;
    public Func<HttpContext, bool>? AuthorizeCallback { get; set; }
    public string? AuthorizeScheme { get; set; }
    public string? AuthorizePolicy { get; set; }
}
```

### Authorization Callback

Custom authorization logic:

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    AuthorizeCallback = context => 
    {
        // Custom authorization logic
        return context.User?.Identity?.IsAuthenticated == true;
    }
});
```

## File Generation Options

### HTTP File Options

```csharp
public class HttpFileOptions
{
    public bool CreateHttpFile { get; set; } = false;
    public string HttpFileName { get; set; } = "rest.http";
    public string HttpFileContent { get; set; } = "";
    // ... more properties
}
```

### TypeScript Client Options

```csharp
public class TsClientOptions
{
    public bool CreateTsClientFile { get; set; } = false;
    public string TsClientFileName { get; set; } = "rest-client.ts";
    public string TsClientFileContent { get; set; } = "";
    // ... more properties
}
```

## Response Formatting

### Content Types

NpgsqlRest automatically determines content types based on PostgreSQL return types:

| PostgreSQL Type | HTTP Content-Type | .NET Type |
|----------------|------------------|-----------|
| `text`, `varchar` | `text/plain` | `string` |
| `json`, `jsonb` | `application/json` | `JsonDocument` |
| `bytea` | `application/octet-stream` | `byte[]` |
| `xml` | `application/xml` | `XmlDocument` |
| Boolean types | `application/json` | `bool` |
| Numeric types | `application/json` | Various numeric types |

### Custom Content Types

Override content types using comment annotations:

```sql
COMMENT ON FUNCTION my_function() IS 'Content-Type: text/html';
```

## Error Handling

### Error Response Format

```json
{
    "error": "Error description",
    "detail": "Detailed error information",
    "code": "PostgreSQL error code",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Custom Error Handling

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    ErrorCallback = (context, exception) => 
    {
        // Custom error handling
        context.Response.StatusCode = 500;
        return context.Response.WriteAsync("Custom error message");
    }
});
```

## Logging

### Built-in Logging

NpgsqlRest uses the standard .NET logging framework:

```csharp
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.SetMinimumLevel(LogLevel.Information);
});
```

### Log Categories

- `NpgsqlRest.Middleware` - Middleware operations
- `NpgsqlRest.Commands` - SQL command execution  
- `NpgsqlRest.Connection` - Database connections
- `NpgsqlRest.Discovery` - Function discovery

## Performance Tuning

### Connection Pooling

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    // Connection pool settings
    MinPoolSize = 1,
    MaxPoolSize = 100,
    ConnectionLifetime = TimeSpan.FromMinutes(15)
});
```

### Caching Options

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    // Enable metadata caching
    CacheMetadata = true,
    MetadataCacheLifetime = TimeSpan.FromMinutes(30)
});
```

## Advanced Configuration

### Custom Name Converters

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    NameConverter = name => name.ToLowerInvariant().Replace('_', '-')
});
```

### Custom URL Builders

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    UrlBuilder = routine => $"/custom/{routine.Schema}/{routine.Name}"
});
```

## Extension Points

### Custom Middleware

Create custom middleware that works with NpgsqlRest:

```csharp
public class CustomNpgsqlRestMiddleware
{
    private readonly RequestDelegate _next;
    
    public CustomNpgsqlRestMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Pre-processing logic
        await _next(context);
        // Post-processing logic
    }
}
```

### Plugin System

NpgsqlRest supports plugins for extended functionality:

- **CrudSource Plugin** - Automatic CRUD operations
- **HttpFiles Plugin** - HTTP file generation
- **TsClient Plugin** - TypeScript client generation

See the [Plugins Guide](/guide/plugins) for detailed information.
# Examples

This section provides practical examples of using NpgsqlRest in various scenarios. Each example includes complete code samples and explanations.

## Basic Examples

### Simple Function API

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION calculate_tax(amount decimal, tax_rate decimal)
RETURNS decimal
LANGUAGE sql
AS $$
    SELECT amount * tax_rate / 100
$$;
```

**.NET Application:**
```csharp
var builder = WebApplication.CreateSlimBuilder(args);
var app = builder.Build();

app.UseNpgsqlRest(new("Host=localhost;Database=store;Username=user;Password=pass"));
app.Run();
```

**Usage:**
```bash
curl -X POST http://localhost:5000/api/calculate-tax/ \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00, "tax_rate": 8.5}'
```

**Response:**
```
8.50
```

### JSON API with Custom Endpoints

**PostgreSQL Setup:**
```sql
CREATE TABLE products (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    price decimal(10,2) NOT NULL,
    category varchar(100),
    created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION get_products_by_category(category_name text)
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_agg(row_to_json(p)) 
    FROM products p 
    WHERE p.category = category_name
$$;

COMMENT ON FUNCTION get_products_by_category(text) IS '
HTTP GET /products/category/{category_name}
Content-Type: application/json';
```

**Usage:**
```bash
curl http://localhost:5000/products/category/electronics
```

## Authentication Examples

### Role-Based Authorization

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION get_user_orders(user_id int)
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_agg(o) FROM orders o WHERE o.user_id = $1
$$;

COMMENT ON FUNCTION get_user_orders(int) IS '
HTTP GET /users/{user_id}/orders
authorize user, admin';

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_agg(row_to_json(u)) FROM users u
$$;

COMMENT ON FUNCTION get_all_users() IS '
HTTP GET /admin/users
authorize admin';
```

**.NET Configuration:**
```csharp
var builder = WebApplication.CreateSlimBuilder(args);

// Add authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-secret-key")),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("admin", policy => policy.RequireRole("admin"));
    options.AddPolicy("user", policy => policy.RequireRole("user", "admin"));
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseNpgsqlRest(new("connection_string")
{
    RequiresAuthorization = true
});

app.Run();
```

### Custom Authorization Logic

```csharp
app.UseNpgsqlRest(new("connection_string")
{
    AuthorizeCallback = context =>
    {
        // Custom authorization logic
        var userId = context.User?.FindFirst("user_id")?.Value;
        var requestedUserId = context.Request.RouteValues["user_id"]?.ToString();
        
        // Users can only access their own data
        return userId == requestedUserId || 
               context.User?.IsInRole("admin") == true;
    }
});
```

## File Upload Examples

### Basic File Upload

**PostgreSQL Setup:**
```sql
CREATE TABLE file_uploads (
    id serial PRIMARY KEY,
    filename varchar(255),
    content_type varchar(100),
    size bigint,
    uploaded_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_file_upload(
    filename text,
    content_type text,
    file_size bigint
)
RETURNS json
LANGUAGE sql
AS $$
    INSERT INTO file_uploads (filename, content_type, size)
    VALUES (filename, content_type, file_size)
    RETURNING row_to_json(file_uploads)
$$;
```

**.NET Configuration:**
```csharp
app.UseNpgsqlRest(new("connection_string")
{
    UploadOptions = new()
    {
        AllowedExtensions = new[] { ".jpg", ".png", ".pdf", ".txt" },
        MaxFileSize = 10 * 1024 * 1024, // 10MB
        UploadPath = "/uploads"
    }
});
```

### CSV Data Import

**PostgreSQL Setup:**
```sql
CREATE TABLE customers (
    id serial PRIMARY KEY,
    name varchar(255),
    email varchar(255),
    phone varchar(50)
);

CREATE OR REPLACE FUNCTION import_customers_csv()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    import_count int;
BEGIN
    -- This function works with NpgsqlRest CSV upload handler
    GET DIAGNOSTICS import_count = ROW_COUNT;
    RETURN import_count;
END;
$$;

COMMENT ON FUNCTION import_customers_csv() IS '
HTTP POST /customers/import
upload csv
target_table customers';
```

## Real-Time Examples

### Live Notifications

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION process_long_operation()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE INFO 'Starting process...';
    
    PERFORM pg_sleep(2);
    RAISE INFO 'Step 1 completed: Data validation';
    
    PERFORM pg_sleep(2);
    RAISE INFO 'Step 2 completed: Processing records';
    
    PERFORM pg_sleep(1);
    RAISE INFO 'Process completed successfully';
END;
$$;

COMMENT ON FUNCTION process_long_operation() IS '
HTTP POST /operations/long-process
info_path /operations/events
info_scope all';
```

**Client-Side (JavaScript):**
```javascript
// Start the long operation
fetch('/api/operations/long-process', { method: 'POST' });

// Listen for real-time updates
const eventSource = new EventSource('/operations/events');

eventSource.onmessage = function(event) {
    console.log('Progress update:', event.data);
    // Update UI with progress information
};

eventSource.onerror = function(event) {
    console.log('Operation completed or error occurred');
    eventSource.close();
};
```

### Selective Notifications

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION admin_maintenance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE INFO 'Starting maintenance...' USING hint = 'all';
    RAISE INFO 'Updating user data...' USING hint = 'authorize admin';
    RAISE INFO 'Sensitive operation in progress...' USING hint = 'authorize super_admin';
    RAISE INFO 'Maintenance completed' USING hint = 'all';
END;
$$;

COMMENT ON FUNCTION admin_maintenance() IS '
HTTP POST /admin/maintenance
info_path /admin/events
authorize admin';
```

## Advanced Examples

### Custom Response Types

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION generate_report_pdf()
RETURNS bytea
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate PDF content (simplified example)
    RETURN decode('255044462d312e340a', 'hex'); -- PDF header
END;
$$;

COMMENT ON FUNCTION generate_report_pdf() IS '
HTTP GET /reports/monthly.pdf
Content-Type: application/pdf';

CREATE OR REPLACE FUNCTION get_dashboard_html()
RETURNS text
LANGUAGE sql
AS $$
    SELECT '<html><body><h1>Dashboard</h1><p>Welcome!</p></body></html>'
$$;

COMMENT ON FUNCTION get_dashboard_html() IS '
HTTP GET /dashboard
Content-Type: text/html';
```

### Batch Operations

**PostgreSQL Setup:**
```sql
CREATE OR REPLACE FUNCTION batch_update_prices(price_updates json)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    update_record json;
    result json[];
BEGIN
    FOR update_record IN SELECT * FROM json_array_elements(price_updates)
    LOOP
        UPDATE products 
        SET price = (update_record->>'price')::decimal
        WHERE id = (update_record->>'id')::int;
        
        result := array_append(result, json_build_object(
            'id', update_record->>'id',
            'status', 'updated'
        ));
    END LOOP;
    
    RETURN array_to_json(result);
END;
$$;

COMMENT ON FUNCTION batch_update_prices(json) IS '
HTTP PUT /products/batch-update
Content-Type: application/json';
```

**Usage:**
```bash
curl -X PUT http://localhost:5000/products/batch-update \
  -H "Content-Type: application/json" \
  -d '{
    "price_updates": [
      {"id": 1, "price": 29.99},
      {"id": 2, "price": 39.99}
    ]
  }'
```

## Production Examples

### Health Check Endpoint

```sql
CREATE OR REPLACE FUNCTION health_check()
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'database', current_database(),
        'version', version()
    )
$$;

COMMENT ON FUNCTION health_check() IS '
HTTP GET /health
Content-Type: application/json';
```

### API Versioning

```sql
-- Version 1
CREATE OR REPLACE FUNCTION v1_get_user(user_id int)
RETURNS json
LANGUAGE sql
AS $$
    SELECT row_to_json(u) FROM users u WHERE id = user_id
$$;

COMMENT ON FUNCTION v1_get_user(int) IS '
HTTP GET /v1/users/{user_id}';

-- Version 2 with additional fields
CREATE OR REPLACE FUNCTION v2_get_user(user_id int)
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'profile', u.profile_data,
        'last_login', u.last_login_at
    ) FROM users u WHERE id = user_id
$$;

COMMENT ON FUNCTION v2_get_user(int) IS '
HTTP GET /v2/users/{user_id}';
```

These examples demonstrate the flexibility and power of NpgsqlRest across various use cases. Each example can be adapted to fit your specific requirements.
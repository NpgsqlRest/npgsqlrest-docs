# Example 5: CSV Export with Basic Authentication over HTTPS

This example demonstrates:
- Exporting data as CSV using `raw`, `separator`, `columns` annotations
- HTTP Basic Authentication with password hashing
- Mapping authenticated username to function parameters via `user_params`
- **SSL/HTTPS configuration for secure credential transmission**

## Why HTTPS is Required for Basic Auth

Basic Authentication transmits credentials encoded in Base64 - this is **NOT encryption**.
Without SSL/TLS, credentials can be intercepted by anyone on the network.

**Never use Basic Auth over plain HTTP in production!**

## Setup Steps

### 1. Export Development Certificate to PFX File

The application needs a certificate file. Export the ASP.NET Core development certificate:

```bash
dotnet dev-certs https --export-path ./5_csv_basic_auth/localhost.pfx --password dev123
```

This creates a `localhost.pfx` file that Kestrel can use.

### 2. Trust the Certificate (Optional but Recommended)

Trust the certificate to avoid browser warnings:

```bash
dotnet dev-certs https --trust
```

You may be prompted for your system password.

### 3. Verify Certificate (Optional)

Check if you have a valid and trusted development certificate:

```bash
dotnet dev-certs https --check --trust
```

### 4. Start the Application

```bash
npgsqlrest --config ./5_csv_basic_auth/config.json
```

The application will start on **https://localhost:8080**

### 5. Test the Endpoint

**Using curl:**
```bash
curl -k -u admin:secret123 https://localhost:8080/api/example-5-public/sales-report
```

Note: The `-k` flag allows curl to accept the self-signed certificate.

**Using browser:**
1. Navigate to https://localhost:8080
2. Click the download link
3. Enter credentials when prompted: `admin` / `secret123`

## Configuration Explained

### SSL Configuration

```json
{
  "Urls": "https://localhost:8080",

  "Ssl": {
    "Enabled": true,
    "UseHttpsRedirection": false,
    "UseHsts": false
  },

  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:8080",
        "Certificate": {
          "Path": "./5_csv_basic_auth/localhost.pfx",
          "Password": "dev123"
        }
      }
    }
  }
}
```

| Setting | Value | Description |
|---------|-------|-------------|
| `Ssl.Enabled` | `true` | Enables Kestrel HTTPS configuration |
| `Ssl.UseHttpsRedirection` | `false` | Not needed when only HTTPS is used |
| `Ssl.UseHsts` | `false` | Disabled for development (enable in production) |

### Basic Auth Configuration

```json
{
  "AuthenticationOptions": {
    "DefaultAuthenticationType": "example_5",
    "BasicAuth": {
      "SslRequirement": "Required"
    }
  }
}
```

| Setting | Value | Description |
|---------|-------|-------------|
| `DefaultAuthenticationType` | `"example_5"` | Required for `user_params` - sets `IsAuthenticated=true` |
| `SslRequirement` | `"Required"` | Rejects Basic Auth over plain HTTP |

### SQL Function Annotations

```sql
comment on function example_5_public.sales_report(text) is '
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
Content-Disposition: attachment; filename="sales_report.csv"
@basic_auth admin lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp
@user_params';
```

| Annotation | Description |
|------------|-------------|
| `basic_auth admin <hash>` | Requires Basic Auth with username `admin` and hashed password |
| `user_params` | Maps authenticated username to `_user_name` parameter |

## Password Hashing

Generate a password hash using:

```bash
npgsqlrest --hash your_password
```

Example:
```bash
npgsqlrest --hash secret123
# Output: lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp
```

## Troubleshooting

### Certificate Issues

**Clean and recreate certificate:**
```bash
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

**macOS Keychain:**
If prompted, allow the certificate to be trusted in Keychain Access.

**Windows:**
Run the command prompt as Administrator if trust fails.

### Connection Refused

Ensure the application is running and listening on the correct port:
```
[12:00:00.000 INF] Now listening on: https://localhost:8080
```

### SSL Certificate Error in Browser

For development, you can proceed past the browser warning.
In production, use a proper certificate from a trusted CA.

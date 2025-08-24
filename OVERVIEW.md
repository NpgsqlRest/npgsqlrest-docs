# NpgsqlRest Overview

**Transform Your PostgreSQL Database into a Production-Ready REST API Server**

NpgsqlRest automatically generates blazing-fast REST APIs from your PostgreSQL database with built-in static type checking and code generation.

## What is NpgsqlRest?

NpgsqlRest is a high-performance, native executable that turns your PostgreSQL functions, procedures, tables, and views into REST endpoints with zero boilerplate code. Simply annotate your database objects with comments, and get a production-ready API server with automatic TypeScript client generation.

## Key Benefits

### 🚀 **Zero Configuration**
- Works with any PostgreSQL database out-of-the-box
- No schema migrations or special setup required
- One connection string and you're ready to go

### ⚡ **Exceptional Performance**
- Native executable with AOT compilation
- Zero dependencies, instant startup
- Built on .NET Kestrel for maximum throughput
- Connection pooling and optimization built-in

### 🛡️ **Enterprise Security**
- Multiple authentication methods (Bearer, Cookie, OAuth)
- Role-based authorization with PostgreSQL integration
- Encrypted tokens and password validation
- CORS, CSRF, and SSL/TLS support

### 🎯 **Database-First Architecture**
- Declare API behavior directly in your database
- Comment annotations control HTTP methods, paths, and headers
- Keep data and API declarations in one place
- No duplicate definitions or synchronization issues

### 📱 **Automatic Code Generation**
- TypeScript interfaces and fetch modules
- HTTP files for testing and development
- Static type checking for your entire stack
- Eliminate runtime errors with compile-time validation

## How It Works

### 1. Annotate Your Database
```sql
CREATE FUNCTION get_users()
RETURNS TABLE(id INT, name TEXT)
LANGUAGE SQL AS $$ SELECT id, name FROM users $$;

COMMENT ON FUNCTION get_users() IS 'HTTP GET /api/users';
```

### 2. Start the Server
```bash
./npgsqlrest
```

### 3. Use Generated Code
```typescript
// Automatically generated TypeScript client
const users = await getUsers();
```

## Core Features

### **Instant API Endpoints**
- Functions → REST endpoints
- Tables/Views → CRUD operations
- Procedures → Custom logic endpoints
- Comment-driven configuration

### **Real-Time Streaming**
- Server-sent events from PostgreSQL
- Live notifications and updates
- Custom event scoping (user, role, global)
- No database locking

### **Advanced Configuration**
- Multiple database connections
- Custom headers and response formats
- Caching and compression
- Request/response transformation

### **Developer Experience**
- Hot reload in development
- Comprehensive logging and debugging
- Performance metrics and monitoring
- Extensive configuration options

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   TypeScript    │    │              │    │   PostgreSQL    │
│   Frontend      │◄──►│  NpgsqlRest  │◄──►│   Database      │
│   (Generated)   │    │   Server     │    │  (Annotated)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

- **Database**: Source of truth for API definitions
- **NpgsqlRest**: High-performance API server and code generator  
- **Generated Code**: Type-safe client libraries and HTTP files

## Use Cases

### **Rapid Prototyping**
Turn database schemas into working APIs in minutes for proof-of-concepts and demos.

### **Microservices**
Create focused, database-driven services with minimal overhead and maximum performance.

### **Full-Stack Applications**
Build type-safe applications with automatic synchronization between database and frontend.

### **Legacy Modernization**
Expose existing PostgreSQL databases as modern REST APIs without rewriting business logic.

### **Data APIs**
Create high-performance data access layers with built-in security and optimization.

## Deployment Options

- **Native Executable**: Zero-dependency, single-file deployment
- **Docker Container**: Production-ready containerization
- **NPM Package**: Easy integration into Node.js workflows
- **.NET Library**: Embed in existing .NET applications

## Why Choose NpgsqlRest?

| Traditional APIs | NpgsqlRest |
|------------------|------------|
| Write boilerplate REST code | Comment annotations only |
| Manually sync database changes | Automatic synchronization |
| Runtime type errors | Compile-time type safety |
| Separate API documentation | Self-documenting database |
| Multiple deployment dependencies | Single native executable |
| Custom security implementation | Enterprise security built-in |

## Getting Started

1. **[Installation](./INSTALLATION.md)** - Download, NPM, or Docker
2. **[Getting Started](./GETTING_STARTED.md)** - Build your first API
3. **[Documentation](./docs/)** - Comprehensive guides and examples

Ready to transform your PostgreSQL database into a powerful API server? Get started in seconds with NpgsqlRest.
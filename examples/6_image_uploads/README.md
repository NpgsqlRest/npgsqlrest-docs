# Example 6: Image Uploads

This example demonstrates file upload functionality with three different storage handlers:

1. **Large Object Handler** - Stores images directly in PostgreSQL using the Large Object API
2. **File System Handler** - Stores images on the server's file system
3. **Combined Handler** - Stores images in both PostgreSQL AND the file system simultaneously

## Features Demonstrated

- Cookie-based authentication (simple login with bob and alice)
- Image-only uploads with validation (magic byte checking)
- Three upload handlers: `large_object`, `file_system`, and combined
- Upload metadata handling in PostgreSQL functions
- Automatic unique filename generation
- Upload tracking in database tables

## Test Credentials

| Username | Password |
|----------|----------|
| `alice` | `password123` |
| `bob` | `password456` |

## Quick Start

### 1. Run Database Migrations

```bash
cd 6_image_uploads
bun run db:up
```

### 2. Build the Frontend

```bash
bun run build
```

### 3. Start the Server

```bash
bun run dev
```

### 4. Open in Browser

Navigate to http://127.0.0.1:8080

## How It Works

### Image Validation

All upload endpoints validate that uploaded files are actual images by checking their magic bytes (file signatures):

| Format | Magic Bytes |
|--------|-------------|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47` |
| GIF | `47 49 46 38` |
| BMP | `42 4D` |
| TIFF | `49 49 2A 00` or `4D 4D 00 2A` |
| WebP | `52 49 46 46 ... 57 45 42 50` |

Non-image files will be rejected with status `InvalidImage`.

### Upload Handlers

#### Large Object Handler

Stores binary data directly in PostgreSQL using the [Large Object](https://www.postgresql.org/docs/current/largeobjects.html) API. Returns an OID that can be used to retrieve the file.

```sql
-- Upload function annotation
comment on function example_6.upload_to_large_object(int, json) is '
@upload for large_object
@param _meta is upload metadata
@check_image = true';
```

**Metadata returned:**
```json
{
  "type": "large_object",
  "fileName": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 45678,
  "oid": 12345,
  "success": true,
  "status": "Ok"
}
```

#### File System Handler

Stores files on the server's file system. Returns the path where the file was saved.

```sql
-- Upload function annotation
comment on function example_6.upload_to_file_system(int, json) is '
@upload for file_system
@param _meta is upload metadata
@check_image = true
@path = ./6_image_uploads/uploads
@unique_name = true
@create_path = true';
```

**Metadata returned:**
```json
{
  "type": "file_system",
  "fileName": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 45678,
  "filePath": "./6_image_uploads/uploads/abc123.jpg",
  "success": true,
  "status": "Ok"
}
```

#### Combined Handler

Uses both handlers simultaneously. The upload is processed by both `large_object` and `file_system` handlers.

```sql
-- Upload function annotation
comment on function example_6.upload_to_combined(int, json) is '
@upload for large_object, file_system
@param _meta is upload metadata
@check_image = true
@path = ./6_image_uploads/uploads
@unique_name = true
@create_path = true';
```

## Database Schema

### Uploads Table

All uploads are stored in a unified table that supports all handler types:

```sql
create table example_6.uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    content_type text not null,
    file_size bigint not null,
    oid bigint,        -- populated by large_object handler
    file_path text,    -- populated by file_system handler
    uploaded_at timestamptz not null default now()
);
```

- **Large Object uploads**: `oid` is set, `file_path` is null
- **File System uploads**: `file_path` is set, `oid` is null
- **Combined uploads**: both `oid` and `file_path` are set

## Configuration

Key configuration in `config.json`:

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "Enabled": true,
      "DefaultUploadHandler": "large_object",
      "UploadHandlers": {
        "LargeObjectEnabled": true,
        "LargeObjectCheckImage": true,
        "FileSystemEnabled": true,
        "FileSystemPath": "./6_image_uploads/uploads",
        "FileSystemCheckImage": true,
        "FileSystemUseUniqueFileName": true,
        "FileSystemCreatePathIfNotExists": true
      }
    }
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/example-6/login` | Login with username/password |
| POST | `/api/example-6/logout` | Logout (clear cookie) |
| POST | `/api/example-6/upload-to-large-object` | Upload image to PostgreSQL Large Object |
| POST | `/api/example-6/upload-to-file-system` | Upload image to file system |
| POST | `/api/example-6/upload-to-combined` | Upload image to both storage types |
| GET | `/api/example-6/get-my-uploads` | List user's uploaded images |

## Testing with cURL

```bash
# Login
curl -c cookies.txt -X POST http://127.0.0.1:8080/api/example-6/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'

# Upload to Large Object
curl -b cookies.txt -X POST http://127.0.0.1:8080/api/example-6/upload-to-large-object \
  -F "file=@photo.jpg"

# Upload to File System
curl -b cookies.txt -X POST http://127.0.0.1:8080/api/example-6/upload-to-file-system \
  -F "file=@photo.jpg"

# Upload to Both
curl -b cookies.txt -X POST http://127.0.0.1:8080/api/example-6/upload-to-combined \
  -F "file=@photo.jpg"

# List uploads
curl -b cookies.txt http://127.0.0.1:8080/api/example-6/get-my-uploads
```

## Related Documentation

- [Upload Annotation](https://npgsqlrest.github.io/annotations/upload)
- [Upload Configuration](https://npgsqlrest.github.io/config/uploads)
- [Cookie Authentication](https://npgsqlrest.github.io/config/auth#cookie-authentication)

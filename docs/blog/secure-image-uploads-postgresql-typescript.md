---
layout: doc
outline: [2, 3]
title: "Secure Image Uploads with PostgreSQL: File System and Large Objects"
titleTemplate: NpgsqlRest
description: "Build a complete image upload system with PostgreSQL. Store files on disk or in Large Objects, with automatic TypeScript client and progress tracking."
head:
  - - meta
    - name: keywords
      content: postgresql image upload, file upload postgresql, postgresql large objects, secure file upload api, npgsqlrest uploads, postgresql blob storage, typescript file upload
  - - meta
    - property: og:title
      content: "Secure Image Uploads with PostgreSQL: File System and Large Objects"
  - - meta
    - property: og:description
      content: "Build a complete image upload system with PostgreSQL. Store files on disk or in Large Objects."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Secure Image Uploads with PostgreSQL"
  - - meta
    - name: twitter:description
      content: "Build image uploads with PostgreSQL. File system or Large Objects storage."
---

# Secure Image Uploads with PostgreSQL: File System, Large Objects, and Type-Safe TypeScript

<p class="blog-meta">
  <span>January 2026</span> ·
  <span class="tag">Uploads</span>
  <span class="tag">PostgreSQL</span>
  <span class="tag">TypeScript</span>
  <span class="tag">NpgsqlRest</span>
</p>

This tutorial shows how to build a complete image upload system with NpgsqlRest. You'll learn to store images on the file system, in PostgreSQL Large Objects, or both - all with automatic TypeScript client generation and progress tracking.

> **Source Code**: [github.com/NpgsqlRest/npgsqlrest-docs/examples/6_image_uploads](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/6_image_uploads)

## Storage Options

| Strategy | Use When | Stored In |
|----------|----------|-----------|
| **File System** | Fast CDN delivery needed | Disk files |
| **Large Object** | Database backup required | PostgreSQL `pg_largeobject` |
| **Combined** | Need both speed and backup | Both locations |

### When to Use Each Strategy

**File System** - Use when:
- You need fast, direct file serving (web server/CDN)
- Files are large and frequently accessed
- You have separate backup infrastructure

**Large Object** - Use when:
- You want images included in database backups automatically
- Transactional integrity matters (failed upload = no orphaned files)
- You need database-level access control

**Combined** - Use when:
- Images are mission-critical and need redundancy
- You want fast CDN serving AND automatic database backups

## Step 1: Create the Schema

Create a table to track uploads and a response type for type-safe TypeScript generation:

```sql
-- Unified uploads table
create table example_6.uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    content_type text not null,
    file_size bigint not null,
    oid bigint,           -- Large Object identifier (when using LO handler)
    file_path text,       -- File path (when using FS handler)
    uploaded_at timestamptz not null default now()
);

-- Response type for generated TypeScript interfaces
create type example_6.upload_response as (
    success boolean,
    status text,
    file_name text,
    content_type text,
    file_size bigint,
    oid bigint,
    file_path text
);
```

The `oid` and `file_path` columns are nullable - each upload populates one or both depending on which handler is used.

## Step 2: Configure Upload Handlers

In `config.json`, enable the upload handlers:

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "Enabled": true,
      "UseDefaultUploadMetadataParameter": true,
      "DefaultUploadMetadataParameterName": "_meta",

      "UploadHandlers": {
        "StopAfterFirstSuccess": false,
        "BufferSize": 16384,

        "LargeObjectEnabled": true,
        "LargeObjectKey": "large_object",
        "LargeObjectCheckImage": true,

        "FileSystemEnabled": true,
        "FileSystemKey": "file_system",
        "FileSystemPath": "./uploads",
        "FileSystemUseUniqueFileName": true,
        "FileSystemCreatePathIfNotExists": true,
        "FileSystemCheckImage": true
      }
    }
  }
}
```

See [upload configuration](/config/uploads) for all options.

## Step 3: Create the Upload Function

Here's the key insight: **all upload functions use identical code**. Only the annotation changes.

```sql
create or replace function example_6.upload_to_file_system(
    _user_id text = null,
    _meta json = null
)
returns setof example_6.upload_response
language sql
begin atomic;
    -- Insert successful uploads into the database
    with inserted as (
        insert into example_6.uploads (user_id, file_name, content_type, file_size, oid, file_path)
        select
            _user_id::int,
            m->>'fileName',
            m->>'contentType',
            (m->>'size')::bigint,
            (m->>'oid')::bigint,
            m->>'filePath'
        from json_array_elements(_meta) as m
        where (m->>'success')::boolean = true
        returning *
    )
    -- Return all upload results to the client
    select
        (m->>'success')::boolean,
        m->>'status',
        m->>'fileName',
        m->>'contentType',
        (m->>'size')::bigint,
        (m->>'oid')::bigint,
        m->>'filePath'
    from json_array_elements(_meta) as m;
end;
```

The function:
1. Receives upload metadata in `_meta` parameter (injected by NpgsqlRest)
2. Inserts successful uploads into the database
3. Returns all results to the client

## Step 4: Add the Upload Annotation

The annotation in the function comment controls which handler processes uploads:

```sql
-- File System storage
comment on function example_6.upload_to_file_system(text, json) is '
HTTP POST
@upload for file_system
@param _meta is upload metadata
@check_image = true
@path = ./uploads
@unique_name = true';

-- Large Object storage
comment on function example_6.upload_to_large_object(text, json) is '
HTTP POST
@upload for large_object
@param _meta is upload metadata
@check_image = true';

-- Combined (both handlers)
comment on function example_6.upload_to_combined(text, json) is '
HTTP POST
@upload for large_object, file_system
@param _meta is upload metadata
@check_image = true
@path = ./uploads
@unique_name = true';
```

Key annotations:
- `@upload for <handler>` - Which handler(s) to use (comma-separated for multiple)
- `@param _meta is upload metadata` - Injects upload results into this parameter
- `check_image = true` - Validates file is actually an image (checks magic bytes)
- `check_image = jpg, gif` - Only allow specific image formats
- `check_text = true` - Validates file is text (not binary)
- `path = ./uploads` - Where to store files (file_system)
- `file = {_filename}` - Custom filename from parameter (file_system)
- `unique_name = true` - Generate UUID filenames (file_system)
- `create_path = true` - Create directory if it doesn't exist (file_system)
- `oid = {_oid}` - Use specific OID from parameter (large_object)
- `included_mime_types = image/*, application/*` - Only allow these MIME types
- `large_object_excluded_mime_types = text*` - Exclude MIME types from Large Object handler
- `stop_after_first_success = true` - Stop processing after first handler succeeds

See [upload annotations](/annotations/upload) for all options.

## How the Metadata Works

When you upload a file, NpgsqlRest processes it through the handler and passes metadata to your function:

```json
[
  {
    "type": "file_system",
    "fileName": "photo.jpg",
    "contentType": "image/jpeg",
    "size": 245678,
    "filePath": "./uploads/abc123-photo.jpg",
    "success": true,
    "status": "Ok"
  }
]
```

Which fields are populated depends on the handler:
- `file_system` → `filePath`
- `large_object` → `oid`
- Both handlers → two entries per file, one from each handler

### When Uploads Fail

Failed uploads still appear in the metadata with `success: false` and a status code:

```json
{
  "type": "file_system",
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "size": 102400,
  "filePath": null,
  "success": false,
  "status": "InvalidImage"
}
```

Status values:
- `Ok` - Upload succeeded
- `InvalidImage` - File is not a valid image (when `check_image = true`)
- `InvalidMimeType` - MIME type not in allowed list
- `ProbablyBinary` - File appears to be binary (when `check_text = true`)
- `InvalidFormat` - Invalid file format
- `NoNewLines` - Text file has no newlines
- `Empty` - File is empty
- `Ignored` - Handler skipped (when `stop_after_first_success = true`)

## Step 5: Use the Generated Client

NpgsqlRest generates a TypeScript client with progress tracking:

```typescript
import { uploadToFileSystem } from "./example6Api.ts";

const fileInput = document.getElementById("file-input") as HTMLInputElement;

const response = await uploadToFileSystem(
    fileInput.files,
    { },
    (loaded, total) => {
        progressBar.style.width = `${Math.round((loaded / total) * 100)}%`;
    }
);

if (response.status === 200) {
    console.log("Uploaded:", response.response);
}
```

See [code generation](/config/codegen) for configuration options.

## Step 6: Serve Images from Large Objects

For images stored in Large Objects, create a function to retrieve them:

```sql
create or replace function example_6.get_image(
    _oid bigint,
    _mime_type text
)
returns bytea
language sql
begin atomic;
    select lo_get(_oid);
end;

comment on function example_6.get_image(bigint, text) is '
HTTP GET
@raw
content_type: {_mime_type}
Cache-Control: public, max-age=31536000, immutable';
```

Annotations:
- [`@raw`](/annotations/raw) - Returns binary data, not JSON
- `content_type: {_mime_type}` - Sets response [content-type](/annotations/response-headers) from parameter
- `Cache-Control` - Enables browser/CDN caching

### Performance: Large Objects vs File System

Unlike file system storage where the web server serves static files directly, **every Large Object request requires**:

1. Opening a database connection from the pool
2. Executing the `lo_get()` function
3. Streaming binary data through the application
4. Returning the connection to the pool

This is more expensive than serving a static file. For high-traffic images, use `Cache-Control` headers so browsers and CDNs cache the response:

- `public` - Any cache can store it
- `max-age=31536000` - Cache for 1 year
- `immutable` - Content never changes (safe because each OID is unique)

After the first request, subsequent requests are served from cache without hitting your database.

## Displaying Images

Serve images based on storage type:

```typescript
if (upload.filePath) {
    // File system: static file URL
    imgUrl = upload.filePath.replace('./uploads', '/uploads');
} else if (upload.oid) {
    // Large Object: API endpoint
    imgUrl = `/api/get-image?oid=${upload.oid}&mimeType=${encodeURIComponent(upload.contentType)}`;
}
```

## Backup Advantage

Large Objects are included in `pg_dump` automatically. With combined storage, you get:
- Fast serving from file system / CDN
- Automatic backup with your database

## Traditional Approach Comparison

To appreciate what NpgsqlRest provides, consider what a traditional implementation requires:

**ASP.NET Core (C#):**
```csharp
[HttpPost("upload")]
[Authorize]
public async Task<IActionResult> Upload(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("No file");

    // Validate image
    using var image = Image.Load(file.OpenReadStream());
    if (image == null)
        return BadRequest("Invalid image");

    // Generate unique filename
    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
    var filePath = Path.Combine(_uploadPath, fileName);

    // Save to file system
    using var stream = new FileStream(filePath, FileMode.Create);
    await file.CopyToAsync(stream);

    // Save metadata to database
    var upload = new Upload {
        UserId = User.GetUserId(),
        FileName = file.FileName,
        ContentType = file.ContentType,
        FileSize = file.Length,
        FilePath = filePath
    };
    _context.Uploads.Add(upload);
    await _context.SaveChangesAsync();

    return Ok(new { upload.Id, filePath });
}
```

**Spring Boot (Java):**
```java
@PostMapping("/upload")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
        return ResponseEntity.badRequest().body("No file");
    }

    // Validate image
    try {
        BufferedImage img = ImageIO.read(file.getInputStream());
        if (img == null) throw new IOException("Invalid image");
    } catch (IOException e) {
        return ResponseEntity.badRequest().body("Invalid image");
    }

    // Generate unique filename and save
    String fileName = UUID.randomUUID() + getExtension(file.getOriginalFilename());
    Path filePath = Paths.get(uploadPath, fileName);
    Files.copy(file.getInputStream(), filePath);

    // Save to database
    Upload upload = new Upload();
    upload.setUserId(getCurrentUserId());
    upload.setFileName(file.getOriginalFilename());
    upload.setContentType(file.getContentType());
    upload.setFileSize(file.getSize());
    upload.setFilePath(filePath.toString());
    uploadRepository.save(upload);

    return ResponseEntity.ok(Map.of("id", upload.getId(), "path", filePath));
}
```

**FastAPI (Python):**
```python
@app.post("/upload")
async def upload(file: UploadFile, user: User = Depends(get_current_user)):
    if not file:
        raise HTTPException(400, "No file")

    # Validate image
    contents = await file.read()
    try:
        Image.open(io.BytesIO(contents)).verify()
    except:
        raise HTTPException(400, "Invalid image")

    # Generate unique filename and save
    file_name = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = UPLOAD_PATH / file_name
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)

    # Save to database
    upload = Upload(
        user_id=user.id,
        file_name=file.filename,
        content_type=file.content_type,
        file_size=len(contents),
        file_path=str(file_path)
    )
    db.add(upload)
    await db.commit()

    return {"id": upload.id, "path": str(file_path)}
```

And this is just the backend. You still need:
- ORM entity classes / models
- Repository interfaces
- Database migration files
- DTOs for request/response
- TypeScript interfaces (manual or OpenAPI tooling)
- Frontend upload code with progress tracking

**Meanwhile, NpgsqlRest handles the backend automatically based on your SQL function and annotations, and generates this TypeScript client for your frontend:**

```typescript
// Auto-generated - you write ZERO of this code

interface IUploadToFileSystemResponse {
    type: string;
    fileName: string;
    contentType: string;
    size: number;
    success: boolean;
    status: string;
    filePath?: string;
    oid?: number;
}

export async function uploadToFileSystem(
    files: FileList | null,
    request: IUploadToFileSystemRequest,
    progress?: (loaded: number, total: number) => void,
): Promise<{
    status: number,
    response: IUploadToFileSystemResponse[],
    error: {status: number; title: string; detail?: string | null} | undefined
}> {
    return new Promise((resolve, reject) => {
        if (!files || files.length === 0) {
            reject(new Error("No files to upload"));
            return;
        }
        var xhr = new XMLHttpRequest();
        if (progress) {
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && progress) {
                    progress(event.loaded, event.total);
                }
            }, false);
        }
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve({status: this.status, response: JSON.parse(this.responseText), error: undefined});
            } else {
                resolve({status: this.status, response: [], error: JSON.parse(this.responseText)});
            }
        };
        xhr.onerror = function () {
            reject({xhr: this, status: this.status, statusText: this.statusText});
        };
        xhr.open("POST", baseUrl + "/api/example-6/upload-to-file-system" + parseQuery(request));
        const formData = new FormData();
        for(let i = 0; i < files.length; i++) {
            formData.append("file", files[i], files[i].name);
        }
        xhr.send(formData);
    });
}
```

Typed interfaces, FormData handling, progress callbacks, error handling - all generated from your SQL function signature.

**Line count comparison for a complete upload feature:**

| Component | Traditional | NpgsqlRest |
|-----------|-------------|------------|
| Backend endpoint | 30-50 | 0 |
| Entity/Model class | 15-25 | 0 |
| Repository | 10-20 | 0 |
| DTO classes | 10-20 | 0 |
| Database migration | 10-15 | 10-15 |
| SQL function | 0 | 20 |
| Annotation | 0 | 5 |
| TypeScript types | 15-30 (manual) | 0 (generated) |
| Frontend upload | 30-50 | 10 (generated) |
| **Total** | **~120-210** | **~35-50** |

That's **70-80% less code** - and the NpgsqlRest code is mostly just your SQL function doing exactly what you want, with TypeScript client generated automatically.

## Summary

To add image uploads to your NpgsqlRest application:

1. Create an `uploads` table with `oid` and `file_path` columns
2. Enable upload handlers in `config.json`
3. Write a single upload function that inserts from `_meta` JSON
4. Add `upload for <handler>` annotation to choose storage
5. Use the generated TypeScript client with progress callbacks

The same function code works for all three storage strategies - only the annotation changes.

<BlogNav
  source-code="https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/6_image_uploads"
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Upload Annotations', href: '/annotations/upload' },
    { text: 'Upload Configuration', href: '/config/uploads' },
    { text: 'Code Generation', href: '/config/codegen' },
    { text: 'Response Headers', href: '/annotations/response-headers' },
    { text: 'Raw Output', href: '/annotations/raw' }
  ]"
/>

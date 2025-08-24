---
outline: [2, 3]
title: "UPLOAD Annotation"
titleTemplate: NpgsqlRest
description: "Create file upload endpoints for PostgreSQL REST APIs. Handle multipart uploads with Large Objects, file system, CSV, or Excel handlers."
head:
  - - meta
    - name: keywords
      content: npgsqlrest upload, file upload api, multipart upload, postgresql large objects, csv upload excel upload
  - - meta
    - property: og:title
      content: "NpgsqlRest UPLOAD Annotation"
  - - meta
    - property: og:description
      content: "Create file upload endpoints with Large Objects, file system, CSV, or Excel handlers."
  - - meta
    - property: og:type
      content: article
---

# UPLOAD

Mark endpoint as a file upload handler.

## Keywords

`@upload`, `upload`

## Syntax

```
@upload
@upload for <handler_type>
```

If no handler is specified (only `upload` annotation without `for`), then the default handler will be used. The default handler is `large_object` unless configured otherwise via `DefaultUploadHandler` setting.

## Handler Types

There are 4 handler types available:

| Handler | Key | Description |
|---------|-----|-------------|
| Large Object | `large_object` | Stores files using PostgreSQL Large Objects API (default) |
| File System | `file_system` | Stores files on the server file system |
| CSV | `csv` | Parses CSV files and processes rows via PostgreSQL command |
| Excel | `excel` | Parses Excel files and processes rows via PostgreSQL command |

## Shared Annotation Options

These options are available for all handler types:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `stop_after_first_success` | bool | `false` | Stop upload after first successful upload when multiple handlers are used. Subsequent files will have status `Ignored`. |
| `included_mime_types` | string | `null` | CSV string of MIME type patterns to include. Set to `null` to allow all. |
| `excluded_mime_types` | string | `null` | CSV string of MIME type patterns to exclude. Set to `null` to exclude none. |
| `buffer_size` | int | `null` | Buffer size in bytes for raw content uploads (`large_object` and `file_system`). |
| `check_text` | bool | `false` | Validate file is a text file (not binary). Set to `true` to accept only text files. |
| `check_image` | bool/string | `false` | Validate file is an image. Set to `true` to accept only images, or CSV of allowed types: `jpg`, `png`, `gif`, `bmp`, `tiff`, `webp`. |
| `test_buffer_size` | int | `4096` | Buffer size in bytes when checking text files. |
| `non_printable_threshold` | int | `5` | Maximum non-printable characters allowed in test buffer to consider a valid text file. |
| `check_format` | bool | `false` | Validate the file format before processing. When `true` and validation fails, the `fallback_handler` is used if configured. |
| `fallback_handler` | string | `null` | Handler name to delegate to if format validation fails (e.g., `large_object`, `file_system`, `csv`, `excel`). When a handler's format validation fails and a `fallback_handler` is configured, processing is automatically delegated to the named handler. |

## Upload Metadata

All handlers return upload metadata as JSON with the following common properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Handler type used (`large_object`, `file_system`, `csv`, `excel`) |
| `fileName` | string | Original uploaded file name |
| `contentType` | string | MIME type of the uploaded file |
| `size` | int | File size in bytes |
| `success` | bool | Whether the upload succeeded |
| `status` | string | Status message (e.g., `Ok`, `InvalidMimeType`) |

Handler-specific properties:

| Handler | Property | Type | Description |
|---------|----------|------|-------------|
| `large_object` | `oid` | int | PostgreSQL Large Object OID |
| `file_system` | `filePath` | string | Path where file was saved |

## Large Object Handler

Default handler that stores files using PostgreSQL Large Objects.

### Basic Example

```sql
create function lo_simple_upload(
    _meta json = null
)
returns json
language plpgsql
as
$$
begin
    return _meta;
end;
$$;

comment on function lo_simple_upload(json) is '
@upload
@param _meta is upload metadata
';
```

### With Custom OID Parameter

You can specify a custom OID for the large object:

```sql
create function lo_custom_parameter_upload(
    _oid bigint,
    _meta json = null
)
returns json
language plpgsql
as
$$
begin
    return _meta;
end;
$$;

comment on function lo_custom_parameter_upload(bigint, json) is '
@upload for large_object
@param _meta is upload metadata
@oid = {_oid}
';
```

### Context Metadata

Upload metadata is also available via PostgreSQL context setting:

```sql
create function lo_simple_upload_context_metadata()
returns json
language plpgsql
as
$$
begin
    return current_setting('request.upload_metadata', true)::text;
end;
$$;

comment on function lo_simple_upload_context_metadata() is '@upload';
```

### Large Object Annotation Options

All shared options plus:

| Option | Description |
|--------|-------------|
| `oid` | Custom OID for the large object |
| `large_object_included_mime_types` | Handler-specific MIME types to include |
| `large_object_excluded_mime_types` | Handler-specific MIME types to exclude |
| `large_object_buffer_size` | Handler-specific buffer size |
| `large_object_oid` | Handler-specific OID (alias for `oid`) |
| `large_object_check_text` | Handler-specific text check |
| `large_object_check_image` | Handler-specific image check |
| `large_object_test_buffer_size` | Handler-specific test buffer size |
| `large_object_non_printable_threshold` | Handler-specific non-printable threshold |

## File System Handler

Stores files on the server file system.

### Basic Example

```sql
create function fs_simple_upload(
    _meta json = null
)
returns json
language plpgsql
as
$$
begin
    return _meta;
end;
$$;

comment on function fs_simple_upload(json) is '
@upload for file_system
@param _meta is upload metadata
';
```

### With Custom Parameters

Control the file path, name, and behavior:

```sql
create function fs_custom_parameter_upload(
    _path text,
    _file text,
    _unique_name boolean,
    _create_path boolean,
    _meta json = null
)
returns json
language plpgsql
as
$$
begin
    return _meta;
end;
$$;

comment on function fs_custom_parameter_upload(text, text, boolean, boolean, json) is '
@upload for file_system
@param _meta is upload metadata
@path = {_path}
@file = {_file}
@unique_name = {_unique_name}
@create_path = {_create_path}
';
```

### File System Annotation Options

All shared options plus:

| Option | Description |
|--------|-------------|
| `path` | Directory path for uploaded file |
| `file` | File name to use |
| `unique_name` | Generate unique file name (bool) |
| `create_path` | Create directory if not exists (bool) |
| `file_system_included_mime_types` | Handler-specific MIME types to include |
| `file_system_excluded_mime_types` | Handler-specific MIME types to exclude |
| `file_system_buffer_size` | Handler-specific buffer size |
| `file_system_path` | Handler-specific path (alias for `path`) |
| `file_system_file` | Handler-specific file name (alias for `file`) |
| `file_system_unique_name` | Handler-specific unique name setting |
| `file_system_create_path` | Handler-specific create path setting |
| `file_system_check_text` | Handler-specific text check |
| `file_system_check_image` | Handler-specific image check |
| `file_system_test_buffer_size` | Handler-specific test buffer size |
| `file_system_non_printable_threshold` | Handler-specific non-printable threshold |

### MIME Type Filtering

```sql
comment on function fs_upload_include_mime_type(json) is '
@upload for file_system
@param _meta is upload metadata
@path = ./test
@file = mime_type.csv
@included_mime_types = image/*, application/*
';
```

## CSV Handler

Parses CSV files and processes each row via a PostgreSQL command.

### Row Command Function Signature

The row command function receives up to 4 parameters:

```sql
create function my_csv_row_processor(
    _index int,           -- $1: Row index (1-based)
    _row text[],          -- $2: Parsed row values as text array
    _prev_result any,     -- $3: Result of previous row command (for chaining)
    _meta json            -- $4: Row metadata JSON
)
returns any               -- Return value passed to next row as $3
```

### Row Command Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | `int` | Row index (1-based, includes header row) |
| `$2` | `text[]` | Parsed row values as text array (e.g., `_row[1]`, `_row[2]`, etc.) |
| `$3` | `any` | Result of previous row command execution (see below) |
| `$4` | `json` | Row metadata JSON object |

**Row chaining with `$3`:** The return value from each row command is passed to the next row as `$3`. For the first row, `$3` is `NULL`. If the row command returns `void` (no return value), `$3` will be `NULL` for the next row. This enables accumulating values across rows (e.g., counting rows, summing values).

### Row Metadata Structure (`$4`)

The metadata JSON passed to each row command contains:

```json
{
  "type": "csv",
  "fileName": "data.csv",
  "contentType": "text/csv",
  "size": 1234,
  "claims": {                    // Only if RowCommandUserClaimsKey is set (default: "claims")
    "user_id": "1",
    "user_name": "alice",
    "name_identifier": "1"
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Handler type (`"csv"`) |
| `fileName` | string | Original uploaded file name |
| `contentType` | string | MIME type of the file |
| `size` | int | File size in bytes |
| `claims` | object | User claims (when `RowCommandUserClaimsKey` is configured) |

> **Note:** Unlike Excel, CSV row metadata does NOT include `rowIndex`. Use the `$1` parameter for the row index.

### Upload Function Metadata (`_meta` parameter)

The main upload function receives metadata as a JSON **array** with one element per uploaded file:

```json
[
  {
    "type": "csv",
    "fileName": "data.csv",
    "contentType": "text/csv",
    "size": 1234,
    "success": true,
    "status": "Ok",
    "lastResult": 100
  }
]
```

| Property | Type | Description |
|----------|------|-------------|
| `lastResult` | any | Final return value from the last row command execution |

### Basic Example

```sql
-- Table for uploads
create table csv_uploads (
    id int primary key generated always as identity,
    file_name text not null,
    row_index int not null,
    row_data text[] not null
);

-- Row command to process each CSV row
create function csv_upload_row(
    _index int,
    _row text[],
    _prev_result int,
    _meta json
)
returns int
language plpgsql
as $$
begin
    insert into csv_uploads (file_name, row_index, row_data)
    values (_meta->>'fileName', _index, _row);

    return coalesce(_prev_result, 0) + 1;
end;
$$;

-- HTTP POST endpoint
create function csv_upload(_meta json = null)
returns json
language sql
begin atomic;
    select _meta;
end;

comment on function csv_upload(json) is '
@upload for csv
@param _meta is upload metadata
@row_command = select csv_upload_row($1,$2,$3,$4)
';
```

### Accessing User Claims in Row Command

With `RowCommandUserClaimsKey` configured (default: `"claims"`), user claims are available in the row metadata:

```sql
create function csv_upload_row(
    _index int,
    _row text[],
    _prev_result int,
    _meta json
)
returns int
language plpgsql
as $$
begin
    insert into csv_uploads (user_id, file_name, row_index, row_data)
    values (
        (_meta->'claims'->>'user_id')::int,  -- Access user_id from claims
        _meta->>'fileName',
        _index,
        _row
    );
    return coalesce(_prev_result, 0) + 1;
end;
$$;
```

### Using User Context Variables

With `UseUserContext: true`, user context variables are set before upload and accessible via `current_setting()`:

```sql
create function csv_upload_row(
    _index int,
    _row text[],
    _prev_result int,
    _meta json
)
returns int
language plpgsql
as $$
begin
    insert into csv_uploads (user_id, file_name, row_index, row_data)
    values (
        current_setting('request.user_id')::int,  -- Access from context
        _meta->>'fileName',
        _index,
        _row
    );
    return coalesce(_prev_result, 0) + 1;
end;
$$;
```

### Custom Delimiters

Support multiple delimiter characters:

```sql
comment on function csv_upload(json) is '
@upload for csv
@param _meta is upload metadata
@delimiters = ,;
@row_command = select csv_upload_row($1,$2,$3,$4)
';
```

This will use comma (`,`) and semicolon (`;`) as delimiters. Use `\t` for tab.

### CSV Annotation Options

All shared options (except `buffer_size`, `check_text`, `check_image`) plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `row_command` | string | - | PostgreSQL command to process each row (required) |
| `delimiters` | string | `,` | Delimiter character(s) |
| `check_format` | bool | `false` | Validate file is text before processing |
| `has_fields_enclosed_in_quotes` | bool | `true` | Fields may be enclosed in quotes |
| `set_white_space_to_null` | bool | `true` | Convert whitespace-only values to NULL |

Handler-specific prefixed aliases are also available (e.g., `csv_row_command`, `csv_delimiters`).

## Excel Handler

Parses Excel files (.xlsx, .xls) and processes each row via a PostgreSQL command.

### Row Command Function Signature

The row command function receives up to 4 parameters:

```sql
create function my_excel_row_processor(
    _index int,           -- $1: Row index (1-based, non-empty rows only)
    _row text[],          -- $2: Row values as text array (or json if row_is_json = true)
    _prev_result any,     -- $3: Result of previous row command
    _meta json            -- $4: Row metadata JSON (includes sheet name)
)
returns any               -- Return value passed to next row as $3
```

### Row Command Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | `int` | Row index (1-based, only counts non-empty rows) |
| `$2` | `text[]` or `json` | Row values as text array, or JSON if `row_is_json = true` |
| `$3` | `any` | Result of previous row command execution (see below) |
| `$4` | `json` | Row metadata JSON object (includes sheet info) |

**Row chaining with `$3`:** The return value from each row command is passed to the next row as `$3`. For the first row, `$3` is `NULL`. If the row command returns `void` (no return value), `$3` will be `NULL` for the next row. This enables accumulating values across rows (e.g., counting rows, summing values). Note: When processing multiple sheets (`all_sheets = true`), `$3` resets to `NULL` at the start of each sheet.

### Row Metadata Structure (`$4`)

The metadata JSON passed to each row command contains:

```json
{
  "type": "excel",
  "fileName": "data.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "size": 5678,
  "sheet": "Sheet1",
  "rowIndex": 5,
  "claims": {                    // Only if RowCommandUserClaimsKey is set
    "user_id": "1",
    "user_name": "alice"
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Handler type (`"excel"`) |
| `fileName` | string | Original uploaded file name |
| `contentType` | string | MIME type of the file |
| `size` | int | File size in bytes |
| `sheet` | string | Current sheet name being processed |
| `rowIndex` | int | Excel row index (1-based, includes empty rows) |
| `claims` | object | User claims (when `RowCommandUserClaimsKey` is configured) |

> **Note:** Excel row metadata includes `rowIndex` (actual Excel row number) and `sheet` name. The `$1` parameter is a sequential counter for non-empty rows only, while `rowIndex` reflects the actual Excel row position.

### Upload Function Metadata (`_meta` parameter)

The main upload function receives metadata as a JSON **array**. When `all_sheets = true`, there's one element per sheet:

```json
[
  {
    "type": "excel",
    "fileName": "data.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 5678,
    "sheet": "Sheet1",
    "success": true,
    "rows": 99,
    "result": 100
  },
  {
    "type": "excel",
    "fileName": "data.xlsx",
    "contentType": "...",
    "size": 5678,
    "sheet": "Sheet2",
    "success": true,
    "rows": 50,
    "result": 50
  }
]
```

| Property | Type | Description |
|----------|------|-------------|
| `sheet` | string | Sheet name |
| `rows` | int | Number of non-empty rows processed |
| `result` | any | Final return value from the last row command for this sheet |

### Basic Example

```sql
-- Table for uploads
create table excel_uploads (
    id int primary key generated always as identity,
    file_name text not null,
    sheet_name text,
    row_index int not null,
    row_data text[] not null
);

-- Row command to process each Excel row
create function excel_upload_row(
    _index int,
    _row text[],
    _prev_result int,
    _meta json
)
returns int
language plpgsql
as $$
begin
    insert into excel_uploads (file_name, sheet_name, row_index, row_data)
    values (
        _meta->>'fileName',
        _meta->>'sheet',
        _index,
        coalesce(_row, '{}')
    );

    return coalesce(_prev_result, 0) + 1;
end;
$$;

-- HTTP POST endpoint
create function excel_upload(_meta json = null)
returns json
language sql
begin atomic;
    select _meta;
end;

comment on function excel_upload(json) is '
@upload for excel
@param _meta is upload metadata
@all_sheets = true
@row_command = select excel_upload_row($1,$2,$3,$4)
';
```

### Row Data as JSON

When `row_is_json = true`, row data is passed as JSON with Excel cell references as keys:

```sql
comment on function excel_upload(json) is '
@upload for excel
@param _meta is upload metadata
@row_is_json = true
@row_command = select excel_upload_row($1,$2,$3,$4)
';
```

The `$2` parameter becomes JSON like:
```json
{"A1": "Name", "B1": "Value", "C1": 123}
```

### Excel Annotation Options

All shared options (except `buffer_size`, `check_text`, `check_image`, `test_buffer_size`, `non_printable_threshold`) plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `row_command` | string | - | PostgreSQL command to process each row (required) |
| `sheet_name` | string | `null` | Specific sheet name to process (first sheet if null) |
| `all_sheets` | bool | `false` | Process all sheets in the workbook |
| `time_format` | string | `HH:mm:ss` | Format for time values |
| `date_format` | string | `yyyy-MM-dd` | Format for date values |
| `datetime_format` | string | `yyyy-MM-dd HH:mm:ss` | Format for datetime values |
| `row_is_json` | bool | `false` | Pass row data as JSON instead of text array |

Handler-specific prefixed aliases are also available (e.g., `excel_row_command`, `excel_all_sheets`).

## Error Handling and Rollback

All upload handlers support automatic rollback on error. If the handler function raises an exception, any uploaded data is rolled back:

```sql
create function lo_upload_raise_exception(
    _oid bigint,
    _meta json = null
)
returns json
language plpgsql
as
$$
begin
    raise exception 'failed upload';
    return _meta;
end;
$$;

comment on function lo_upload_raise_exception(bigint, json) is '
@upload for large_object
@param _meta is upload metadata
@oid = {_oid}
';
```

If an exception is raised:
- **Large Object**: The large object is deleted
- **File System**: The uploaded file is deleted
- **CSV/Excel**: All database changes are rolled back

## Multiple File Uploads

Upload endpoints support multiple files in a single request. The metadata will be returned as a JSON array with one entry per file.

## Behavior

- Enables multipart/form-data file uploads
- Handlers process the uploaded file (storage, validation, parsing)
- Metadata parameter receives file information (name, size, type)
- All uploads are transactional - errors trigger rollback
- See [Upload Options](../config/uploads) for configuration

## Custom Parameters

Upload handlers accept [custom parameters](./custom-parameters) using the `@key = value` syntax to control file processing behavior per-endpoint.

### Shared Parameters

| Parameter | Description |
|-----------|-------------|
| `stop_after_first_success` | When `true`, stops processing after the first successful upload handler. |
| `included_mime_types` | Comma-separated list of MIME type patterns to include for upload processing. |
| `excluded_mime_types` | Comma-separated list of MIME type patterns to exclude from upload processing. |
| `check_format` | When `true`, validates the file format before processing. If validation fails, `fallback_handler` is used. |
| `fallback_handler` | Handler name to delegate to if format validation fails (e.g., `csv`, `large_object`). Available on all upload handlers. |

### Large Object Upload Handler

| Parameter | Description |
|-----------|-------------|
| `buffer_size`, `large_object_buffer_size` | Size of the buffer used for reading/writing large object data. |
| `check_text`, `large_object_check_text` | When `true`, checks if the uploaded content is text format. |
| `check_image`, `large_object_check_image` | When `true`, checks if the uploaded content is an image format. |
| `test_buffer_size`, `large_object_test_buffer_size` | Size of the buffer used for testing file content type. |
| `non_printable_threshold`, `large_object_non_printable_threshold` | Threshold for determining if content contains non-printable characters. |
| `oid`, `large_object_oid` | PostgreSQL large object OID to use for storage. |
| `large_object_included_mime_types` | MIME type patterns to include for large object upload processing. |
| `large_object_excluded_mime_types` | MIME type patterns to exclude from large object upload processing. |

#### Example

```sql
comment on function upload_to_large_object(text, json) is '
HTTP POST
@upload for large_object
@param _meta is upload metadata
@check_image = true';
```

### File System Upload Handler

| Parameter | Description |
|-----------|-------------|
| `buffer_size`, `file_system_buffer_size` | Size of the buffer used for reading/writing file system data. |
| `check_text`, `file_system_check_text` | When `true`, checks if the uploaded content is text format. |
| `check_image`, `file_system_check_image` | When `true`, checks if the uploaded content is an image format. |
| `test_buffer_size`, `file_system_test_buffer_size` | Size of the buffer used for testing file content type. |
| `non_printable_threshold`, `file_system_non_printable_threshold` | Threshold for determining if content contains non-printable characters. |
| `path`, `file_system_path` | File system path where uploaded files will be stored. Supports [dynamic placeholders](./custom-parameters#dynamic-parameter-values). |
| `file`, `file_system_file` | Specific file name to use for the uploaded content. Supports [dynamic placeholders](./custom-parameters#dynamic-parameter-values). |
| `unique_name`, `file_system_unique_name` | When `true`, generates unique file names to avoid conflicts. |
| `create_path`, `file_system_create_path` | When `true`, creates the directory path if it doesn't exist. |
| `file_system_included_mime_types` | MIME type patterns to include for file system upload processing. |
| `file_system_excluded_mime_types` | MIME type patterns to exclude from file system upload processing. |

#### Example

```sql
comment on function upload_to_file_system(text, json) is '
HTTP POST
@upload for file_system
@param _meta is upload metadata
@check_image = true
@path = ./public/uploads
@unique_name = true
@create_path = true';
```

### CSV Upload Handler

| Parameter | Description |
|-----------|-------------|
| `test_buffer_size`, `csv_test_buffer_size` | Size of the buffer used for testing CSV content type. |
| `non_printable_threshold`, `csv_non_printable_threshold` | Threshold for determining if content contains non-printable characters. |
| `check_format`, `csv_check_format` | When `true`, validates the CSV format before processing. |
| `delimiters`, `csv_delimiters` | Characters used as field delimiters in CSV files (e.g., comma, semicolon). |
| `has_fields_enclosed_in_quotes`, `csv_has_fields_enclosed_in_quotes` | When `true`, expects CSV fields to be enclosed in quotes. |
| `set_white_space_to_null`, `csv_set_white_space_to_null` | When `true`, converts whitespace-only fields to NULL values. |
| `row_command`, `csv_row_command` | SQL command to execute for each CSV row during processing. |
| `csv_included_mime_types` | MIME type patterns to include for CSV upload processing. |
| `csv_excluded_mime_types` | MIME type patterns to exclude from CSV upload processing. |

#### Example

```sql
comment on function csv_upload(json) is '
HTTP POST
@upload for csv
@param _meta is upload metadata
@delimiters = ,;
@row_command = select csv_upload_row($1,$2,$3,$4)';
```

### Excel Upload Handler

| Parameter | Description |
|-----------|-------------|
| `sheet_name`, `excel_sheet_name` | Name of the specific Excel worksheet to process. |
| `all_sheets`, `excel_all_sheets` | When `true`, processes all worksheets in the Excel file. |
| `time_format`, `excel_time_format` | Format string for parsing time values from Excel cells. |
| `date_format`, `excel_date_format` | Format string for parsing date values from Excel cells. |
| `datetime_format`, `excel_datetime_format` | Format string for parsing datetime values from Excel cells. |
| `row_is_json`, `excel_row_is_json` | When `true`, treats each Excel row as JSON data. |
| `row_command`, `excel_row_command` | SQL command to execute for each Excel row during processing. |
| `excel_included_mime_types` | MIME type patterns to include for Excel upload processing. |
| `excel_excluded_mime_types` | MIME type patterns to exclude from Excel upload processing. |

#### Example

```sql
comment on function excel_upload(json) is '
HTTP POST
@upload for excel
@param _meta is upload metadata
@all_sheets = true
@row_command = select excel_upload_row($1,$2,$3,$4)';
```

## Related

- [Upload configuration](../config/uploads) - Configure upload handlers and settings
- [Custom Parameters](./custom-parameters) - Custom parameter syntax and dynamic values
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Blog Posts

- [CSV and Excel Ingestion Made Easy](/blog/csv-excel-ingestion-postgresql-npgsqlrest) - Complete tutorial on CSV/Excel row processing
- [Secure Image Uploads](/blog/secure-image-uploads-postgresql-typescript) - Image uploads with Large Objects and File System handlers

## Related Annotations

- [AUTHORIZE](./authorize) - Protect upload endpoint
- [TSCLIENT](./tsclient) - Control TypeScript client generation for upload endpoints

## See Also

- [Upload Options](/config/uploads) - Configure upload handlers and settings

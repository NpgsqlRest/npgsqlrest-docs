---
outline: [2, 3]
title: "Upload Options"
titleTemplate: NpgsqlRest
description: "Configure file uploads in NpgsqlRest. Handle uploads via PostgreSQL Large Objects, file system storage, CSV import, and Excel file processing."
head:
  - - meta
    - name: keywords
      content: npgsqlrest upload, postgresql file upload, large objects api, csv import postgresql, excel upload api, file upload rest api
  - - meta
    - property: og:title
      content: "NpgsqlRest Upload Options"
  - - meta
    - property: og:description
      content: "Configure file uploads via PostgreSQL Large Objects, file system, CSV, and Excel handlers."
  - - meta
    - property: og:type
      content: article
---

# Upload Options

File upload configuration for handling uploads via PostgreSQL Large Objects, file system, CSV, and Excel handlers.

## Overview

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "Enabled": false,
      "LogUploadEvent": true,
      "LogUploadParameters": false,
      "DefaultUploadHandler": "large_object",
      "UseDefaultUploadMetadataParameter": false,
      "DefaultUploadMetadataParameterName": "_upload_metadata",
      "UseDefaultUploadMetadataContextKey": false,
      "DefaultUploadMetadataContextKey": "request.upload_metadata",
      "UploadHandlers": {
        "StopAfterFirstSuccess": false,
        "IncludedMimeTypePatterns": null,
        "ExcludedMimeTypePatterns": null,
        "BufferSize": 8192,
        "TextTestBufferSize": 4096,
        "TextNonPrintableThreshold": 5,
        "AllowedImageTypes": "jpeg, png, gif, bmp, tiff, webp",
        "LargeObjectEnabled": true,
        "LargeObjectKey": "large_object",
        "LargeObjectCheckText": false,
        "LargeObjectCheckImage": false,
        "FileSystemEnabled": true,
        "FileSystemKey": "file_system",
        "FileSystemPath": "/tmp/uploads",
        "FileSystemUseUniqueFileName": true,
        "FileSystemCreatePathIfNotExists": true,
        "FileSystemCheckText": false,
        "FileSystemCheckImage": false,
        "CsvUploadEnabled": true,
        "CsvUploadKey": "csv",
        "CsvUploadCheckFileStatus": true,
        "CsvUploadDelimiterChars": ",",
        "CsvUploadHasFieldsEnclosedInQuotes": true,
        "CsvUploadSetWhiteSpaceToNull": true,
        "CsvUploadRowCommand": "call process_csv_row($1,$2,$3,$4)",
        "ExcelUploadEnabled": true,
        "ExcelKey": "excel",
        "ExcelSheetName": null,
        "ExcelAllSheets": false,
        "ExcelTimeFormat": "HH:mm:ss",
        "ExcelDateFormat": "yyyy-MM-dd",
        "ExcelDateTimeFormat": "yyyy-MM-dd HH:mm:ss",
        "ExcelRowDataAsJson": false,
        "ExcelUploadRowCommand": "call process_excel_row($1,$2,$3,$4)"
      }
    }
  }
}
```

## General Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable file upload handling. |
| `LogUploadEvent` | bool | `true` | Log upload events. |
| `LogUploadParameters` | bool | `false` | Log upload parameters (file names, sizes, etc.). |
| `DefaultUploadHandler` | string | `"large_object"` | Default handler when not specified. |
| `UseDefaultUploadMetadataParameter` | bool | `false` | Pass upload metadata via parameter. |
| `DefaultUploadMetadataParameterName` | string | `"_upload_metadata"` | Parameter name for upload metadata JSON. |
| `UseDefaultUploadMetadataContextKey` | bool | `false` | Pass upload metadata via context key. |
| `DefaultUploadMetadataContextKey` | string | `"request.upload_metadata"` | Context key for upload metadata JSON. |

## Upload Handlers Common Settings

Settings that apply to all upload handlers.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `StopAfterFirstSuccess` | bool | `false` | Stop processing after first successful handler. |
| `IncludedMimeTypePatterns` | string | `null` | CSV of MIME type patterns to include. `null` to allow all. |
| `ExcludedMimeTypePatterns` | string | `null` | CSV of MIME type patterns to exclude. `null` to exclude none. |
| `BufferSize` | int | `8192` | Buffer size in bytes for file_system and large_object handlers (8 KB). |
| `TextTestBufferSize` | int | `4096` | Buffer sample size for testing textual content (4 KB). |
| `TextNonPrintableThreshold` | int | `5` | Maximum non-printable characters allowed in text buffer. |
| `AllowedImageTypes` | string | `"jpeg, png, gif, bmp, tiff, webp"` | Comma-separated list of allowed image types. |

## Large Object Handler

Uploads files using PostgreSQL Large Objects API.

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "UploadHandlers": {
        "LargeObjectEnabled": true,
        "LargeObjectKey": "large_object",
        "LargeObjectCheckText": false,
        "LargeObjectCheckImage": false
      }
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `LargeObjectEnabled` | bool | `true` | Enable Large Object upload handler. |
| `LargeObjectKey` | string | `"large_object"` | Handler key name. |
| `LargeObjectCheckText` | bool | `false` | Validate uploaded content is text. |
| `LargeObjectCheckImage` | bool | `false` | Validate uploaded content is an allowed image type. |

## File System Handler

Uploads files to the server file system.

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "UploadHandlers": {
        "FileSystemEnabled": true,
        "FileSystemKey": "file_system",
        "FileSystemPath": "/tmp/uploads",
        "FileSystemUseUniqueFileName": true,
        "FileSystemCreatePathIfNotExists": true,
        "FileSystemCheckText": false,
        "FileSystemCheckImage": false
      }
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `FileSystemEnabled` | bool | `true` | Enable file system upload handler. |
| `FileSystemKey` | string | `"file_system"` | Handler key name. |
| `FileSystemPath` | string | `"/tmp/uploads"` | Directory path for uploaded files. |
| `FileSystemUseUniqueFileName` | bool | `true` | Generate unique file names to prevent overwrites. |
| `FileSystemCreatePathIfNotExists` | bool | `true` | Create upload directory if it doesn't exist. |
| `FileSystemCheckText` | bool | `false` | Validate uploaded content is text. |
| `FileSystemCheckImage` | bool | `false` | Validate uploaded content is an allowed image type. |

## CSV Upload Handler

Uploads CSV files and processes rows via a PostgreSQL command.

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "UploadHandlers": {
        "CsvUploadEnabled": true,
        "CsvUploadKey": "csv",
        "CsvUploadCheckFileStatus": true,
        "CsvUploadDelimiterChars": ",",
        "CsvUploadHasFieldsEnclosedInQuotes": true,
        "CsvUploadSetWhiteSpaceToNull": true,
        "CsvUploadRowCommand": "call process_csv_row($1,$2,$3,$4)"
      }
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `CsvUploadEnabled` | bool | `true` | Enable CSV upload handler. |
| `CsvUploadKey` | string | `"csv"` | Handler key name. |
| `CsvUploadCheckFileStatus` | bool | `true` | Check file status before processing. |
| `CsvUploadDelimiterChars` | string | `","` | CSV field delimiter character(s). |
| `CsvUploadHasFieldsEnclosedInQuotes` | bool | `true` | Fields may be enclosed in quotes. |
| `CsvUploadSetWhiteSpaceToNull` | bool | `true` | Convert whitespace-only values to NULL. |
| `CsvUploadRowCommand` | string | `"call process_csv_row($1,$2,$3,$4)"` | PostgreSQL command to process each row. |

### CSV Row Command Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | int | Row index (1-based). |
| `$2` | text[] | Parsed values as text array. |
| `$3` | text | Result of previous row command. |
| `$4` | json | Upload metadata JSON. |

## Excel Upload Handler

Uploads Excel files and processes rows via a PostgreSQL command.

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "UploadHandlers": {
        "ExcelUploadEnabled": true,
        "ExcelKey": "excel",
        "ExcelSheetName": null,
        "ExcelAllSheets": false,
        "ExcelTimeFormat": "HH:mm:ss",
        "ExcelDateFormat": "yyyy-MM-dd",
        "ExcelDateTimeFormat": "yyyy-MM-dd HH:mm:ss",
        "ExcelRowDataAsJson": false,
        "ExcelUploadRowCommand": "call process_excel_row($1,$2,$3,$4)"
      }
    }
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ExcelUploadEnabled` | bool | `true` | Enable Excel upload handler. |
| `ExcelKey` | string | `"excel"` | Handler key name. |
| `ExcelSheetName` | string | `null` | Sheet name to process. `null` for first available sheet. |
| `ExcelAllSheets` | bool | `false` | Process all sheets in the workbook. |
| `ExcelTimeFormat` | string | `"HH:mm:ss"` | Format for time values. |
| `ExcelDateFormat` | string | `"yyyy-MM-dd"` | Format for date values. |
| `ExcelDateTimeFormat` | string | `"yyyy-MM-dd HH:mm:ss"` | Format for datetime values. |
| `ExcelRowDataAsJson` | bool | `false` | Pass row data as JSON instead of text array. |
| `ExcelUploadRowCommand` | string | `"call process_excel_row($1,$2,$3,$4)"` | PostgreSQL command to process each row. |

### Excel Row Command Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$1` | int | Row index (1-based). |
| `$2` | text[] or json | Parsed values as text array (or JSON if `ExcelRowDataAsJson` is true). |
| `$3` | text | Result of previous row command. |
| `$4` | json | Upload metadata JSON. |

## Complete Example

Production configuration with file system and CSV uploads:

```json
{
  "NpgsqlRest": {
    "UploadOptions": {
      "Enabled": true,
      "LogUploadEvent": true,
      "LogUploadParameters": false,
      "DefaultUploadHandler": "file_system",
      "UseDefaultUploadMetadataParameter": true,
      "DefaultUploadMetadataParameterName": "_upload_metadata",
      "UploadHandlers": {
        "StopAfterFirstSuccess": true,
        "IncludedMimeTypePatterns": "image/*,text/*,application/pdf",
        "ExcludedMimeTypePatterns": null,
        "BufferSize": 16384,
        "LargeObjectEnabled": false,
        "FileSystemEnabled": true,
        "FileSystemPath": "/var/uploads",
        "FileSystemUseUniqueFileName": true,
        "FileSystemCreatePathIfNotExists": true,
        "FileSystemCheckImage": true,
        "CsvUploadEnabled": true,
        "CsvUploadDelimiterChars": ",",
        "CsvUploadRowCommand": "call import_csv_row($1,$2,$3,$4)",
        "ExcelUploadEnabled": true,
        "ExcelUploadRowCommand": "call import_excel_row($1,$2,$3,$4)"
      }
    }
  }
}
```

## Related

- [upload annotation](../annotations/upload) - Enable file upload on endpoints
- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Blog Posts

- [CSV and Excel Ingestion Made Easy](/blog/csv-excel-ingestion-postgresql-npgsqlrest) - Complete tutorial on CSV/Excel row processing
- [Secure Image Uploads](/blog/secure-image-uploads-postgresql-typescript) - Image uploads with Large Objects and File System handlers

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings
- [Static Files](./static-files) - Configure static file serving

## See Also

- [UPLOAD](/annotations/upload) - Enable file upload on endpoints

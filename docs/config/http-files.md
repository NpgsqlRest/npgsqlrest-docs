---
outline: [2, 3]
title: "HTTP File Options"
titleTemplate: NpgsqlRest
description: "Generate .http files for testing NpgsqlRest APIs. Compatible with VS Code REST Client and Visual Studio HTTP file support for easy API testing."
head:
  - - meta
    - name: keywords
      content: npgsqlrest http files, rest client vscode, http file generator, api testing files, visual studio http, rest api testing
  - - meta
    - property: og:title
      content: "NpgsqlRest HTTP File Options"
  - - meta
    - property: og:description
      content: "Generate .http files for testing APIs with VS Code REST Client and Visual Studio."
  - - meta
    - property: og:type
      content: article
---

# HTTP File Options

Configuration for generating HTTP files for NpgsqlRest endpoints, compatible with REST Client extensions and Visual Studio HTTP file support.

## Overview

```json
{
  "NpgsqlRest": {
    "HttpFileOptions": {
      "Enabled": false,
      "Option": "File",
      "Name": null,
      "NamePattern": "{0}_{1}",
      "CommentHeader": "Simple",
      "CommentHeaderIncludeComments": true,
      "FileMode": "Schema",
      "FileOverwrite": true
    }
  }
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Enabled` | bool | `false` | Enable HTTP file generation. |
| `Option` | string | `"File"` | Generation mode: `"File"`, `"Endpoint"`, or `"Both"`. |
| `Name` | string | `null` | Base file name. Uses database name if `null`, or `"npgsqlrest"` if no connection string. |
| `NamePattern` | string | `"{0}_{1}"` | File name pattern. `{0}` = database name, `{1}` = schema suffix (when `FileMode` is `"Schema"`). |
| `CommentHeader` | string | `"Simple"` | Comment header style: `"None"`, `"Simple"`, or `"Full"`. |
| `CommentHeaderIncludeComments` | bool | `true` | Include routine comments in header (when `CommentHeader` is `"Simple"` or `"Full"`). |
| `FileMode` | string | `"Schema"` | File organization: `"Database"` or `"Schema"`. |
| `FileOverwrite` | bool | `true` | Overwrite existing files. |

## Generation Options

| Option | Description |
|--------|-------------|
| `File` | Generate HTTP files in the file system. |
| `Endpoint` | Generate endpoint(s) serving HTTP file content. |
| `Both` | Generate both file system files and endpoints. |

## Comment Header Styles

| Style | Description |
|-------|-------------|
| `None` | No comment header above requests. |
| `Simple` | Add routine name, parameters, and return values (default). |
| `Full` | Add entire routine code as comment header. |

## File Mode

| Mode | Description |
|------|-------------|
| `Database` | Create one HTTP file for the entire database. |
| `Schema` | Create one HTTP file per schema. |

## HTTP Files

HTTP files (`.http`) are supported by:

- [REST Client for VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [Visual Studio HTTP Files](https://learn.microsoft.com/en-us/aspnet/core/test/http-files)

These files allow you to send HTTP requests directly from your editor for API testing and documentation.

## Example Configuration

Generate HTTP files per schema with full routine documentation:

```json
{
  "NpgsqlRest": {
    "HttpFileOptions": {
      "Enabled": true,
      "Option": "File",
      "Name": "myapi",
      "NamePattern": "{0}_{1}",
      "CommentHeader": "Full",
      "CommentHeaderIncludeComments": true,
      "FileMode": "Schema",
      "FileOverwrite": true
    }
  }
}
```

Generate a single HTTP file for the entire database:

```json
{
  "NpgsqlRest": {
    "HttpFileOptions": {
      "Enabled": true,
      "Option": "File",
      "FileMode": "Database",
      "CommentHeader": "Simple"
    }
  }
}
```

Serve HTTP files as endpoints:

```json
{
  "NpgsqlRest": {
    "HttpFileOptions": {
      "Enabled": true,
      "Option": "Endpoint"
    }
  }
}
```

## Related

- [Comment Annotations Guide](../guide/annotations) - How annotations work
- [Configuration Guide](../guide/configuration) - How configuration works

## Next Steps

- [NpgsqlRest Options](./npgsqlrest) - Configure general NpgsqlRest settings
- [Code Generation](./codegen) - Configure code generation options

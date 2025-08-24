# Example 7: CSV and Excel Uploads

This example demonstrates how to upload and process CSV and Excel files using NpgsqlRest upload handlers.

## Features

- Cookie-based authentication (alice/bob)
- CSV file upload with row-by-row processing
- Excel file upload with sheet and row processing
- Stores row data as PostgreSQL text arrays

## How It Works

### CSV Upload Handler

The CSV handler parses each row and calls a row command for processing:
- `row_command = select example_7.csv_upload_row($1,$2,$3,$4)`
- `$1` = row index (int)
- `$2` = row data (text[])
- `$3` = previous result (for chaining)
- `$4` = metadata (json) containing file info and user_id

### Excel Upload Handler

The Excel handler works similarly but includes sheet information:
- `row_command = select example_7.excel_upload_row($1,$2,$3,$4)`
- Metadata includes `sheet` property with the sheet name
- `all_sheets = true` processes all sheets in the workbook

## Files

- `sql_7/V1__example_7_schema.sql` - Schema, tables, and types
- `sql_7/R__example_7_login.sql` - Login function
- `sql_7/R__example_7_logout.sql` - Logout function
- `sql_7/R__example_7_csv_upload.sql` - CSV upload endpoint
- `sql_7/R__example_7_csv_upload_row.sql` - CSV row processor
- `sql_7/R__example_7_excel_upload.sql` - Excel upload endpoint
- `sql_7/R__example_7_excel_upload_row.sql` - Excel row processor
- `config.json` - NpgsqlRest configuration
- `public/index.html` - Web UI

## Usage

1. Run migrations to create schema
2. Start NpgsqlRest with this config
3. Login as alice (password123) or bob (password456)
4. Upload CSV or Excel files

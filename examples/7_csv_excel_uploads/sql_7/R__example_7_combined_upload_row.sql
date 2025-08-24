-- Row processor for Excel/CSV combined uploads
-- Called for each row in each Excel sheet or CSV file
-- Parameters: $1 = row index, $2 = row data (text[]), $3 = previous result, $4 = metadata (json)
-- Metadata contains: type, fileName, contentType, size, sheet, rowIndex
create or replace function example_7.combined_upload_row(
    _index int,
    _row text[],
    _prev_result int,
    _meta json
)
returns int
language plpgsql
as $$
begin
    -- If this is the first row (index 1), we can truncate the table to start fresh for this upload
    if _index = 1 then
        truncate example_7.combined_uploads;
    end if;

    insert into example_7.combined_uploads (user_id, file_name, sheet_name, row_index, row_data)
    values (
        (_meta->'claims'->>'user_id')::int,
        _meta->>'fileName',
        _meta->>'sheet',
        _index,
        coalesce(_row, '{}')
    );

    return coalesce(_prev_result, 0) + 1;
end;
$$;

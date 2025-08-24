create or replace procedure example_8.send_message(
    _message_text text,
    _user_id text = null,
    _user_name text = null
)
language plpgsql
as $$
declare
    _message_id int;
    _created_at timestamptz;
begin
    insert into example_8.messages (user_id, username, message_text)
    values (_user_id::int, _user_name, _message_text)
    returning message_id, created_at into _message_id, _created_at;

    -- Send message as SSE event to all connected authorized clients
    raise info '%', json_build_object(
        'message_id', _message_id,
        'user_id', _user_id::int,
        'username', _user_name,
        'message_text', _message_text,
        'created_at', _created_at
    );
end;
$$;

comment on procedure example_8.send_message(text, text, text) is '
HTTP POST
@authorize
@sse
@sse_scope authorize';

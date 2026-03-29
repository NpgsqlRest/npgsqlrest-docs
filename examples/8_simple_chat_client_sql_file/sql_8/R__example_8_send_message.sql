-- send_message must stay as a PL/pgSQL procedure because it uses
-- raise info to push SSE events to connected clients.
create or replace procedure example_8.send_message(
    _message_text text,
    _user_id text default null,
    _user_name text default null
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

    raise info '%', json_build_object(
        'message_id', _message_id,
        'user_id', _user_id::int,
        'username', _user_name,
        'message_text', _message_text,
        'created_at', _created_at
    );
end;
$$;

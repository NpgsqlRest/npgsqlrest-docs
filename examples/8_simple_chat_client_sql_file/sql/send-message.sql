/*
HTTP POST
@authorize
@sse
@sse_scope authorize
@user_parameters
@param $1 messageText text
@param $2 _user_id text = null
@param $3 _user_name text = null
@void
*/
begin;

select set_config('example_8.message_text', $1, true);
select set_config('example_8.current_user_id', $2, true); 
select set_config('example_8.current_user_name', $3, true);

do
$$
declare
    _message_text text = current_setting('example_8.message_text')::text;
    _user_id int = current_setting('example_8.current_user_id')::int;
    _user_name text = current_setting('example_8.current_user_name')::text;
    
    _message_id int;
    _created_at timestamptz;
begin
    insert into example_8.messages (user_id, username, message_text)
    values (_user_id, _user_name, _message_text)
    returning message_id, created_at into _message_id, _created_at;

    raise info '%', json_build_object(
        'message_id', _message_id,
        'user_id', _user_id,
        'username', _user_name,
        'message_text', _message_text,
        'created_at', _created_at
    );
end;
$$;

end;
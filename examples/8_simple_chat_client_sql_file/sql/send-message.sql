/*
HTTP POST
@authorize
@sse
@sse_scope authorize
@user_parameters
@param $1 message_text
@param $2 _user_id
@param $3 _user_name
*/
call example_8.send_message($1, $2, $3);

-- HTTP GET
-- @authorize
select
    current_setting('request.user_id', true) as user_id,
    current_setting('request.user_name', true) as user_name,
    current_setting('request.user_roles', true) as roles,
    current_setting('request.user_email', true) as email;

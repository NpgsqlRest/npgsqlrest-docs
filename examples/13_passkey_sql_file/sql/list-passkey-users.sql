-- HTTP GET
-- @allow_anonymous
select
    u.user_id,
    u.username,
    u.password as pass,
    u.email,
    p.credential_id is not null as passkey_enabled
from example_13.users u
left join example_13.passkeys p using(user_id);

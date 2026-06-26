/*
HTTP POST
@allow_anonymous
@single
*/
-- POST /api/login — verify credentials with pgcrypto crypt(). Returns the matching user as a single
-- object, or an empty result when the email/password do not match. In test mode this runs on the test's
-- own connection/transaction, so it sees a user the test inserted (and has not committed).
--
-- Named placeholders (:email, :password) instead of $1/$2: the API parameter names come from the
-- placeholders themselves and the types are inferred by PostgreSQL, so no @param annotations are needed.
select u.id, u.email, u.full_name as name, r.name as role
from example_20.users u
join example_20.roles r on r.id = u.role_id
where u.email = :email
  and u.password_hash = crypt(:password, u.password_hash);

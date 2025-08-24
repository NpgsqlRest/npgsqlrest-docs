-- Enable only the CRUD endpoints we need
-- disabled = turn off all endpoints by default
-- enabled = turn on only: select (GET), insert_returning (PUT/returning), update (POST), delete (DELETE)
comment on table example_11.contacts is '
HTTP
@disabled
@enabled select, insert_returning, update, delete
@authorize
';
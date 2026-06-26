-- Reusable fixture, spliced into tests with `\ir fixtures/extra_users.sql` — it runs on the including
-- test's connection, INSIDE its transaction, so it rolls back with the test. Explicit high ids keep the
-- identity sequence untouched. (Not matched by the *.test.sql pattern, so it is never run on its own.)
insert into example_21.users (id, name, email) values
    (101, 'Fixture One', 'fixture1@example.com'),
    (102, 'Fixture Two', 'fixture2@example.com');

-- Example 19: SQL test runner demo
--
-- Schema + seed only. The ENDPOINTS are the .sql files in ./sql (served by SqlFileSource); their tests
-- are the co-located *.test.sql files (run by `npgsqlrest --test`, skipped by SqlFileSource via SkipPattern).
-- Repeatable migration (R__): drops and recreates, safe to re-run.

drop schema if exists example_19 cascade;
create schema example_19;

create table example_19.users (
    id    int generated always as identity primary key,
    name  text not null,
    email text not null unique,
    role  text not null default 'user'
);

-- A tiny domain function — used by create_user.sql and tested standalone in sql/normalize_email.test.sql
-- (to show that plain function/SQL tests work exactly like before, alongside the HTTP endpoint tests).
create function example_19.normalize_email(addr text) returns text
    language sql immutable
    return lower(trim(addr));

insert into example_19.users (name, email, role) values
    ('Ada Lovelace', 'ada@example.com',  'admin'),
    ('Alan Turing',  'alan@example.com', 'user');

-- versioned migration: V1__example_3_schema.sql

-- recreate entire schema example_3
drop schema if exists example_3 cascade;
create schema example_3;

-- enable pgcrypto extension for password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_3;


-- create users table
create table example_3.users (
    user_id int primary key generated always as identity,
    username text not null,
    email text not null,
    password_hash text[] not null
);

-- create public schema for functions exposed as API endpoints to demonstrate The Principle of Least Privilege (PoLP) in security
drop schema if exists example_3_public cascade;
create schema example_3_public;

drop role if exists ${APP_USER};

-- create application role with limited privileges
-- note: username and password are in super secret file called .env
create role ${APP_USER} with
    login
    nosuperuser
    nocreatedb
    nocreaterole
    noinherit
    noreplication
    connection limit -1
    password '${APP_PASSWORD}';

-- grant usage on schema example_3_public to application role
-- this is the onlu gran that this role needs to function properly
grant usage on schema example_3_public to ${APP_USER};

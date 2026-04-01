-- Versioned migration: V1__example_8_schema.sql
-- Example 8: simple chat client schema setup

-- Recreate schema
drop schema if exists example_8 cascade;
create schema example_8;

-- Enable pgcrypto extension for simple password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_8;

-- Users table (simple auth with bob and alice)
create table example_8.users (
    user_id int primary key generated always as identity,
    username text not null unique,
    password_hash text not null
);

-- Insert test users
-- Password for alice: password123, for bob: password456
insert into example_8.users (username, password_hash) values
    ('alice', example_8.crypt('password123', example_8.gen_salt('bf'))),
    ('bob', example_8.crypt('password456', example_8.gen_salt('bf')));

-- Messages table for chat messages
create table example_8.messages (
    message_id int primary key generated always as identity,
    user_id int not null references example_8.users(user_id) on delete cascade,
    username text not null,
    message_text text not null,
    created_at timestamptz not null default now()
);
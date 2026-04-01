-- Versioned migration: V1__example_6_schema.sql
-- Example 6: Image Uploads - Schema and tables

-- Recreate schema
drop schema if exists example_6 cascade;
create schema example_6;

-- Enable pgcrypto extension for simple password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_6;

-- Users table (simple auth with bob and alice)
create table example_6.users (
    user_id int primary key generated always as identity,
    username text not null unique,
    password_hash text not null
);

-- Insert test users
-- Password for alice: password123, for bob: password456
insert into example_6.users (username, password_hash) values
    ('alice', example_6.crypt('password123', example_6.gen_salt('bf'))),
    ('bob', example_6.crypt('password456', example_6.gen_salt('bf')));

-- Response type for upload functions (enforces static types in generated TypeScript)
-- Returns per-file status so client knows which files succeeded/failed
create type example_6.upload_response as (
    success boolean,
    status text,
    file_name text,
    content_type text,
    file_size bigint,
    oid bigint,
    file_path text
);

-- Unified uploads table (supports all handler types)
create table example_6.uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    content_type text not null,
    file_size bigint not null,
    oid bigint,
    file_path text,
    uploaded_at timestamptz not null default now()
);

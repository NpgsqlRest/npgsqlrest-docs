drop schema if exists example_13 cascade;
create schema example_13;

drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_13;

-- Simple users table for demo (bob and alice)
create table example_13.users (
    user_id serial primary key,
    username text not null,
    email text,
    -- plain text for demo only. 
    -- passwords can be null for passkey-only users in this example
    password text null,
    created_at timestamptz default now()
);
create unique index on example_13.users(username);

insert into example_13.users (username, email, password) values
    ('bob', 'bob@example.com', 'bob123'),
    ('alice', 'alice@example.com', 'alice123');

-- Passkeys table
create table example_13.passkeys (
    credential_id bytea primary key,
    user_id int not null references example_13.users(user_id) on delete cascade,
    user_handle bytea unique not null,
    public_key bytea not null,
    public_key_algorithm int not null,
    sign_count bigint not null default 0,
    transports text[],
    backup_eligible boolean default false,
    device_name text,
    created_at timestamptz default now(),
    last_used_at timestamptz
);
create index on example_13.passkeys(user_id);

-- Challenge storage (for replay protection)
create table example_13.passkey_challenges (
    id bigint not null generated always as identity primary key,
    challenge bytea not null,
    user_id int,  -- null for authentication, set for registration
    operation text not null check (operation in ('registration', 'authentication')),
    expires_at timestamptz not null,
    created_at timestamptz default now()
);
create index on example_13.passkey_challenges(expires_at);

-- Authentication audit log (optional, for analytics)
create table example_13.auth_audit_log (
    id bigint not null generated always as identity primary key,
    user_id int not null,
    event_type text not null,
    analytics_data json,
    ip_address text,
    created_at timestamptz default now()
);
create index on example_13.auth_audit_log(user_id);
create index on example_13.auth_audit_log(created_at);

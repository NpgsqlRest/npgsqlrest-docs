-- versioned migration: V1__example_4_schema.sql

-- recreate entire schema example_4
drop schema if exists example_4 cascade;
create schema example_4;

-- create users table
create table example_4.users (
    user_id int primary key generated always as identity,
    username text not null,
    email text not null,
    roles text[] not null,
    password_hash text null, -- password can be null when using external authentication providers
    last_login timestamp with time zone null,
    last_login_provider text null
);

/*
Note: use the following commands to generate password hashes for the sample users:

❯ bun npgsqlrest --hash password123
RfpqB6nKcoT2lL/w4ItB24mvxg8R9rC906C0/+7DAI62PQayBWjqihU96XPzmzYu

❯ bun npgsqlrest --hash password456
X+e/OsZkNL4j/9a7WIy/2bkQDk4rHHwlFwLXx7MNpclUUPdtQlI1JiDqyqMnJbgu
*/

insert into example_4.users (username, email, roles, password_hash) values
-- alice is normal user, bob is admin
('alice', 'alice@example.com', array['user'], 'RfpqB6nKcoT2lL/w4ItB24mvxg8R9rC906C0/+7DAI62PQayBWjqihU96XPzmzYu'), -- password: password123
('bob', 'bob@example.com', array['user', 'admin'], 'X+e/OsZkNL4j/9a7WIy/2bkQDk4rHHwlFwLXx7MNpclUUPdtQlI1JiDqyqMnJbgu'), -- password: password456
('carol', 'carol@example.com', array[]::text[], '3XBVW23Yn6j8b8sRQMoerOvSYlFosXuRrY0G/nkquuquDNdSnbn8bacvCQlCQKhs'); -- password: passwordd789 


/*
Note: to test external login, we add a user without password_hash and use email as username that matches external provider login email (e.g., Google login).

insert into example_4.users (username, email, roles, password_hash) values
('vedran@example.com', 'vedran@example.com', array['user', 'admin'], null); -- password: (external login only),
*/

-- Data Protection keys table for storing encryption keys
-- Used by ASP.NET Core Data Protection system for encrypting cookies and bearer tokens
create table example_4.auth_data_protection_keys (
    name text not null primary key,
    data text not null
);

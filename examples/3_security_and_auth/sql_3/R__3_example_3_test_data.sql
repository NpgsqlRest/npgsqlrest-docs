insert into example_3.users (username, email, password_hash) values
('alice', 'alice@example.com', example_3.hash_password('password123')),
('bob', 'bob@example.com', example_3.hash_password('password456'));
-- Standalone test (no co-located endpoint) for the example_19.normalize_email() function.
-- Shows that classic function/SQL tests work unchanged — a `do $$ ... assert ... end $$;` block
-- raises on failure (SQLSTATE P0004), which the runner reports as a failed test. No HTTP, no rollback
-- needed (read-only). Discovered because it matches *.test.sql; SqlFileSource skips it.


select example_19.normalize_email('  Foo@BAR.com ') = 'foo@bar.com', 'normalize_email should trim and lowercase';
select example_19.normalize_email('already@ok.com') = 'already@ok.com','an already-normalized address is unchanged';

-- do $$
-- begin
--     assert example_19.normalize_email('  Foo@BAR.com ') = 'foo@bar.com',
--         'normalize_email should trim and lowercase';

--     assert example_19.normalize_email('already@ok.com') = 'already@ok.com',
--         'an already-normalized address is unchanged';
-- end;
-- $$;

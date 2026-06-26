-- Shared isolation profile: any test that starts with `\ir shared/isolated_database.sql` gets its OWN
-- database (clone 1, example_21_iso_{rnd5_1}) cloned from the migrated template, runs on it (including its
-- in-process endpoint calls), and drops it afterwards. Includes behave as if pasted, so these header
-- annotations count in the including file's header. (Not matched by *.test.sql, so never run on its own.)

-- @setup CreateIsolatedDb1
-- @teardown DropIsolatedDb1
-- @connection Isolated1
-- @tag isolation, slow

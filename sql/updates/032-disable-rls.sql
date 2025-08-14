-- Disable RLS on all tables in public schema (idempotent)
-- Use this to immediately stop all RLS checks across the app
-- WARNING: This disables row-level authorization. Use only to unblock, then re-enable with proper policies.

DO $$
DECLARE
	r RECORD;
BEGIN
	FOR r IN (
		SELECT schemaname, tablename
		FROM pg_tables
		WHERE schemaname = 'public'
	) LOOP
		EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
		EXECUTE format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);
		RAISE NOTICE 'RLS disabled on %.%', r.schemaname, r.tablename;
	END LOOP;
END$$;

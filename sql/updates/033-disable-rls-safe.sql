-- Disable RLS on all public tables (deadlock-safe, idempotent)
-- Run multiple times until all tables are processed without "Skipped ... due to lock" notices
-- WARNING: Disables row-level security globally. Use to unblock, then re-enable with proper policies later.

DO $$
DECLARE
  r RECORD;
BEGIN
  PERFORM set_config('lock_timeout','1500ms', true); -- avoid deadlocks by timing out quickly

  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY schemaname, tablename
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
      EXECUTE format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);
      RAISE NOTICE 'RLS disabled on %.%', r.schemaname, r.tablename;
    EXCEPTION
      WHEN lock_not_available OR deadlock_detected THEN
        -- another session holds locks; skip and retry later
        RAISE NOTICE 'Skipped %.% due to lock; retry later', r.schemaname, r.tablename;
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipped %.% due to insufficient privilege', r.schemaname, r.tablename;
      WHEN undefined_object THEN
        RAISE NOTICE 'Skipped %.% (object missing)', r.schemaname, r.tablename;
      WHEN OTHERS THEN
        RAISE NOTICE 'Skipped %.% due to error: %', r.schemaname, r.tablename, SQLERRM;
    END;
  END LOOP;
END$$;

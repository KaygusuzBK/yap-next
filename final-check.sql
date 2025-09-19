-- SON KONTROL - Tüm RLS durumunu kontrol et
-- Tüm adımlar tamamlandıktan sonra bu scripti çalıştır

-- 1. RLS durumu
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. View durumu
SELECT 
    schemaname, 
    viewname, 
    security_invoker
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;

-- 3. Hata kontrolü - RLS devre dışı olan tablolar
SELECT 
    schemaname, 
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
ORDER BY tablename;

-- 4. Hata kontrolü - Politika var ama RLS devre dışı
SELECT 
    p.schemaname, 
    p.tablename, 
    p.policyname
FROM pg_policies p
JOIN pg_tables t ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE p.schemaname = 'public' 
    AND t.rowsecurity = false
ORDER BY p.tablename, p.policyname;

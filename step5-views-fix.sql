-- ADIM 5: VIEW'LARI DÜZELT (Güvenli)
-- Dördüncü adım başarılı olduktan sonra bu scripti çalıştır

-- Security Definer View'ları Security Invoker'a çevir
-- Bu, view'ların kullanıcının yetkilerini kullanmasını sağlar

ALTER VIEW public.task_dependency_status SET (security_invoker = true);
ALTER VIEW public.task_status_transitions SET (security_invoker = true);
ALTER VIEW public.task_status_durations SET (security_invoker = true);
ALTER VIEW public.task_status_timeline SET (security_invoker = true);
ALTER VIEW public.project_task_stats SET (security_invoker = true);
ALTER VIEW public.task_status_intervals SET (security_invoker = true);

-- SONUÇLARI KONTROL ET
SELECT 
    schemaname, 
    viewname, 
    security_invoker
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname IN (
        'task_dependency_status',
        'task_status_transitions', 
        'task_status_durations',
        'task_status_timeline',
        'project_task_stats',
        'task_status_intervals'
    )
ORDER BY viewname;

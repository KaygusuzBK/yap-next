-- Sprint sistemi RLS politikaları
-- Bu dosya 035-sprint-system.sql çalıştırıldıktan sonra çalıştırılmalıdır

-- NOT: View'lar için RLS politikası oluşturulamaz
-- View'lar otomatik olarak altındaki tabloların RLS politikalarını kullanır
-- sprint_stats view'ı sprints tablosunun RLS politikalarını kullanır
-- sprint_members_view view'ı sprint_members tablosunun RLS politikalarını kullanır

-- Bu dosya artık gerekli değil çünkü view'lar için RLS politikası oluşturulamaz
-- Ana sprint sistemi (035-sprint-system.sql) yeterli

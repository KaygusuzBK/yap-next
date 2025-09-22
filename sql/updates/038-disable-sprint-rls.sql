-- Sprint RLS'yi geçici olarak devre dışı bırak
-- Bu dosya test amaçlıdır, production'da RLS aktif olmalıdır

-- Sprint tablosu için RLS'yi devre dışı bırak
ALTER TABLE sprints DISABLE ROW LEVEL SECURITY;

-- Sprint üyeleri tablosu için RLS'yi devre dışı bırak  
ALTER TABLE sprint_members DISABLE ROW LEVEL SECURITY;

-- Sprint aktiviteleri tablosu için RLS'yi devre dışı bırak
ALTER TABLE sprint_activities DISABLE ROW LEVEL SECURITY;

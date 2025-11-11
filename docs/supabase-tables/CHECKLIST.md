# Supabase Tablo Kurulum Kontrol Listesi

Bu dosya, Supabase veritabanında oluşturulması gereken tüm tabloların kontrol listesini içerir.

## ✅ Kontrol Listesi

### Temel Tablolar (6)
- [ ] `profiles` - Kullanıcı profilleri
- [ ] `teams` - Takımlar
- [ ] `team_members` - Takım üyeleri
- [ ] `team_invitations` - Takım davetiyeleri
- [ ] `projects` - Projeler
- [ ] `project_members` - Proje üyeleri

### Görev Yönetimi Tabloları (9)
- [ ] `project_tasks` - Ana görev tablosu
- [ ] `task_assignments` - Görev atamaları
- [ ] `task_comments` - Görev yorumları
- [ ] `task_time_logs` - Zaman takibi
- [ ] `task_tags` - Görev etiketleri
- [ ] `task_tag_relations` - Görev-etiket ilişkileri
- [ ] `task_files` - Görev dosyaları
- [ ] `task_activities` - Aktivite geçmişi
- [ ] `task_dependencies` - Görev bağımlılıkları

### Proje İlişkili Tablolar (5)
- [ ] `project_files` - Proje dosyaları
- [ ] `project_comments` - Proje yorumları
- [ ] `project_activities` - Proje aktiviteleri
- [ ] `project_task_statuses` - Proje özel görev durumları
- [ ] `project_integrations` - Proje entegrasyonları

### Bildirim ve Tercihler (2)
- [ ] `notifications` - In-app bildirimler
- [ ] `user_preferences` - Kullanıcı tercihleri

### Entegrasyon Tabloları (1)
- [ ] `user_integrations` - Kullanıcı entegrasyonları

## 📊 Toplam: 23 Tablo

## 🚀 Hızlı Kurulum

Tüm tabloları oluşturmak için:

```bash
# 1. DATABASE_URL'i ayarlayın
export DATABASE_URL="postgres://postgres:password@host:5432/postgres"

# 2. SQL dosyalarını uygulayın
./sql/apply.sh
```

Veya manuel olarak:

```bash
# Temel kurulum
psql "$DATABASE_URL" -f sql/00-initial-setup.sql
psql "$DATABASE_URL" -f sql/00_functions.sql
psql "$DATABASE_URL" -f sql/01_tables.sql
psql "$DATABASE_URL" -f sql/02_rls.sql

# Takım yönetimi
psql "$DATABASE_URL" -f sql/04_teams.sql

# Proje yönetimi
psql "$DATABASE_URL" -f sql/05_projects.sql

# Görev yönetimi
psql "$DATABASE_URL" -f sql/06_tasks_complete.sql
psql "$DATABASE_URL" -f sql/10_task_management_complete.sql

# Güncellemeler
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
psql "$DATABASE_URL" -f sql/updates/034-task-dependencies.sql
psql "$DATABASE_URL" -f sql/updates/041-fix-project-task-statuses-group.sql
```

## 🔍 Tablo Kontrolü

Supabase Dashboard'dan tabloları kontrol etmek için:

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. Şu sorguyu çalıştırın:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;
```

## 📝 Notlar

- Tüm tablolar `public` şemasında oluşturulur
- Row Level Security (RLS) tüm tablolarda etkinleştirilmiştir
- Foreign key'ler `on delete cascade` veya `on delete set null` ile yapılandırılmıştır
- Tüm tablolarda `created_at` ve `updated_at` timestamp alanları bulunur
- UUID primary key'ler `gen_random_uuid()` ile otomatik oluşturulur

## 🔗 Detaylı Dokümantasyon

Her tablo için detaylı bilgi:
- [Temel Tablolar](./01-basic-tables.md)
- [Görev Yönetimi Tabloları](./02-task-tables.md)
- [Proje İlişkili Tablolar](./03-project-tables.md)
- [Entegrasyon Tabloları](./04-integration-tables.md)
- [Bildirim ve Tercih Tabloları](./05-notification-tables.md)


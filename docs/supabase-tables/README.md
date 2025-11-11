# Supabase Tablo Dokümantasyonu

Bu klasör, YAP Proje Yönetimi Sistemi için Supabase veritabanında oluşturulması gereken tüm tabloların detaylı dokümantasyonunu içerir.

## 📋 İçindekiler

1. [Temel Tablolar](./01-basic-tables.md) - Kullanıcı profilleri, takımlar ve projeler
2. [Görev Yönetimi Tabloları](./02-task-tables.md) - Görevler, atamalar, yorumlar ve aktiviteler
3. [Proje İlişkili Tablolar](./03-project-tables.md) - Proje dosyaları, yorumlar ve durumlar
4. [Entegrasyon Tabloları](./04-integration-tables.md) - GitHub, Google Calendar, Slack entegrasyonları
5. [Bildirim ve Tercih Tabloları](./05-notification-tables.md) - Bildirimler ve kullanıcı tercihleri

## 🗂️ Tablo Listesi

### Temel Tablolar (6)
- `profiles` - Kullanıcı profilleri
- `teams` - Takımlar
- `team_members` - Takım üyeleri
- `team_invitations` - Takım davetiyeleri
- `projects` - Projeler
- `project_members` - Proje üyeleri

### Görev Yönetimi Tabloları (9)
- `project_tasks` - Ana görev tablosu
- `task_assignments` - Görev atamaları (çoklu atama)
- `task_comments` - Görev yorumları
- `task_time_logs` - Zaman takibi
- `task_tags` - Görev etiketleri
- `task_tag_relations` - Görev-etiket ilişkileri
- `task_files` - Görev dosyaları
- `task_activities` - Aktivite geçmişi (audit log)
- `task_dependencies` - Görev bağımlılıkları

### Proje İlişkili Tablolar (5)
- `project_files` - Proje dosyaları
- `project_comments` - Proje yorumları
- `project_activities` - Proje aktiviteleri
- `project_task_statuses` - Proje özel görev durumları
- `project_integrations` - Proje entegrasyonları

### Bildirim ve Tercihler (2)
- `notifications` - In-app bildirimler
- `user_preferences` - Kullanıcı tercihleri

### Entegrasyon Tabloları (1)
- `user_integrations` - Kullanıcı entegrasyonları

## 📊 Toplam: 23 Tablo

## 🚀 SQL Uygulama Sırası

Tabloları oluşturmak için SQL dosyalarını şu sırayla uygulayın:

```bash
# 1. Temel kurulum
psql "$DATABASE_URL" -f sql/00-initial-setup.sql
psql "$DATABASE_URL" -f sql/00_functions.sql
psql "$DATABASE_URL" -f sql/01_tables.sql
psql "$DATABASE_URL" -f sql/02_rls.sql

# 2. Takım yönetimi
psql "$DATABASE_URL" -f sql/04_teams.sql

# 3. Proje yönetimi
psql "$DATABASE_URL" -f sql/05_projects.sql

# 4. Görev yönetimi
psql "$DATABASE_URL" -f sql/06_tasks_complete.sql
psql "$DATABASE_URL" -f sql/10_task_management_complete.sql

# 5. Güncellemeler (opsiyonel ama önerilir)
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
psql "$DATABASE_URL" -f sql/updates/034-task-dependencies.sql
psql "$DATABASE_URL" -f sql/updates/041-fix-project-task-statuses-group.sql
```

Veya tüm dosyaları tek seferde uygulamak için:

```bash
./sql/apply.sh
```

## 📝 Notlar

- Tüm tablolar `public` şemasında oluşturulur
- Row Level Security (RLS) tüm tablolarda etkinleştirilmiştir
- Foreign key'ler `on delete cascade` veya `on delete set null` ile yapılandırılmıştır
- Tüm tablolarda `created_at` ve `updated_at` timestamp alanları bulunur
- UUID primary key'ler `gen_random_uuid()` ile otomatik oluşturulur

## 🔗 İlişki Diyagramı

```
auth.users
    ↓ (1:1)
profiles
    ↓ (1:N)
teams ← team_members → auth.users
    ↓ (1:N)
projects ← project_members → auth.users
    ↓ (1:N)
project_tasks ← task_assignments → auth.users
    ↓ (1:N)
task_comments, task_time_logs, task_files, task_activities
    ↓ (1:N)
task_dependencies
    ↓ (1:N)
notifications (user_id → auth.users)
```

## 📚 Ek Kaynaklar

- [SQL README](../sql/README.md) - SQL dosyaları hakkında detaylı bilgi
- [SETUP.md](../../SETUP.md) - Kurulum kılavuzu
- [Supabase Dashboard](https://supabase.com/dashboard) - Veritabanı yönetimi


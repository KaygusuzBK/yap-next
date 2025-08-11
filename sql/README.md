# SQL Uygulama Sırası

Bu dosya, veritabanı şemasını doğru sırayla uygulamak için gereken adımları içerir.

## 🚀 Uygulama Sırası

### 1. Temel Kurulum
```bash
# 1. İlk kurulum (sadece bir kez)
psql "$DATABASE_URL" -f sql/00-initial-setup.sql

# 2. Temel fonksiyonlar
psql "$DATABASE_URL" -f sql/00_functions.sql

# 3. Temel tablolar
psql "$DATABASE_URL" -f sql/01_tables.sql

# 4. RLS politikaları
psql "$DATABASE_URL" -f sql/02_rls.sql
```

### 2. Takım Yönetimi
```bash
# 5. Takım yönetimi
psql "$DATABASE_URL" -f sql/04_teams.sql
```

### 3. Proje Yönetimi
```bash
# 6. Proje yönetimi
psql "$DATABASE_URL" -f sql/05_projects.sql
```

### 4. Görev Yönetimi
```bash
# 7. Görev yönetimi (ana yapılar)
psql "$DATABASE_URL" -f sql/06_tasks_complete.sql

# 8. Görev yönetimi (güncellemeler ve trigger'lar)
psql "$DATABASE_URL" -f sql/10_task_management_complete.sql
```

### 5. Konsolide Güncellemeler ve Bildirimler (Opsiyonel ama önerilir)
```bash
# RLS/policy/trigger konsolidasyonu
psql "$DATABASE_URL" -f sql/updates/017-consolidated-rls-and-triggers.sql

# Proje → Slack kanal eşlemesi
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql

# In‑app bildirimler (notifications tablosu + RLS)
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
```

### 5. RLS Düzeltmeleri (Gerekirse)
```bash
# 9. RLS düzeltmeleri (sadece hata alırsanız)
./sql/fix-rls.sh
```

## 📋 Detaylı Açıklama

### Temel Kurulum (1-4)
- Veritabanı bağlantısı ve temel ayarlar
- Kullanıcı profilleri ve temel tablolar
- Row Level Security (RLS) politikaları

### Takım Yönetimi (5)
- Takım oluşturma ve yönetimi
- Takım üyeleri ve rolleri
- Takım-proje ilişkileri

### Proje Yönetimi (6)
- Proje oluşturma ve yönetimi
- Proje üyeleri ve izinler
- Proje durumları ve kategoriler

### Görev Yönetimi (7-8)
- Görev oluşturma ve düzenleme
- Görev atama sistemi
- Görev yorumları ve dosyaları
- Görev aktivite geçmişi
- Otomatik trigger'lar ve fonksiyonlar

## ⚠️ Önemli Notlar

1. **Sıra Önemli**: Dosyaları belirtilen sırayla uygulayın
2. **Hata Durumu**: Eğer RLS hatası alırsanız, `fix-rls.sh` scriptini çalıştırın
3. **Yedekleme**: Önemli verileriniz varsa, uygulamadan önce yedek alın
4. **Test**: Her adımdan sonra uygulamanızı test edin
5. **ENV**: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_*`, `SUPABASE_AUTOMATION_USER_ID` değerlerini doğru ortamda ayarlayın

## 🔧 Hızlı Uygulama

Tüm SQL dosyalarını tek seferde uygulamak için:

```bash
# Tüm dosyaları sırayla uygula
./sql/apply.sh
```

## 🐛 Sorun Giderme

### RLS Hatası
```bash
# Sonsuz döngü hatası alırsanız
./sql/fix-rls.sh
```

### Bağlantı Hatası
```bash
# DATABASE_URL'i kontrol edin
echo $DATABASE_URL
```

### Yetki Hatası
```bash
# Supabase Dashboard'dan SQL Editor'ü kullanın
# Veya doğru yetkilere sahip kullanıcı ile bağlanın
```

### Slack Bildirimleri Gitmiyor
- Bot token/scopes doğru mu (`chat:write`, `channels:read`, `groups:read`, `channels:join`)?
- Bot kanalda mı? Gerekirse davet edin
- Request URL'ler doğru endpointleri gösteriyor mu (`/api/slack/...`)?

## 📊 Veritabanı Yapısı

### 🗂️ Veritabanı Şeması

![Supabase Schema](./supabase-schema.svg)

*Veritabanı şeması görseli - Tablolar ve ilişkiler*

### 📋 Tablo Listesi

Uygulama sonrası şu tablolar oluşacak:

#### 🔐 Temel Tablolar
- `profiles` - Kullanıcı profilleri
- `teams` - Takımlar
- `team_members` - Takım üyeleri
- `projects` - Projeler
- `project_members` - Proje üyeleri

#### ✅ Görev Tabloları
- `project_tasks` - Ana görev tablosu
- `task_assignments` - Görev atamaları
- `task_comments` - Görev yorumları
- `task_time_logs` - Zaman takibi
- `task_files` - Görev dosyaları
- `task_activities` - Aktivite geçmişi
- `task_tags` - Görev etiketleri
- `task_tag_relations` - Görev-etiket ilişkileri
 - `notifications` - In‑app bildirimler (kullanıcıya özel RLS)

### 🔗 İlişki Yapısı

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
notifications (user_id → auth.users)
```

## 🎯 Sonraki Adımlar

SQL uygulaması tamamlandıktan sonra:

1. Frontend uygulamasını başlatın: `npm run dev`
2. Görev oluşturma ve atama özelliklerini test edin
3. Sidebar'da görev listesini kontrol edin
4. Görev detay sayfasını test edin
5. Yorumlarda `@mention` ile bildirim üretimini doğrulayın

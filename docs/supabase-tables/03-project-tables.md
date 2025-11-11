# Proje İlişkili Tablolar

Bu dokümantasyon, YAP Proje Yönetimi Sistemi'nin proje ile ilgili tablolarını içerir: proje dosyaları, yorumlar, aktiviteler, görev durumları ve entegrasyonlar.

## 1. project_files

Proje dosyaları tablosu. Projelere eklenen dosyaları yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `file_name` | `text` | ❌ | - | Dosya adı |
| `file_path` | `text` | ❌ | - | Dosya yolu (Supabase Storage) |
| `file_size` | `bigint` | ❌ | - | Dosya boyutu (bytes) |
| `file_type` | `text` | ❌ | - | Dosya tipi (MIME type) |
| `uploaded_by` | `uuid` | ❌ | - | Yükleyen kullanıcı, `auth.users(id)` referansı |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_project_files_project_id`
- Foreign key: `project_id` → `projects(id)` (on delete cascade)
- Foreign key: `uploaded_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **project_files_policy**: Proje sahibi veya üyesi dosyaları yönetebilir

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`
- `auth.users` (N:1) - `uploaded_by` → `auth.users.id`

---

## 2. project_comments

Proje yorumları tablosu. Projelerde yorum yapılmasını sağlar.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `task_id` | `uuid` | ✅ | `NULL` | İlgili görev ID'si (opsiyonel), `project_tasks(id)` referansı |
| `content` | `text` | ❌ | - | Yorum içeriği |
| `created_by` | `uuid` | ❌ | - | Yorum yapan kullanıcı, `auth.users(id)` referansı |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_project_comments_project_id`
- Index: `idx_project_comments_task_id`
- Foreign key: `project_id` → `projects(id)` (on delete cascade)
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `created_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **project_comments_policy**: Proje sahibi veya üyesi yorumları yönetebilir

### Trigger'lar

- `handle_project_comments_updated_at`: `updated_at` alanını otomatik günceller

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`
- `project_tasks` (N:1) - `task_id` → `project_tasks.id` (opsiyonel)
- `auth.users` (N:1) - `created_by` → `auth.users.id`

---

## 3. project_activities

Proje aktiviteleri tablosu. Projelerdeki tüm değişiklikleri audit log olarak kaydeder.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `user_id` | `uuid` | ❌ | - | İşlemi yapan kullanıcı, `auth.users(id)` referansı |
| `action` | `text` | ❌ | - | Aksiyon tipi: `'project_created'`, `'project_updated'`, `'member_added'`, vb. |
| `details` | `jsonb` | ✅ | `'{}'` | Aksiyon detayları (JSON) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Foreign key: `project_id` → `projects(id)` (on delete cascade)
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`

---

## 4. project_task_statuses

Proje özel görev durumları tablosu. Her proje için özelleştirilebilir görev durumlarını yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `key` | `text` | ❌ | - | Durum anahtarı (unique per project): `'todo'`, `'in_progress'`, `'review'`, `'completed'` |
| `label` | `text` | ❌ | - | Durum etiketi: `'Yapılacak'`, `'Devam Ediyor'`, vb. |
| `group` | `text` | ❌ | - | Durum grubu: `'todo'`, `'in_progress'`, `'review'`, `'completed'` |
| `position` | `integer` | ❌ | `0` | Sıralama pozisyonu |
| `is_default` | `boolean` | ❌ | `false` | Varsayılan durum mu? (her grup için bir tane) |
| `color` | `text` | ❌ | `'#64748b'` | Durum rengi (hex) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(project_id, key)` - Her projede aynı key sadece bir kez kullanılabilir
- Unique: `(project_id, group)` WHERE `is_default = true` - Her grup için sadece bir varsayılan durum
- Foreign key: `project_id` → `projects(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### Trigger'lar

- `update_project_task_statuses_updated_at`: `updated_at` alanını otomatik günceller

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`

### Varsayılan Durumlar

Yeni proje oluşturulduğunda otomatik olarak şu durumlar eklenir:

| Key | Label | Group | Position | Color |
|-----|-------|-------|----------|-------|
| `todo` | Yapılacak | `todo` | 0 | `#6b7280` |
| `in_progress` | Devam Ediyor | `in_progress` | 1 | `#3b82f6` |
| `review` | İncelemede | `review` | 2 | `#f59e0b` |
| `completed` | Tamamlandı | `completed` | 3 | `#10b981` |

---

## 5. project_integrations

Proje entegrasyonları tablosu. Projelerin GitHub, Google Calendar ve Slack gibi servislerle entegrasyonlarını yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `provider` | `text` | ❌ | - | Entegrasyon sağlayıcısı: `'github'`, `'google_calendar'`, `'slack'` |
| `repo_full_name` | `text` | ✅ | `NULL` | GitHub için: `owner/repo` formatında repo adı |
| `repo_id` | `bigint` | ✅ | `NULL` | GitHub repo ID'si |
| `default_branch` | `text` | ✅ | `NULL` | GitHub varsayılan branch'i |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(project_id, provider)` - Her projede aynı provider sadece bir kez kullanılabilir
- Foreign key: `project_id` → `projects(id)` (on delete cascade)

### RLS Politikaları

RLS politikaları route seviyesinde kontrol edilir (admin client ile).

### Trigger'lar

- `trg_project_integrations_set_updated`: `updated_at` alanını otomatik günceller

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`

### Entegrasyon Tipleri

#### GitHub Entegrasyonu
- `repo_full_name`: Repository adı (örn: `owner/repo`)
- `repo_id`: GitHub repository ID'si
- `default_branch`: Varsayılan branch (örn: `main`, `master`)

#### Google Calendar Entegrasyonu
- Takvim ID'si ve erişim token'ları `user_integrations` tablosunda saklanır
- Bu tablo sadece proje-özel ayarları tutar

#### Slack Entegrasyonu
- Proje Slack kanalı `projects.slack_channel_id` alanında saklanır
- Bu tablo Slack webhook ve bot ayarlarını tutabilir

---

## 📊 Tablo İlişkileri Özeti

```
projects (1:N) → project_files
projects (1:N) → project_comments
projects (1:N) → project_activities
projects (1:N) → project_task_statuses
projects (1:N) → project_integrations
```

## 🔐 Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) etkinleştirilmiştir
- Proje erişimi proje üyeliğine bağlıdır
- Foreign key'ler `on delete cascade` ile yapılandırılmıştır
- Tüm timestamp alanları otomatik olarak güncellenir
- Proje entegrasyonları route seviyesinde yetkilendirme gerektirir

## 🎯 Kullanım Senaryoları

### Proje Dosyaları
- Proje dokümantasyonları
- Tasarım dosyaları
- Ek kaynaklar

### Proje Yorumları
- Proje genel yorumları
- Görevlere bağlı yorumlar (opsiyonel `task_id` ile)

### Proje Aktiviteleri
- Proje oluşturulma
- Üye ekleme/çıkarma
- Proje güncellemeleri

### Proje Görev Durumları
- Proje özel durum isimleri
- Durum renkleri ve sıralaması
- Varsayılan durumlar

### Proje Entegrasyonları
- GitHub repository bağlantısı
- Slack kanal bildirimleri
- Google Calendar senkronizasyonu


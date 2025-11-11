# Temel Tablolar

Bu dokümantasyon, YAP Proje Yönetimi Sistemi'nin temel tablolarını içerir: kullanıcı profilleri, takımlar ve projeler.

## 1. profiles

Kullanıcı profilleri tablosu. Her `auth.users` kaydı için otomatik olarak bir profil oluşturulur.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | - | Primary key, `auth.users(id)` referansı |
| `name` | `text` | ❌ | - | Kullanıcı adı |
| `avatar_url` | `text` | ✅ | `NULL` | Avatar URL'i |
| `full_name` | `text` | ✅ | `NULL` | Tam ad (opsiyonel) |
| `email` | `text` | ✅ | `NULL` | Email adresi (unique) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `email`
- Index: `idx_profiles_email`
- Index: `idx_profiles_full_name`

### RLS Politikaları

- **read own profile**: Kullanıcılar sadece kendi profillerini okuyabilir
- **update own profile**: Kullanıcılar sadece kendi profillerini güncelleyebilir

### Trigger'lar

- `set_timestamp_profiles`: `updated_at` alanını otomatik günceller
- `on_auth_user_created`: Yeni kullanıcı oluşturulduğunda otomatik profil oluşturur

### İlişkiler

- `auth.users` (1:1) - `id` → `auth.users.id`
- `teams` (1:N) - `id` → `teams.owner_id`
- `projects` (1:N) - `id` → `projects.owner_id`

---

## 2. teams

Takımlar tablosu. Kullanıcılar takımlar oluşturabilir ve üyeleri yönetebilir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `name` | `text` | ❌ | - | Takım adı |
| `owner_id` | `uuid` | ❌ | - | Takım sahibi, `auth.users(id)` referansı |
| `primary_project_id` | `uuid` | ✅ | `NULL` | Ana proje ID'si, `projects(id)` referansı |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Foreign key: `owner_id` → `auth.users(id)`
- Foreign key: `primary_project_id` → `projects(id)`

### RLS Politikaları

- **read own teams**: Kullanıcılar sadece sahip oldukları takımları okuyabilir
- **insert own teams**: Kullanıcılar kendi takımlarını oluşturabilir
- **update own teams**: Kullanıcılar sadece sahip oldukları takımları güncelleyebilir
- **delete own teams**: Kullanıcılar sadece sahip oldukları takımları silebilir

### Trigger'lar

- `set_timestamp_teams`: `updated_at` alanını otomatik günceller
- `on_team_update_check_primary_project`: `primary_project_id`'nin takıma ait olduğunu kontrol eder
- `handle_new_team`: Takım oluşturulduğunda sahibini otomatik üye yapar

### İlişkiler

- `auth.users` (N:1) - `owner_id` → `auth.users.id`
- `projects` (1:N) - `id` → `projects.team_id`
- `team_members` (1:N) - `id` → `team_members.team_id`
- `team_invitations` (1:N) - `id` → `team_invitations.team_id`

---

## 3. team_members

Takım üyeleri tablosu. Bir takımın üyelerini ve rollerini yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `team_id` | `uuid` | ❌ | - | Takım ID'si, `teams(id)` referansı |
| `user_id` | `uuid` | ❌ | - | Kullanıcı ID'si, `auth.users(id)` referansı |
| `role` | `text` | ❌ | `'member'` | Rol: `'owner'`, `'admin'`, `'member'` |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(team_id, user_id)` - Bir kullanıcı bir takımda sadece bir kez bulunabilir
- Foreign key: `team_id` → `teams(id)`
- Foreign key: `user_id` → `auth.users(id)`

### RLS Politikaları

- **read team members**: Kullanıcılar kendi üye oldukları takımların üyelerini okuyabilir
- **insert team members**: Takım sahipleri üye ekleyebilir
- **update team members**: Kullanıcılar kendi üyeliklerini güncelleyebilir
- **delete team members**: Kullanıcılar kendi üyeliklerini silebilir

### Trigger'lar

- `set_timestamp_team_members`: `updated_at` alanını otomatik günceller

### İlişkiler

- `teams` (N:1) - `team_id` → `teams.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`

---

## 4. team_invitations

Takım davetiyeleri tablosu. Kullanıcıları takımlara davet etmek için kullanılır.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `team_id` | `uuid` | ❌ | - | Takım ID'si, `teams(id)` referansı |
| `email` | `text` | ❌ | - | Davet edilen kullanıcının email'i |
| `role` | `text` | ❌ | `'member'` | Davet edilen kullanıcının rolü |
| `token` | `text` | ❌ | - | Benzersiz davet token'ı (unique) |
| `accepted_at` | `timestamptz` | ✅ | `NULL` | Davet kabul edilme tarihi |
| `expires_at` | `timestamptz` | ❌ | `now() + 7 days` | Davet sona erme tarihi |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `token`
- Foreign key: `team_id` → `teams(id)`

### RLS Politikaları

- **read team invitations**: Tüm kullanıcılar davetiyeleri okuyabilir
- **insert team invitations**: Takım sahipleri davetiye oluşturabilir
- **update team invitations**: Davetiyeler güncellenebilir
- **delete team invitations**: Davetiyeler silinebilir

### Trigger'lar

- `set_timestamp_team_invitations`: `updated_at` alanını otomatik günceller

### İlişkiler

- `teams` (N:1) - `team_id` → `teams.id`

---

## 5. projects

Projeler tablosu. Kullanıcılar ve takımlar projeler oluşturabilir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `owner_id` | `uuid` | ❌ | - | Proje sahibi, `auth.users(id)` referansı |
| `title` | `text` | ❌ | - | Proje başlığı |
| `description` | `text` | ✅ | `NULL` | Proje açıklaması |
| `team_id` | `uuid` | ✅ | `NULL` | Takım ID'si, `teams(id)` referansı |
| `status` | `text` | ❌ | `'active'` | Durum: `'active'`, `'archived'`, `'completed'` |
| `slack_channel_id` | `text` | ✅ | `NULL` | Slack kanal ID'si (örn: C0123456789) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_projects_owner_id`
- Index: `idx_projects_team_id`
- Index: `idx_projects_status`
- Foreign key: `owner_id` → `auth.users(id)`
- Foreign key: `team_id` → `teams(id)`

### RLS Politikaları

- **read own projects**: Kullanıcılar sahip oldukları, üye oldukları veya takım üyesi oldukları projeleri okuyabilir
- **create projects**: Kullanıcılar kendi projelerini oluşturabilir
- **update own projects**: Kullanıcılar sahip oldukları veya admin oldukları projeleri güncelleyebilir
- **delete own projects**: Kullanıcılar sadece sahip oldukları projeleri silebilir

### Trigger'lar

- `handle_projects_updated_at`: `updated_at` alanını otomatik günceller
- `handle_new_project_trigger`: Proje oluşturulduğunda sahibini otomatik üye yapar

### İlişkiler

- `auth.users` (N:1) - `owner_id` → `auth.users.id`
- `teams` (N:1) - `team_id` → `teams.id`
- `project_members` (1:N) - `id` → `project_members.project_id`
- `project_tasks` (1:N) - `id` → `project_tasks.project_id`
- `project_files` (1:N) - `id` → `project_files.project_id`
- `project_comments` (1:N) - `id` → `project_comments.project_id`
- `project_integrations` (1:N) - `id` → `project_integrations.project_id`
- `project_task_statuses` (1:N) - `id` → `project_task_statuses.project_id`

### Yardımcı Fonksiyonlar

- `get_user_projects(user_uuid)`: Kullanıcının projelerini getirir
- `get_project_stats(project_uuid)`: Proje istatistiklerini getirir

---

## 6. project_members

Proje üyeleri tablosu. Bir projenin üyelerini ve rollerini yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `user_id` | `uuid` | ❌ | - | Kullanıcı ID'si, `auth.users(id)` referansı |
| `role` | `text` | ❌ | `'member'` | Rol: `'owner'`, `'admin'`, `'member'`, `'viewer'` |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(project_id, user_id)` - Bir kullanıcı bir projede sadece bir kez bulunabilir
- Index: `idx_project_members_project_id`
- Index: `idx_project_members_user_id`
- Foreign key: `project_id` → `projects(id)`
- Foreign key: `user_id` → `auth.users(id)`

### RLS Politikaları

**Not**: RLS geçici olarak devre dışı bırakılmıştır (sonsuz döngü sorunu nedeniyle). Proje sahipleri üyeleri yönetebilir.

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`

---

## 📊 Tablo İlişkileri Özeti

```
auth.users (1:1) → profiles
auth.users (1:N) → teams (owner_id)
teams (1:N) → team_members
teams (1:N) → team_invitations
teams (1:N) → projects (team_id)
auth.users (1:N) → projects (owner_id)
projects (1:N) → project_members
projects (1:N) → project_tasks
```

## 🔐 Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) etkinleştirilmiştir
- Kullanıcılar sadece kendi verilerine ve erişim yetkisi olan takım/proje verilerine erişebilir
- Foreign key'ler `on delete cascade` veya `on delete set null` ile yapılandırılmıştır
- Tüm timestamp alanları otomatik olarak güncellenir


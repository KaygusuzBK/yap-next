# Görev Yönetimi Tabloları

Bu dokümantasyon, YAP Proje Yönetimi Sistemi'nin görev yönetimi tablolarını içerir: görevler, atamalar, yorumlar, zaman takibi, etiketler, dosyalar, aktiviteler ve bağımlılıklar.

## 1. project_tasks

Ana görev tablosu. Projelerdeki görevleri yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `project_id` | `uuid` | ❌ | - | Proje ID'si, `projects(id)` referansı |
| `title` | `text` | ❌ | - | Görev başlığı |
| `description` | `text` | ✅ | `NULL` | Görev açıklaması |
| `status` | `text` | ❌ | `'todo'` | Durum: `'todo'`, `'in_progress'`, `'review'`, `'completed'` |
| `priority` | `text` | ❌ | `'medium'` | Öncelik: `'low'`, `'medium'`, `'high'`, `'urgent'` |
| `assigned_to` | `uuid` | ✅ | `NULL` | Atanan kullanıcı, `auth.users(id)` referansı |
| `created_by` | `uuid` | ❌ | - | Oluşturan kullanıcı, `auth.users(id)` referansı |
| `due_date` | `timestamptz` | ✅ | `NULL` | Bitiş tarihi |
| `position` | `integer` | ✅ | `NULL` | Sıralama pozisyonu |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_project_tasks_project_id`
- Index: `idx_project_tasks_assigned_to`
- Index: `idx_project_tasks_created_by`
- Index: `idx_project_tasks_status`
- Index: `idx_project_tasks_priority`
- Index: `idx_project_tasks_due_date`
- Index: `idx_project_tasks_created_at`
- Index: `idx_project_tasks_updated_at`
- Composite: `idx_project_tasks_project_status`
- Composite: `idx_project_tasks_project_priority`
- Composite: `idx_project_tasks_assigned_status`
- Composite: `idx_project_tasks_due_date_status`
- Full-text: `idx_project_tasks_title_fts` (GIN, Turkish)
- Full-text: `idx_project_tasks_description_fts` (GIN, Turkish)
- Foreign key: `project_id` → `projects(id)` (on delete cascade)
- Foreign key: `assigned_to` → `auth.users(id)` (on delete set null)
- Foreign key: `created_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **read_project_tasks**: Proje sahibi veya üyesi görevleri okuyabilir
- **create_project_tasks**: Proje sahibi veya üyesi görev oluşturabilir
- **update_project_tasks**: Proje sahibi veya üyesi görevleri güncelleyebilir
- **delete_project_tasks**: Proje sahibi veya görev oluşturan silebilir

### Trigger'lar

- `handle_project_tasks_updated_at`: `updated_at` alanını otomatik günceller
- `handle_new_task_trigger`: Görev oluşturulduğunda aktivite kaydı oluşturur
- `handle_task_update_trigger`: Görev güncellendiğinde aktivite kaydı oluşturur
- `task_assignment_trigger`: Görev atandığında `task_assignments` tablosuna kayıt ekler
- `new_task_assignment_trigger`: Yeni görev oluşturulduğunda atama kaydı oluşturur
- `task_update_trigger`: Görev güncellendiğinde değişiklikleri kaydeder
- `task_delete_trigger`: Görev silindiğinde aktivite kaydı oluşturur

### İlişkiler

- `projects` (N:1) - `project_id` → `projects.id`
- `auth.users` (N:1) - `assigned_to` → `auth.users.id`
- `auth.users` (N:1) - `created_by` → `auth.users.id`
- `task_assignments` (1:N) - `id` → `task_assignments.task_id`
- `task_comments` (1:N) - `id` → `task_comments.task_id`
- `task_time_logs` (1:N) - `id` → `task_time_logs.task_id`
- `task_tag_relations` (1:N) - `id` → `task_tag_relations.task_id`
- `task_files` (1:N) - `id` → `task_files.task_id`
- `task_activities` (1:N) - `id` → `task_activities.task_id`
- `task_dependencies` (1:N) - `id` → `task_dependencies.task_id` veya `depends_on_task_id`

### Yardımcı Fonksiyonlar

- `get_task_details(task_uuid)`: Görev detaylarını getirir
- `search_tasks(...)`: Görev arama fonksiyonu
- `get_task_statistics(project_uuid)`: Görev istatistiklerini getirir

---

## 2. task_assignments

Görev atamaları tablosu. Çoklu atama desteği sağlar (bir göreve birden fazla kullanıcı atanabilir).

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `user_id` | `uuid` | ❌ | - | Atanan kullanıcı, `auth.users(id)` referansı |
| `assigned_by` | `uuid` | ❌ | - | Atayan kullanıcı, `auth.users(id)` referansı |
| `assigned_at` | `timestamptz` | ❌ | `now()` | Atama tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(task_id, user_id)` - Bir kullanıcı bir göreve sadece bir kez atanabilir
- Index: `idx_task_assignments_task_id`
- Index: `idx_task_assignments_user_id`
- Index: `idx_task_assignments_assigned_by`
- Index: `idx_task_assignments_assigned_at`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)
- Foreign key: `assigned_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir, ancak politikalar görev tablosuna bağlıdır.

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`
- `auth.users` (N:1) - `assigned_by` → `auth.users.id`

---

## 3. task_comments

Görev yorumları tablosu. Görevlerde yorum yapılmasını sağlar.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `content` | `text` | ❌ | - | Yorum içeriği |
| `created_by` | `uuid` | ❌ | - | Yorum yapan kullanıcı, `auth.users(id)` referansı |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_task_comments_task_id`
- Index: `idx_task_comments_created_by`
- Index: `idx_task_comments_created_at`
- Full-text: `idx_task_comments_content_fts` (GIN, Turkish)
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `created_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **read_task_comments**: Proje sahibi veya üyesi yorumları okuyabilir
- **create_task_comments**: Proje sahibi veya üyesi yorum oluşturabilir
- **update_task_comments**: Kullanıcılar sadece kendi yorumlarını güncelleyebilir
- **delete_task_comments**: Kullanıcılar kendi yorumlarını veya proje sahibi tüm yorumları silebilir

### Trigger'lar

- `handle_project_comments_updated_at`: `updated_at` alanını otomatik günceller

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `auth.users` (N:1) - `created_by` → `auth.users.id`

---

## 4. task_time_logs

Görev zaman takibi tablosu. Görevlerde harcanan zamanı kaydeder.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `user_id` | `uuid` | ❌ | - | Zaman kaydeden kullanıcı, `auth.users(id)` referansı |
| `start_time` | `timestamptz` | ❌ | - | Başlangıç zamanı |
| `end_time` | `timestamptz` | ✅ | `NULL` | Bitiş zamanı |
| `description` | `text` | ✅ | `NULL` | Zaman kaydı açıklaması |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_task_time_logs_task_id`
- Index: `idx_task_time_logs_user_id`
- Index: `idx_task_time_logs_start_time`
- Index: `idx_task_time_logs_end_time`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`

---

## 5. task_tags

Görev etiketleri tablosu. Görevleri kategorize etmek için kullanılır.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `name` | `text` | ❌ | - | Etiket adı (unique) |
| `color` | `text` | ❌ | `'#3b82f6'` | Etiket rengi (hex) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Unique: `name`

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `task_tag_relations` (1:N) - `id` → `task_tag_relations.tag_id`

---

## 6. task_tag_relations

Görev-etiket ilişki tablosu. Görevler ve etiketler arasındaki many-to-many ilişkiyi yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `tag_id` | `uuid` | ❌ | - | Etiket ID'si, `task_tags(id)` referansı |

### İndeksler

- Primary key: `(task_id, tag_id)`
- Index: `idx_task_tag_relations_task_id`
- Index: `idx_task_tag_relations_tag_id`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `tag_id` → `task_tags(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `task_tags` (N:1) - `tag_id` → `task_tags.id`

---

## 7. task_files

Görev dosyaları tablosu. Görevlere eklenen dosyaları yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `file_name` | `text` | ❌ | - | Dosya adı |
| `file_path` | `text` | ❌ | - | Dosya yolu (Supabase Storage) |
| `file_size` | `bigint` | ❌ | - | Dosya boyutu (bytes) |
| `file_type` | `text` | ❌ | - | Dosya tipi (MIME type) |
| `uploaded_by` | `uuid` | ❌ | - | Yükleyen kullanıcı, `auth.users(id)` referansı |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_task_files_task_id`
- Index: `idx_task_files_uploaded_by`
- Index: `idx_task_files_created_at`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `uploaded_by` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `auth.users` (N:1) - `uploaded_by` → `auth.users.id`

---

## 8. task_activities

Görev aktiviteleri tablosu. Görevlerdeki tüm değişiklikleri audit log olarak kaydeder.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `user_id` | `uuid` | ❌ | - | İşlemi yapan kullanıcı, `auth.users(id)` referansı |
| `action` | `text` | ❌ | - | Aksiyon tipi: `'task_created'`, `'task_updated'`, `'task_assigned'`, `'task_completed'`, vb. |
| `details` | `jsonb` | ✅ | `'{}'` | Aksiyon detayları (JSON) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_task_activities_task_id`
- Index: `idx_task_activities_user_id`
- Index: `idx_task_activities_action`
- Index: `idx_task_activities_created_at`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

RLS etkinleştirilmiştir.

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `auth.users` (N:1) - `user_id` → `auth.users.id`

### Aksiyon Tipleri

- `task_created`: Görev oluşturuldu
- `task_updated`: Görev güncellendi
- `task_assigned`: Görev atandı
- `task_unassigned`: Görev ataması kaldırıldı
- `task_completed`: Görev tamamlandı
- `task_deleted`: Görev silindi
- `task_created_with_assignment`: Atama ile görev oluşturuldu

---

## 9. task_dependencies

Görev bağımlılıkları tablosu. Görevler arasındaki bağımlılık ilişkilerini yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `task_id` | `uuid` | ❌ | - | Görev ID'si, `project_tasks(id)` referansı |
| `depends_on_task_id` | `uuid` | ❌ | - | Bağımlı olduğu görev ID'si, `project_tasks(id)` referansı |
| `dependency_type` | `varchar(20)` | ❌ | `'blocks'` | Bağımlılık tipi: `'blocks'`, `'relates_to'`, `'duplicates'` |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `created_by` | `uuid` | ✅ | `NULL` | Oluşturan kullanıcı, `auth.users(id)` referansı |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(task_id, depends_on_task_id, dependency_type)` - Aynı bağımlılık tekrar edemez
- Index: `idx_task_dependencies_task_id`
- Index: `idx_task_dependencies_depends_on`
- Index: `idx_task_dependencies_type`
- Foreign key: `task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `depends_on_task_id` → `project_tasks(id)` (on delete cascade)
- Foreign key: `created_by` → `auth.users(id)`
- Constraint: `no_self_dependency` - Görev kendisine bağımlı olamaz

### RLS Politikaları

- **Users can create task dependencies for their tasks**: Görev sahibi veya takım üyesi bağımlılık oluşturabilir
- **Users can read task dependencies for their tasks**: Görev sahibi veya takım üyesi bağımlılıkları okuyabilir
- **Users can delete task dependencies for their tasks**: Görev sahibi veya takım üyesi bağımlılık silebilir

### Trigger'lar

- `check_dependency_cycle_trigger`: Döngüsel bağımlılık kontrolü yapar
- `update_task_dependency_updated_at_trigger`: `updated_at` alanını otomatik günceller

### İlişkiler

- `project_tasks` (N:1) - `task_id` → `project_tasks.id`
- `project_tasks` (N:1) - `depends_on_task_id` → `project_tasks.id`
- `auth.users` (N:1) - `created_by` → `auth.users.id`

### Bağımlılık Tipleri

- `blocks`: Bu görev, bağımlı olduğu görevi engeller
- `relates_to`: Bu görev, bağımlı olduğu görevle ilgilidir
- `duplicates`: Bu görev, bağımlı olduğu görevin tekrarıdır

### Yardımcı Fonksiyonlar

- `get_task_dependency_stats(task_uuid)`: Görev bağımlılık istatistiklerini getirir
- `get_dependency_chain(task_uuid, max_depth)`: Bağımlılık zincirini getirir

### View'lar

- `task_dependency_status`: Görev bağımlılık durumlarını gösterir

---

## 📊 Tablo İlişkileri Özeti

```
project_tasks (1:N) → task_assignments
project_tasks (1:N) → task_comments
project_tasks (1:N) → task_time_logs
project_tasks (1:N) → task_tag_relations → task_tags
project_tasks (1:N) → task_files
project_tasks (1:N) → task_activities
project_tasks (1:N) → task_dependencies (self-referential)
```

## 🔐 Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) etkinleştirilmiştir
- Görev erişimi proje üyeliğine bağlıdır
- Foreign key'ler `on delete cascade` ile yapılandırılmıştır
- Tüm timestamp alanları otomatik olarak güncellenir
- Bağımlılık döngüleri otomatik olarak engellenir


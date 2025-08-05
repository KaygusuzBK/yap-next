# 🗄️ YAP Project Management - Database Relationships

Bu dosya, veritabanı tabloları arasındaki ilişkileri ve veri akışını detaylı olarak açıklar.

## 📊 **ERD (Entity Relationship Diagram)**

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   auth.users    │         │    projects     │         │     tasks       │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (UUID) PK    │◄────────┤ owner_id FK     │         │ id (UUID) PK    │
│ email           │         │ id (UUID) PK    │◄────────┤ project_id FK   │
│ raw_user_meta   │         │ title           │         │ assignee_id FK  │
│ created_at      │         │ description     │         │ parent_task_id  │
│ updated_at      │         │ status          │         │ title           │
└─────────────────┘         │ start_date      │         │ description     │
                            │ end_date        │         │ status          │
                            │ budget          │         │ priority        │
                            │ progress        │         │ due_date        │
                            │ created_at      │         │ estimated_hours │
                            │ updated_at      │         │ actual_hours    │
                            └─────────────────┘         │ tags            │
                                                        │ created_at      │
                                                        │ updated_at      │
                                                        └─────────────────┘
                                │                               │
                                │                               │
                                ▼                               ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ project_members │         │   comments      │         │   comments      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (UUID) PK    │         │ id (UUID) PK    │         │ id (UUID) PK    │
│ project_id FK   │         │ project_id FK   │         │ task_id FK      │
│ user_id FK      │         │ author_id FK    │         │ author_id FK    │
│ role            │         │ content         │         │ content         │
│ joined_at       │         │ parent_comment  │         │ parent_comment  │
└─────────────────┘         │ created_at      │         │ created_at      │
                            │ updated_at      │         │ updated_at      │
                            └─────────────────┘         └─────────────────┘
```

## 🔗 **Detaylı İlişki Açıklamaları**

### **1. AUTH.USERS (Ana Kullanıcı Tablosu)**

**📋 Tablo Açıklaması:** Supabase'in yerleşik kullanıcı tablosu

**🔗 Referans Veren Tablolar:**
- `projects.owner_id` → `auth.users.id`
- `tasks.assignee_id` → `auth.users.id`
- `comments.author_id` → `auth.users.id`
- `project_members.user_id` → `auth.users.id`

**📊 İlişki Türleri:**
- **1:N** - Bir kullanıcı birden fazla proje sahibi olabilir
- **1:N** - Bir kullanıcı birden fazla görev atanabilir
- **1:N** - Bir kullanıcı birden fazla yorum yazabilir
- **1:N** - Bir kullanıcı birden fazla projede üye olabilir

---

### **2. PROJECTS (Projeler Tablosu)**

**📋 Tablo Açıklaması:** Proje yönetimi için ana tablo

**🔗 Foreign Key İlişkileri:**
- `owner_id` → `auth.users.id` (CASCADE DELETE)
- `id` ← `tasks.project_id` (CASCADE DELETE)
- `id` ← `comments.project_id` (CASCADE DELETE)
- `id` ← `project_members.project_id` (CASCADE DELETE)

**📊 İlişki Türleri:**
- **N:1** - Her projenin bir sahibi vardır (auth.users)
- **1:N** - Bir proje birden fazla görev içerebilir
- **1:N** - Bir proje birden fazla yorum içerebilir
- **1:N** - Bir proje birden fazla üye içerebilir

**🔄 Veri Akışı:**
```
auth.users → projects → tasks
auth.users → projects → comments
auth.users → projects → project_members
```

---

### **3. TASKS (Görevler Tablosu)**

**📋 Tablo Açıklaması:** Proje görevleri ve alt görevler

**🔗 Foreign Key İlişkileri:**
- `project_id` → `projects.id` (CASCADE DELETE)
- `assignee_id` → `auth.users.id` (SET NULL DELETE)
- `parent_task_id` → `tasks.id` (CASCADE DELETE) - Self Reference
- `id` ← `comments.task_id` (CASCADE DELETE)

**📊 İlişki Türleri:**
- **N:1** - Her görev bir projeye aittir
- **N:1** - Her görevin bir atanan kişisi olabilir (opsiyonel)
- **1:N** - Bir görev birden fazla alt görev içerebilir (hierarchical)
- **1:N** - Bir görev birden fazla yorum içerebilir

**🔄 Self-Reference (Hierarchical Tasks):**
```
Task A (parent_task_id = NULL)
├── Task B (parent_task_id = Task A)
│   ├── Task D (parent_task_id = Task B)
│   └── Task E (parent_task_id = Task B)
└── Task C (parent_task_id = Task A)
```

---

### **4. COMMENTS (Yorumlar Tablosu)**

**📋 Tablo Açıklaması:** Proje ve görev yorumları (threaded)

**🔗 Foreign Key İlişkileri:**
- `author_id` → `auth.users.id` (CASCADE DELETE)
- `project_id` → `projects.id` (CASCADE DELETE) - Opsiyonel
- `task_id` → `tasks.id` (CASCADE DELETE) - Opsiyonel
- `parent_comment_id` → `comments.id` (CASCADE DELETE) - Self Reference

**📊 İlişki Türleri:**
- **N:1** - Her yorumun bir yazarı vardır
- **N:1** - Her yorum bir projeye veya göreve ait olabilir
- **1:N** - Bir yorum birden fazla alt yorum içerebilir (threaded)

**🔄 Yorum Yapısı:**
```
Project Comment A (project_id = X, task_id = NULL)
├── Reply A1 (parent_comment_id = A)
│   ├── Reply A1a (parent_comment_id = A1)
│   └── Reply A1b (parent_comment_id = A1)
└── Reply A2 (parent_comment_id = A)

Task Comment B (project_id = NULL, task_id = Y)
├── Reply B1 (parent_comment_id = B)
└── Reply B2 (parent_comment_id = B)
```

---

### **5. PROJECT_MEMBERS (Proje Üyeleri Tablosu)**

**📋 Tablo Açıklaması:** Proje üyelikleri ve rolleri

**🔗 Foreign Key İlişkileri:**
- `project_id` → `projects.id` (CASCADE DELETE)
- `user_id` → `auth.users.id` (CASCADE DELETE)

**📊 İlişki Türleri:**
- **N:1** - Her üyelik bir projeye aittir
- **N:1** - Her üyelik bir kullanıcıya aittir
- **Unique Constraint:** `(project_id, user_id)` - Bir kullanıcı aynı projede birden fazla kez üye olamaz

**🔄 Üyelik Yapısı:**
```
Project A
├── User 1 (role: owner)
├── User 2 (role: manager)
└── User 3 (role: member)

Project B
├── User 1 (role: owner)
└── User 4 (role: member)
```

---

## 🔄 **Veri Akış Diyagramı**

### **Proje Oluşturma Akışı:**
```
1. User (auth.users) → 2. Project (projects.owner_id)
3. Project → 4. Tasks (tasks.project_id)
5. Project → 6. Comments (comments.project_id)
7. Project → 8. Members (project_members.project_id)
```

### **Görev Atama Akışı:**
```
1. Project → 2. Task (tasks.project_id)
3. Task → 4. User Assignment (tasks.assignee_id)
5. Task → 6. Comments (comments.task_id)
7. Task → 8. Sub-tasks (tasks.parent_task_id)
```

### **Yorum Sistemi Akışı:**
```
1. User → 2. Comment (comments.author_id)
3. Comment → 4. Project/Task (comments.project_id OR comments.task_id)
5. Comment → 6. Replies (comments.parent_comment_id)
```

---

## 🛡️ **Güvenlik İlişkileri (RLS Policies)**

### **Proje Erişim Kontrolü:**
```
User can access Project IF:
├── User is project owner (projects.owner_id = auth.uid())
└── User is project member (project_members.user_id = auth.uid())
```

### **Görev Erişim Kontrolü:**
```
User can access Task IF:
└── Task belongs to accessible project (tasks.project_id IN accessible_projects)
```

### **Yorum Erişim Kontrolü:**
```
User can access Comment IF:
├── Comment belongs to accessible project (comments.project_id IN accessible_projects)
└── Comment belongs to accessible task (comments.task_id IN accessible_tasks)
```

---

## 📈 **İstatistik İlişkileri**

### **Proje İstatistikleri:**
```sql
-- projects → project_stats view
SELECT 
    owner_id,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE status = 'active') as active_projects
FROM projects
GROUP BY owner_id;
```

### **Görev İstatistikleri:**
```sql
-- projects → tasks → task_stats view
SELECT 
    p.owner_id,
    COUNT(t.*) as total_tasks,
    COUNT(t.*) FILTER (WHERE t.status = 'completed') as completed_tasks
FROM projects p
JOIN tasks t ON p.id = t.project_id
GROUP BY p.owner_id;
```

### **Kullanıcı Aktivite İstatistikleri:**
```sql
-- auth.users → projects + tasks + comments
SELECT 
    u.id,
    COUNT(p.*) as owned_projects,
    COUNT(t.*) as assigned_tasks,
    COUNT(c.*) as written_comments
FROM auth.users u
LEFT JOIN projects p ON u.id = p.owner_id
LEFT JOIN tasks t ON u.id = t.assignee_id
LEFT JOIN comments c ON u.id = c.author_id
GROUP BY u.id;
```

---

## 🔧 **Güncelleme Senaryoları**

### **Proje Silme:**
```
1. DELETE FROM projects WHERE id = X
2. CASCADE: DELETE FROM tasks WHERE project_id = X
3. CASCADE: DELETE FROM comments WHERE project_id = X
4. CASCADE: DELETE FROM project_members WHERE project_id = X
```

### **Kullanıcı Silme:**
```
1. DELETE FROM auth.users WHERE id = X
2. CASCADE: DELETE FROM projects WHERE owner_id = X
3. SET NULL: UPDATE tasks SET assignee_id = NULL WHERE assignee_id = X
4. CASCADE: DELETE FROM comments WHERE author_id = X
5. CASCADE: DELETE FROM project_members WHERE user_id = X
```

### **Görev Silme:**
```
1. DELETE FROM tasks WHERE id = X
2. CASCADE: DELETE FROM tasks WHERE parent_task_id = X (sub-tasks)
3. CASCADE: DELETE FROM comments WHERE task_id = X
```

---

## ⚠️ **Önemli Notlar**

### **Cascade Delete Davranışları:**
- **CASCADE:** Proje silindiğinde tüm görevler, yorumlar ve üyeler silinir
- **SET NULL:** Kullanıcı silindiğinde atanan görevler NULL olur
- **Self Reference:** Alt görevler ve yorumlar parent ile birlikte silinir

### **Unique Constraints:**
- `project_members(project_id, user_id)` - Aynı kullanıcı aynı projede birden fazla kez üye olamaz

### **Check Constraints:**
- `projects.progress` - 0-100 arası
- `projects.status` - Enum değerler
- `tasks.status` - Enum değerler
- `tasks.priority` - Enum değerler

### **Index Stratejileri:**
- Foreign key'ler için indexler
- Sık sorgulanan alanlar için composite indexler
- Tarih sıralaması için DESC indexler

---

## 🎯 **Güncelleme Yaparken Dikkat Edilecekler**

### **Yeni Tablo Eklerken:**
1. **Foreign key ilişkilerini** tanımla
2. **RLS policies** ekle
3. **Indexler** oluştur
4. **Views** güncelle
5. **Functions** güncelle

### **Mevcut İlişkileri Değiştirirken:**
1. **Cascade davranışlarını** kontrol et
2. **RLS policies** güncelle
3. **Views** yeniden oluştur
4. **Test verilerini** kontrol et

### **Performans Optimizasyonu:**
1. **Composite indexler** ekle
2. **Query patterns** analiz et
3. **RLS policies** optimize et
4. **Views** materialize et (gerekirse)

---

## 📋 **İlişki Özeti**

| Tablo | Primary Key | Foreign Keys | Referenced By |
|-------|-------------|--------------|---------------|
| `auth.users` | `id` | - | `projects.owner_id`, `tasks.assignee_id`, `comments.author_id`, `project_members.user_id` |
| `projects` | `id` | `owner_id` → `auth.users.id` | `tasks.project_id`, `comments.project_id`, `project_members.project_id` |
| `tasks` | `id` | `project_id` → `projects.id`, `assignee_id` → `auth.users.id`, `parent_task_id` → `tasks.id` | `comments.task_id` |
| `comments` | `id` | `author_id` → `auth.users.id`, `project_id` → `projects.id`, `task_id` → `tasks.id`, `parent_comment_id` → `comments.id` | - |
| `project_members` | `id` | `project_id` → `projects.id`, `user_id` → `auth.users.id` | - |

**🎉 Bu dokümantasyon ile veritabanı ilişkilerini asla unutmayacaksınız!** 
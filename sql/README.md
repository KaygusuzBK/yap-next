# 🗄️ YAP Project Management - Database Schema

Bu klasör, Supabase veritabanı şeması için SQL dosyalarını içerir.

## 📁 Klasör Yapısı

```
sql/
├── README.md                 # Bu dosya
├── database-relationships.md # 📊 Veritabanı ilişkileri ve ERD
├── tables/                   # Ana tablolar (her tablo için ayrı dosya)
│   ├── projects.sql          # Projeler tablosu
│   ├── tasks.sql             # Görevler tablosu
│   ├── comments.sql          # Yorumlar tablosu
│   └── project_members.sql   # Proje üyeleri tablosu
├── indexes/                  # Index tanımları (her tablo için ayrı dosya)
│   ├── projects_indexes.sql  # Projeler için indexler
│   ├── tasks_indexes.sql     # Görevler için indexler
│   └── comments_indexes.sql  # Yorumlar için indexler
├── policies/                 # RLS ve diğer güvenlik politikaları
│   ├── projects_policies.sql # Projeler için politikalar
│   ├── tasks_policies.sql    # Görevler için politikalar
│   └── comments_policies.sql # Yorumlar için politikalar
├── functions/                # Fonksiyonlar ve triggerlar
│   ├── projects_functions.sql # Projeler için fonksiyonlar
│   ├── tasks_functions.sql    # Görevler için fonksiyonlar
│   └── comments_functions.sql # Yorumlar için fonksiyonlar
├── views/                    # Sık kullanılan sorgular için view'lar
│   ├── project_stats.sql     # Proje istatistikleri
│   └── task_stats.sql        # Görev istatistikleri
├── sample-data.sql          # Test verileri
├── migrations.sql            # Migration scriptleri
└── 01-extensions.sql         # Gerekli extension'lar
```

## 🚀 Kurulum Sırası

### **📖 Önce İlişkileri Anlayın:**
```bash
# Veritabanı ilişkilerini inceleyin
cat database-relationships.md
```

### **Hızlı Kurulum (Önerilen):**
```sql
-- Tüm kurulumu tek seferde çalıştır
\i setup-complete.sql
```

### **Adım Adım Kurulum:**
```sql
-- 1. Extensions
\i 01-extensions.sql

-- 2. Tablolar
\i 02-tables.sql

-- 3. Indexler
\i 03-indexes.sql

-- 4. RLS Policies
\i 04-rls-policies.sql

-- 5. Functions ve Triggers
\i 05-functions.sql

-- 6. Views
\i 06-views.sql

-- 7. Sample Data (İsteğe bağlı)
\i 07-sample-data.sql
```

## 📊 Veritabanı Şeması

### **Ana Tablolar:**

#### **1. projects**
- `id` (UUID, Primary Key)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `status` (ENUM: active, completed, on_hold, cancelled)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE)
- `budget` (DECIMAL(10,2))
- `progress` (INTEGER, 0-100)
- `owner_id` (UUID, Foreign Key → auth.users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **2. tasks**
- `id` (UUID, Primary Key)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `status` (ENUM: todo, in_progress, completed, cancelled)
- `priority` (ENUM: low, medium, high, urgent)
- `assignee_id` (UUID, Foreign Key → auth.users)
- `project_id` (UUID, Foreign Key → projects)
- `due_date` (DATE)
- `estimated_hours` (INTEGER)
- `actual_hours` (INTEGER)
- `parent_task_id` (UUID, Self Reference)
- `tags` (TEXT[])
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **3. comments**
- `id` (UUID, Primary Key)
- `content` (TEXT, NOT NULL)
- `author_id` (UUID, Foreign Key → auth.users)
- `project_id` (UUID, Foreign Key → projects)
- `task_id` (UUID, Foreign Key → tasks)
- `parent_comment_id` (UUID, Self Reference)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **4. project_members**
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key → projects)
- `user_id` (UUID, Foreign Key → auth.users)
- `role` (ENUM: owner, manager, member)
- `joined_at` (TIMESTAMP)

### **İlişkiler:**
```
auth.users (1) ←→ (N) projects
projects (1) ←→ (N) tasks
projects (1) ←→ (N) comments
tasks (1) ←→ (N) comments
projects (1) ←→ (N) project_members
auth.users (1) ←→ (N) project_members
tasks (1) ←→ (N) tasks (parent-child)
comments (1) ←→ (N) comments (parent-child)
```

## 🔐 Güvenlik (RLS Policies)

### **Projects:**
- ✅ Kullanıcılar sadece kendi projelerini veya üye oldukları projeleri görebilir
- ✅ Sadece proje sahipleri projelerini güncelleyebilir/silebilir

### **Tasks:**
- ✅ Kullanıcılar sadece erişimleri olan projelerdeki görevleri görebilir
- ✅ Görev atanan kişiler veya proje sahipleri görevleri güncelleyebilir

### **Comments:**
- ✅ Kullanıcılar sadece erişimleri olan projelerdeki yorumları görebilir
- ✅ Kullanıcılar sadece kendi yorumlarını güncelleyebilir

### **Project Members:**
- ✅ Sadece proje sahipleri üye ekleyebilir/çıkarabilir

## 📈 Views

### **project_stats**
- Toplam proje sayısı
- Aktif projeler
- Tamamlanan projeler
- İptal edilen projeler
- Tamamlanma oranı

### **task_stats**
- Toplam görev sayısı
- Duruma göre görev dağılımı
- Tamamlanma oranı

## 🔄 Güncelleme Süreci

### **📊 İlişkileri Kontrol Edin:**
1. `database-relationships.md` dosyasını inceleyin
2. Yeni tablo/ilişki eklerken ERD'yi güncelleyin
3. Foreign key ilişkilerini dokümante edin

### **Yeni Özellik Eklendiğinde:**
1. `08-migrations.sql` dosyasına yeni migration ekleyin
2. Migration numarasını artırın (örn: `08-migrations-v2.sql`)
3. Değişiklikleri dokümante edin
4. `database-relationships.md` dosyasını güncelleyin

### **Örnek Migration:**
```sql
-- Migration: Add task_attachments table
-- Date: 2024-01-15
-- Description: Add support for file attachments to tasks

CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Add RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view attachments for tasks they have access to" ON task_attachments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );
```

## 🧪 Test Verileri

`07-sample-data.sql` dosyası şunları içerir:
- 3 örnek proje
- 6 örnek görev
- Gerçekçi veriler (tarihler, bütçeler, ilerleme)

## ⚠️ Önemli Notlar

1. **Backup:** Büyük değişikliklerden önce veritabanını yedekleyin
2. **Test:** Migration'ları önce test ortamında çalıştırın
3. **RLS:** Yeni tablolar için mutlaka RLS policies ekleyin
4. **Indexes:** Performans için gerekli indexleri ekleyin
5. **Foreign Keys:** İlişkileri doğru tanımlayın

## 🆘 Sorun Giderme

### **Yaygın Hatalar:**
- **RLS Error:** Tablo için RLS policy eksik
- **Permission Error:** Kullanıcının yetkisi yok
- **Foreign Key Error:** Referans edilen kayıt bulunamadı

### **Kontrol Sorguları:**
```sql
-- Tabloları listele
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- RLS policies kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Indexleri kontrol et
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```
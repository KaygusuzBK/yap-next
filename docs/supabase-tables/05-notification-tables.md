# Bildirim ve Tercih Tabloları

Bu dokümantasyon, YAP Proje Yönetimi Sistemi'nin bildirim ve kullanıcı tercih tablolarını içerir: in-app bildirimler ve kullanıcı tercihleri.

## 1. notifications

In-app bildirimler tablosu. Kullanıcılara gönderilen bildirimleri yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | ❌ | - | Bildirim alan kullanıcı, `auth.users(id)` referansı |
| `type` | `text` | ❌ | - | Bildirim tipi: `'task_assigned'`, `'task_mentioned'`, `'task_updated'`, `'project_invited'`, vb. |
| `payload` | `jsonb` | ❌ | `'{}'` | Bildirim içeriği (JSON) |
| `read_at` | `timestamptz` | ✅ | `NULL` | Okunma tarihi (null ise okunmamış) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |

### İndeksler

- Primary key: `id`
- Index: `idx_notifications_user_created` - `(user_id, created_at DESC)` - Kullanıcı bildirimlerini tarihe göre sıralama
- Index: `idx_notifications_unread` - `(user_id, read_at)` - Okunmamış bildirimleri hızlı bulma
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **notifications_select**: Kullanıcılar sadece kendi bildirimlerini okuyabilir
- **notifications_update**: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir (okundu olarak işaretleme)
- **notifications_insert**: Server-side'dan service role key ile eklenir (client'tan eklenemez)

### İlişkiler

- `auth.users` (N:1) - `user_id` → `auth.users.id`

### Bildirim Tipleri

#### task_assigned
Görev atandığında gönderilir.
```json
{
  "type": "task_assigned",
  "payload": {
    "task_id": "uuid",
    "task_title": "Görev Başlığı",
    "project_id": "uuid",
    "project_title": "Proje Adı",
    "assigned_by": "uuid",
    "assigned_by_name": "Kullanıcı Adı"
  }
}
```

#### task_mentioned
Görev yorumunda kullanıcı mention edildiğinde gönderilir.
```json
{
  "type": "task_mentioned",
  "payload": {
    "task_id": "uuid",
    "task_title": "Görev Başlığı",
    "comment_id": "uuid",
    "comment_content": "Yorum içeriği @kullanıcı",
    "mentioned_by": "uuid",
    "mentioned_by_name": "Kullanıcı Adı"
  }
}
```

#### task_updated
Görev güncellendiğinde gönderilir.
```json
{
  "type": "task_updated",
  "payload": {
    "task_id": "uuid",
    "task_title": "Görev Başlığı",
    "changes": {
      "status": { "old": "todo", "new": "in_progress" },
      "priority": { "old": "medium", "new": "high" }
    },
    "updated_by": "uuid",
    "updated_by_name": "Kullanıcı Adı"
  }
}
```

#### project_invited
Projeye davet edildiğinde gönderilir.
```json
{
  "type": "project_invited",
  "payload": {
    "project_id": "uuid",
    "project_title": "Proje Adı",
    "role": "member",
    "invited_by": "uuid",
    "invited_by_name": "Kullanıcı Adı"
  }
}
```

#### team_invited
Takıma davet edildiğinde gönderilir.
```json
{
  "type": "team_invited",
  "payload": {
    "team_id": "uuid",
    "team_name": "Takım Adı",
    "role": "member",
    "invited_by": "uuid",
    "invited_by_name": "Kullanıcı Adı"
  }
}
```

### Kullanım Senaryoları

1. **Bildirim Oluşturma** (Server-side)
   ```typescript
   // Service role key ile
   await supabaseAdmin
     .from('notifications')
     .insert({
       user_id: targetUserId,
       type: 'task_assigned',
       payload: { task_id, task_title, ... }
     });
   ```

2. **Bildirim Okuma** (Client-side)
   ```typescript
   // Kullanıcı sadece kendi bildirimlerini görebilir
   const { data } = await supabase
     .from('notifications')
     .select('*')
     .order('created_at', { ascending: false })
     .limit(20);
   ```

3. **Bildirim Okundu İşaretleme**
   ```typescript
   await supabase
     .from('notifications')
     .update({ read_at: new Date().toISOString() })
     .eq('id', notificationId);
   ```

4. **Okunmamış Bildirim Sayısı**
   ```typescript
   const { count } = await supabase
     .from('notifications')
     .select('*', { count: 'exact', head: true })
     .is('read_at', null);
   ```

### Realtime Abonelik

Navbar'da bildirim çanı için realtime abonelik:
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Yeni bildirim geldi
    updateNotificationCount();
  })
  .subscribe();
```

---

## 2. user_preferences

Kullanıcı tercihleri tablosu. Kullanıcıların uygulama tercihlerini yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `user_id` | `uuid` | ❌ | - | Primary key, `auth.users(id)` referansı |
| `slack_webhook_url` | `text` | ✅ | `NULL` | Kullanıcının özel Slack webhook URL'i |
| `theme` | `text` | ✅ | `'system'` | Tema tercihi: `'light'`, `'dark'`, `'system'` |
| `prefs` | `jsonb` | ❌ | `'{}'` | Diğer tercihler (JSON) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `user_id`
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **select own prefs**: Kullanıcılar sadece kendi tercihlerini okuyabilir
- **insert own prefs**: Kullanıcılar kendi tercihlerini oluşturabilir
- **update own prefs**: Kullanıcılar sadece kendi tercihlerini güncelleyebilir

### Trigger'lar

- `trg_user_prefs_updated`: `updated_at` alanını otomatik günceller

### İlişkiler

- `auth.users` (1:1) - `user_id` → `auth.users.id`

### Tercih Yapısı (prefs JSONB)

```json
{
  "notifications": {
    "email": true,
    "slack": true,
    "in_app": true,
    "task_assigned": true,
    "task_mentioned": true,
    "task_updated": false,
    "project_invited": true,
    "team_invited": true
  },
  "dashboard": {
    "default_view": "list",
    "tasks_per_page": 20,
    "show_completed": false
  },
  "editor": {
    "font_size": 14,
    "line_height": 1.5,
    "word_wrap": true
  },
  "language": "tr",
  "timezone": "Europe/Istanbul"
}
```

### Kullanım Senaryoları

1. **Tercih Okuma**
   ```typescript
   const { data } = await supabase
     .from('user_preferences')
     .select('*')
     .eq('user_id', userId)
     .single();
   ```

2. **Tercih Güncelleme**
   ```typescript
   await supabase
     .from('user_preferences')
     .upsert({
       user_id: userId,
       theme: 'dark',
       prefs: {
         notifications: { email: true, slack: false }
       }
     });
   ```

3. **Tema Tercihi**
   ```typescript
   // Tema tercihini güncelle
   await supabase
     .from('user_preferences')
     .update({ theme: 'dark' })
     .eq('user_id', userId);
   ```

4. **Slack Webhook**
   ```typescript
   // Özel Slack webhook URL'i ekle
   await supabase
     .from('user_preferences')
     .update({ slack_webhook_url: 'https://hooks.slack.com/...' })
     .eq('user_id', userId);
   ```

---

## 📊 Tablo İlişkileri Özeti

```
auth.users (1:N) → notifications
auth.users (1:1) → user_preferences
```

## 🔐 Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) etkinleştirilmiştir
- Kullanıcılar sadece kendi bildirimlerini ve tercihlerini görebilir
- Bildirimler sadece server-side'dan oluşturulabilir (service role key ile)
- Foreign key'ler `on delete cascade` ile yapılandırılmıştır
- Tüm timestamp alanları otomatik olarak güncellenir

## 🔔 Bildirim Akışı

1. **Bildirim Oluşturma**: Server-side'da (API route) service role key ile
2. **Bildirim Gönderme**: Realtime subscription ile client'a anlık iletim
3. **Bildirim Okuma**: Client-side'da kullanıcı bildirimleri görüntüler
4. **Bildirim Okundu**: Client-side'da `read_at` güncellenir

## 📱 Bildirim UI

- Navbar'da bildirim çanı ikonu
- Okunmamış bildirim sayacı (badge)
- Bildirim dropdown menüsü
- Bildirim detay sayfası
- Tüm bildirimleri okundu işaretleme

## 🎨 Tema Yönetimi

- `light`: Açık tema
- `dark`: Koyu tema
- `system`: Sistem temasını takip et
- Tema tercihi `user_preferences.theme` alanında saklanır
- Next.js `next-themes` paketi ile yönetilir


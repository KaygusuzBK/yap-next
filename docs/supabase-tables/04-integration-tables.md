# Entegrasyon Tabloları

Bu dokümantasyon, YAP Proje Yönetimi Sistemi'nin entegrasyon tablolarını içerir: kullanıcı entegrasyonları (GitHub, Google Calendar, Slack, Discord).

## 1. user_integrations

Kullanıcı entegrasyonları tablosu. Kullanıcıların GitHub, Google Calendar, Slack ve Discord gibi servislerle entegrasyonlarını yönetir.

### Sütunlar

| Sütun | Tip | Nullable | Varsayılan | Açıklama |
|-------|-----|----------|------------|----------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | ❌ | - | Kullanıcı ID'si, `auth.users(id)` referansı |
| `provider` | `text` | ❌ | - | Entegrasyon sağlayıcısı: `'github'`, `'google_calendar'`, `'slack'`, `'discord'` |
| `access_token` | `text` | ❌ | - | OAuth access token (şifrelenmiş olmalı) |
| `refresh_token` | `text` | ✅ | `NULL` | OAuth refresh token (şifrelenmiş olmalı) |
| `provider_user_id` | `text` | ❌ | - | Provider'daki kullanıcı ID'si |
| `provider_username` | `text` | ❌ | - | Provider'daki kullanıcı adı |
| `provider_data` | `jsonb` | ❌ | `'{}'` | Provider'a özel ek veriler (JSON) |
| `created_at` | `timestamptz` | ❌ | `now()` | Oluşturulma tarihi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Güncellenme tarihi |

### İndeksler

- Primary key: `id`
- Unique: `(user_id, provider)` - Her kullanıcı için aynı provider sadece bir kez kullanılabilir
- Index: `idx_user_integrations_user_id`
- Index: `idx_user_integrations_provider`
- Foreign key: `user_id` → `auth.users(id)` (on delete cascade)

### RLS Politikaları

- **Users can view own integrations**: Kullanıcılar sadece kendi entegrasyonlarını görebilir
- **Users can insert own integrations**: Kullanıcılar kendi entegrasyonlarını oluşturabilir
- **Users can update own integrations**: Kullanıcılar kendi entegrasyonlarını güncelleyebilir
- **Users can delete own integrations**: Kullanıcılar kendi entegrasyonlarını silebilir

### Trigger'lar

- `update_user_integrations_updated_at`: `updated_at` alanını otomatik günceller

### İlişkiler

- `auth.users` (N:1) - `user_id` → `auth.users.id`

### Entegrasyon Tipleri

#### GitHub Entegrasyonu
```json
{
  "provider": "github",
  "provider_user_id": "12345678",
  "provider_username": "username",
  "provider_data": {
    "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
    "email": "user@example.com",
    "name": "User Name",
    "repos_url": "https://api.github.com/users/username/repos"
  }
}
```

#### Google Calendar Entegrasyonu
```json
{
  "provider": "google_calendar",
  "provider_user_id": "user@gmail.com",
  "provider_username": "user@gmail.com",
  "provider_data": {
    "calendar_id": "primary",
    "timezone": "Europe/Istanbul",
    "email": "user@gmail.com"
  }
}
```

#### Slack Entegrasyonu
```json
{
  "provider": "slack",
  "provider_user_id": "U01234567",
  "provider_username": "username",
  "provider_data": {
    "team_id": "T01234567",
    "team_name": "My Team",
    "avatar_url": "https://avatars.slack-edge.com/..."
  }
}
```

#### Discord Entegrasyonu
```json
{
  "provider": "discord",
  "provider_user_id": "123456789012345678",
  "provider_username": "username#1234",
  "provider_data": {
    "avatar": "avatar_hash",
    "discriminator": "1234",
    "email": "user@example.com"
  }
}
```

### Güvenlik Notları

⚠️ **ÖNEMLİ**: 
- `access_token` ve `refresh_token` alanları hassas bilgiler içerir
- Bu alanlar şifrelenmiş olarak saklanmalıdır
- RLS politikaları sayesinde kullanıcılar sadece kendi token'larını görebilir
- Server-side'da service role key ile erişim gerekebilir

### Kullanım Senaryoları

1. **GitHub Entegrasyonu**
   - Repository'leri listeleme
   - Issue'ları senkronize etme
   - Pull request'leri takip etme

2. **Google Calendar Entegrasyonu**
   - Görevleri takvime ekleme
   - Toplantıları senkronize etme
   - Tarih bazlı bildirimler

3. **Slack Entegrasyonu**
   - Görev bildirimleri gönderme
   - Kanallara mesaj gönderme
   - Slash command'ler

4. **Discord Entegrasyonu**
   - Bot komutları
   - Bildirimler
   - Sunucu yönetimi

---

## 📊 Tablo İlişkileri Özeti

```
auth.users (1:N) → user_integrations
```

## 🔐 Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) etkinleştirilmiştir
- Kullanıcılar sadece kendi entegrasyonlarını görebilir
- Foreign key'ler `on delete cascade` ile yapılandırılmıştır
- Tüm timestamp alanları otomatik olarak güncellenir
- **Token'lar şifrelenmiş olarak saklanmalıdır**

## 🔄 Token Yenileme

Refresh token'lar kullanılarak access token'lar otomatik olarak yenilenebilir:

1. Access token süresi dolduğunda
2. Refresh token kullanılarak yeni access token alınır
3. Yeni token `updated_at` ile birlikte güncellenir

## 📚 API Entegrasyon Örnekleri

### GitHub API
```typescript
// GitHub repository'leri listeleme
const repos = await octokit.repos.listForAuthenticatedUser();

// Issue oluşturma
const issue = await octokit.issues.create({
  owner: 'owner',
  repo: 'repo',
  title: 'Task Title',
  body: 'Task Description'
});
```

### Google Calendar API
```typescript
// Event oluşturma
const event = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: 'Task Title',
    start: { dateTime: '2024-01-01T10:00:00Z' },
    end: { dateTime: '2024-01-01T11:00:00Z' }
  }
});
```

### Slack API
```typescript
// Mesaj gönderme
await slack.chat.postMessage({
  channel: 'C01234567',
  text: 'New task created: Task Title'
});
```


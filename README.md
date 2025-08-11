# YAP - Proje Yönetimi Uygulaması

Modern ve kullanıcı dostu bir proje yönetimi uygulaması. Next.js, TypeScript, Supabase ve Tailwind CSS kullanılarak geliştirilmiştir.

## 🚀 Özellikler

### 👥 Takım Yönetimi
- Takım oluşturma ve yönetimi
- Takım üyeleri ve rolleri
- Takım davetiyeleri

### 📁 Proje Yönetimi
- Proje oluşturma ve düzenleme
- Proje durumları ve kategoriler
- Proje üyeleri ve izinler

### ✅ Görev Yönetimi
- Görev oluşturma, düzenleme, silme
- Görev atama sistemi
- Öncelik seviyeleri (Düşük, Orta, Yüksek, Acil)
- Durum takibi (Yapılacak, Devam Ediyor, İncelemede, Tamamlandı)
- Bitiş tarihi ve kalan gün hesaplama
- Görev detay sayfası
- Görev aktivite geçmişi

### 🎨 Kullanıcı Arayüzü
- Modern ve responsive tasarım
- Sidebar navigasyon
- Görev listesi ve istatistikler
- Toast bildirimleri
- Loading ve error durumları

## 🗂️ Veritabanı Şeması

![Supabase Schema](./public/supabase-schema.svg)

*Veritabanı şeması görseli - Tablolar ve ilişkiler*

## 🛠️ Teknolojiler

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm/yarn/pnpm
- Supabase hesabı

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/KaygusuzBK/yap-next.git
cd yap-next
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables
`.env.local` dosyası oluşturun:
```env
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (server/admin)
# Sunucu tarafında güvenilir işlemler için kullanılır (RLS bypass)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DB bağlantısı (psql/scriptler için)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
# Varsayılan kanal (proje kanalı tanımlı değilse kullanılır)
SLACK_DEFAULT_CHANNEL=C0123456789

# Otomasyon kullanıcısı (Slack üzerinden açılan görevlerde created_by olarak kullanılır)
SUPABASE_AUTOMATION_USER_ID=00000000-0000-0000-0000-000000000000
```

### 4. Veritabanı Kurulumu
```bash
# Temel şemayı uygula
./sql/apply.sh

# Güncellemeler (updates) – gerekiyorsa sırayla uygula
psql "$DATABASE_URL" -f sql/updates/017-consolidated-rls-and-triggers.sql
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
```

### 5. Uygulamayı Başlatın
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinde uygulamayı görüntüleyin.

## 📋 SQL Uygulama Sırası

Detaylı SQL kurulum talimatları için [sql/README.md](./sql/README.md) dosyasını inceleyin.

### Hızlı Kurulum
```bash
# Tüm SQL dosyalarını tek seferde uygula
./sql/apply.sh
```

### Manuel Kurulum
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
```

## 🎯 Kullanım

### 1. Kayıt Olun/Giriş Yapın
- Uygulamaya kayıt olun veya giriş yapın
- Profil bilgilerinizi güncelleyin

### 2. Takım Oluşturun
- Sidebar'dan "Takımlar" bölümüne gidin
- "Takım Oluştur" butonuna tıklayın
- Takım adını girin ve üye davet edin

### 3. Proje Oluşturun
- Sidebar'dan "Projeler" bölümüne gidin
- "Proje Oluştur" butonuna tıklayın
- Proje bilgilerini doldurun

### 4. Görev Yönetimi
- Proje sayfasına gidin
- "Yeni Görev" butonuna tıklayın
- Görev bilgilerini doldurun
- Görevleri kişilere atayın
- Görev durumlarını takip edin

### 5. Görev Detayları
- Sidebar'dan "Görevlerim" bölümüne gidin
- Görevlere tıklayarak detay sayfasını görüntüleyin
- Görevleri düzenleyin veya silin

## 🐛 Sorun Giderme

### RLS Hatası
```bash
# Sonsuz döngü hatası alırsanız
./sql/fix-rls.sh
```

### Build Hatası
```bash
# ESLint hatalarını düzeltin
npm run lint
```

### Veritabanı Bağlantı Hatası
- `DATABASE_URL` environment variable'ını kontrol edin
- Supabase Dashboard'dan SQL Editor'ü kullanın

### Slack Mesaj Gitmiyor
- `SLACK_BOT_TOKEN` ve `SLACK_SIGNING_SECRET` değerlerini doğrulayın
- Slack uygulamasında gerekli OAuth kapsamları: `chat:write`, `channels:read`, `groups:read`, `channels:join`
- Botu ilgili kanala davet edin (public kanallarda otomatik katılma denemesi yapılır)
- Komut ve Event Request URL'leri doğru mu?
  - Slash Command: `/api/slack/commands`
  - Events (URL Verification dahil): `/api/slack/events`
  - Bildirim webhook'ları: `/api/slack/task-created`, `/api/slack/task-updated`
  - Next.js Node.js runtime kullanılır

## 📊 Veritabanı Yapısı

### Temel Tablolar
- `profiles` - Kullanıcı profilleri
- `teams` - Takımlar
- `team_members` - Takım üyeleri
- `projects` - Projeler
- `project_members` - Proje üyeleri

### Görev Tabloları
- `project_tasks` - Ana görev tablosu
- `task_assignments` - Görev atamaları
- `task_comments` - Görev yorumları
- `task_time_logs` - Zaman takibi
- `task_files` - Görev dosyaları
- `task_activities` - Aktivite geçmişi
- `task_tags` - Görev etiketleri
- `task_tag_relations` - Görev-etiket ilişkileri

## 🚀 Deployment

### Vercel (Önerilen)
1. GitHub repository'nizi Vercel'e bağlayın
2. Environment variables'ları ayarlayın
3. Deploy edin

### Vercel Environment Variables
- `NEXT_PUBLIC_*` anahtarlarını Production/Preview ortamlarına ekleyin
- `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_*`, `SUPABASE_AUTOMATION_USER_ID` değerlerini Server-side olarak ekleyin

### Diğer Platformlar
- Netlify
- Railway
- Heroku

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- GitHub: [@KaygusuzBK](https://github.com/KaygusuzBK)
- Email: [email protected]

---

**YAP** - Proje yönetiminde yeni bir yaklaşım 🚀

---

## 📡 Slack Entegrasyonu (Özet)

- Slash Command: `POST /api/slack/commands` – serbest metinden proje UUID, başlık ve alanları ayrıştırır
- Events API: `POST /api/slack/events` – kanal mesajlarından görev oluşturmayı destekler (URL verification dahil)
- Bildirimler: `POST /api/slack/task-created`, `POST /api/slack/task-updated` – görev oluşturma/güncelleme sonrası kanala mesaj
- Proje kanalı eşlemesi: `projects.slack_channel_id` alanı üzerinden kanal yönlendirme; yoksa `SLACK_DEFAULT_CHANNEL`

## 🔔 Anlık Bildirimler

- In‑app bildirimler için `notifications` tablosu (RLS ile)
- Realtime abonelik ile Navbar'da bildirim çanı ve okunmamış sayacı
- Mention (`@kullanıcı`) yorumlarında hem in‑app bildirim hem isteğe bağlı Slack DM ping

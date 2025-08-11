# YAP Kurulum Kılavuzu (Aşırı Detaylı)

Bu doküman, projeyi sıfırdan çalışır hale getirmeniz için adım adım talimatlar sunar. Hiç deneyimi olmayan biri bile takip ederek kurulum yapabilsin diye "Bilal'e anlatır gibi" hazırlanmıştır.

---

## 0) Önkoşullar ve Gerekenler

Aşağıdakilerin bilgisayarınızda kurulu olduğundan emin olun:

- Node.js 18+ (öneri: 20)
- Git
- Bir terminal (macOS için Terminal/iTerm; Windows için PowerShell)
- psql (PostgreSQL CLI) – Supabase bağlantısı veya başka Postgres'e bağlanmak için
- Bir Supabase hesabı (ücretsiz plan yeterli)
- (Opsiyonel) Slack Workspace ve Slack App oluşturma yetkisi

Kontrol komutları:

```bash
node -v
npm -v
git --version
psql --version
```

---

## 1) Depoyu Klonla ve Bağımlılıkları Yükle

```bash
git clone https://github.com/KaygusuzBK/yap-next.git
cd yap-next
npm install
```

---

## 2) Supabase Projesi Oluştur (Veritabanı + Auth)

1. `https://supabase.com` adresinden giriş yapın ve yeni proje oluşturun.
2. Proje oluşturulduktan sonra Dashboard'da:
   - Project Settings → API sekmesinden:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
   - Project Settings → Database sekmesinden:
     - `Connection string` (URI) → `DATABASE_URL` olarak kullanacağız.

Örnek `DATABASE_URL`:

```
postgres://postgres:YOUR-PASSWORD@YOUR-HOST:5432/postgres
```

Notlar:
- `service_role` sadece sunucu tarafında kullanılmalı, asla istemciye sızdırmayın.
- `DATABASE_URL` psql ve scriptler için gereklidir.

---

## 3) Ortam Değişkenlerini (.env.local) Doldur

Proje kökünde `.env.local` dosyası oluşturun ve aşağıdaki şablonu doldurun:

```env
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (server/admin) – güvenilir işlemler için
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DB bağlantısı (psql/scriptler için)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Slack (opsiyonel ama önerilir)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
# Proje kanalı tanımlı değilse kullanılacak varsayılan kanal
SLACK_DEFAULT_CHANNEL=C0123456789

# Slack üzerinden açılan görevlerde created_by olarak kullanılacak
SUPABASE_AUTOMATION_USER_ID=00000000-0000-0000-0000-000000000000
```

Açıklamalar:
- `NEXT_PUBLIC_*` anahtarları tarayıcı tarafından da görülebilir. Gizli bilgiler burada olmamalı.
- `SUPABASE_SERVICE_ROLE_KEY` kesinlikle sadece server-side kodda kullanılmalı (proje bu kurala uyuyor).
- `SLACK_DEFAULT_CHANNEL` kanal ID'sidir (isim değil). Kanal ID'sini öğrenmek için Slack'te kanal adının yanındaki "i" → About → Channel ID.

---

## 4) Veritabanı Şemasını Uygula

İki yöntem var. Kolay olanı script ile, alternatif olarak psql/SQL Editor ile.

### Yöntem A: Script (önerilen)

```bash
# Script’e çalıştırma izni yoksa verin
chmod +x ./sql/apply.sh

# Temel şemayı uygula
./sql/apply.sh

# Güncellemeler (gerekiyorsa sırayla uygula)
psql "$DATABASE_URL" -f sql/updates/017-consolidated-rls-and-triggers.sql
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
```

### Yöntem B: Supabase SQL Editor / psql

- Supabase Dashboard → SQL Editor'e girip dosyaları sırayla çalıştırın.
- Veya terminalden `psql` ile:

```bash
psql "$DATABASE_URL" -f sql/00-initial-setup.sql
psql "$DATABASE_URL" -f sql/00_functions.sql
psql "$DATABASE_URL" -f sql/01_tables.sql
psql "$DATABASE_URL" -f sql/02_rls.sql
psql "$DATABASE_URL" -f sql/04_teams.sql
psql "$DATABASE_URL" -f sql/05_projects.sql
psql "$DATABASE_URL" -f sql/06_tasks_complete.sql
psql "$DATABASE_URL" -f sql/10_task_management_complete.sql
# Updates
psql "$DATABASE_URL" -f sql/updates/017-consolidated-rls-and-triggers.sql
psql "$DATABASE_URL" -f sql/updates/016-project-slack-channel.sql
psql "$DATABASE_URL" -f sql/updates/018-notifications.sql
```

---

## 5) Uygulamayı Başlat

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

---

## 6) İlk Giriş ve Auth Ayarları

- Supabase Auth ile e‑mail/magic link girişini kullanabilirsiniz.
- Giriş ekranında e‑mail girildiğinde "Magic Link Gönder" butonu da görünür.
- Şifre ile giriş de desteklenir (Supabase Auth → Authentication → Providers → Email ayarlarını kontrol edin).

---

## 7) Slack Entegrasyonu (Opsiyonel ama önerilir)

Amaçlar:
- Slash Command ile görev açma: `POST /api/slack/commands`
- Event Subscriptions ile kanaldan mesaj → görev açma: `POST /api/slack/events`
- Görev oluşturma/güncelleme bildirimleri: `POST /api/slack/task-created`, `POST /api/slack/task-updated`

### 7.1 Slack App Oluşturma
1. `https://api.slack.com/apps` → Create New App
2. OAuth & Permissions → Scopes:
   - Bot Token Scopes: `chat:write`, `channels:read`, `groups:read`, `channels:join`
3. Install App to Workspace → Bot kullanıcıyı workspace’e kurun.

### 7.2 Slash Command
- Commands → Create New Command
  - Command: `/yap`
  - Request URL (Production): `https://<sizin-domaininiz>/api/slack/commands`
  - Geliştirme için public URL gerekir (ör. Vercel preview). Slack yerelden `http://localhost` kabul etmez.
  - Short Description / Usage Hint: İsteğe bağlı

### 7.3 Event Subscriptions
- Event Subscriptions → Enable Events
  - Request URL: `https://<sizin-domaininiz>/api/slack/events`
  - Slack ilk kayıtta URL doğrulaması için `challenge` gönderir; route bunu destekler.
  - Bot Events: Örn. `message.channels`

### 7.4 Kanal Erişimi
- Bot'u bildirim göndereceğiniz kanala davet edin.
- `SLACK_DEFAULT_CHANNEL` veya proje özelinde `projects.slack_channel_id` kullanılır.
- Bot kanalda değilse public kanallarda otomatik katılmayı deneme ve tekrar gönderme lojikleri mevcuttur.

### 7.5 Test
- Slash Command örneği: `/yap <proje-uuid> | Başlık | öncelik:high | bitiş:2025-02-01`
- Yanıt/Log’larda hata görürseniz Vercel Logs veya route loglarını kontrol edin.

---

## 8) Anlık Bildirimler (In‑App + Mention)

- `sql/updates/018-notifications.sql` ile `notifications` tablosu oluşturulur ve RLS uygulanır.
- Uygulama, Navbar’daki zil simgesiyle okunmamış sayısını gösterir.
- Yorumlarda `@kullanıcı` mention geçerse in‑app bildirim yaratılır; istenirse Slack DM ping de atılabilir.

---

## 9) Sorun Giderme (Troubleshooting)

### 9.1 ENV Yüklenmedi
- `.env.local` dosyasını oluşturduğunuzdan emin olun.
- `npm run dev` yeniden başlatın.

### 9.2 RLS Hataları
```bash
./sql/fix-rls.sh
```

### 9.3 Veritabanına Bağlanamıyor
- `echo $DATABASE_URL` ile değeri kontrol edin.
- Supabase Dashboard → Project Settings → Database → Connection string.

### 9.4 Slack Mesaj Gitmiyor
- `SLACK_BOT_TOKEN` ve `SLACK_SIGNING_SECRET` doğru mu?
- Bot gerekli kanalda mı? Değilse davet edin.
- OAuth Scopes eksik mi? (`chat:write`, `channels:read`, `groups:read`, `channels:join`)
- Request URL’ler doğru domaini gösteriyor mu (özellikle prod’da)?
- App route'ları Node.js runtime ile çalışıyor (projede ayarlı).

### 9.5 Script Çalışmıyor (İzin)
```bash
chmod +x ./sql/apply.sh
```

### 9.6 Build/Lint Hataları
```bash
npm run build
npm run lint
```

---

## 10) Production Deploy (Vercel)

1. Repository’yi Vercel’e bağlayın.
2. Environment Variables kısmına şunları ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
   - `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_DEFAULT_CHANNEL`
   - `SUPABASE_AUTOMATION_USER_ID`
3. Deploy edin.
4. Slack tarafında Request URL’leri prod domain ile güncelleyin.
5. Gerekirse `psql` ile updates SQL’lerini prod veritabanına uygulayın.

---

## 11) SSS (Sıkça Sorulan Sorular)

- S: Yerelde Slack test edebilir miyim?
  - C: Slack public URL ister. Vercel preview URL’si ile test edebilirsiniz. Tünel aracı (ngrok) da alternatif ama zorunlu değil.
- S: Proje kanalı nasıl eşleştiriliyor?
  - C: `projects.slack_channel_id` alanı ile. Boşsa `SLACK_DEFAULT_CHANNEL` kullanılır.
- S: Demo modu var mı?
  - C: Evet, giriş yapılmadığında sidebar demo içerik gösterir; aksiyonlar devre dışıdır.

---

Herhangi bir adımda takılırsanız, lütfen ilgili hatayı/ekran görüntüsünü paylaşın. Yardımcı olalım.



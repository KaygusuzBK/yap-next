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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
```

### 4. Veritabanı Kurulumu
```bash
# SQL dosyalarını uygulayın
./sql/apply.sh
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

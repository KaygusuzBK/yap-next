# Supabase Kurulum Rehberi

Bu rehber, projenizde Supabase ile authentication sistemini nasıl kuracağınızı açıklar.

## 1. Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adını ve şifresini belirleyin
4. Bölge seçin (örn: West Europe)
5. "Create new project" butonuna tıklayın

## 2. Environment Değişkenlerini Ayarlama

Proje oluşturulduktan sonra:

1. Supabase Dashboard'da projenize gidin
2. Settings > API bölümüne gidin
3. `Project URL` ve `anon public` key'i kopyalayın
4. Proje kök dizininde `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Authentication Ayarları

### Email Doğrulama
1. Authentication > Settings bölümüne gidin
2. "Enable email confirmations" seçeneğini aktif edin
3. "Confirm email template" özelleştirin (isteğe bağlı)

### Şifre Sıfırlama
1. Authentication > Settings bölümünde
2. "Enable password reset" seçeneğini aktif edin
3. "Reset password template" özelleştirin (isteğe bağlı)

### Redirect URLs
1. Authentication > URL Configuration bölümüne gidin
2. Site URL: `http://localhost:3000` (development için)
3. Redirect URLs'e şunları ekleyin:
   - `http://localhost:3000/reset-password`
   - `http://localhost:3000/verify-email`
   - `http://localhost:3000/dashboard`

## 4. Database Tabloları

Projenizde zaten SQL dosyaları mevcut. Bunları Supabase'de çalıştırın:

1. SQL Editor'a gidin
2. `sql/01-extensions.sql` dosyasını çalıştırın
3. `sql/02-tables.sql` dosyasını çalıştırın
4. `sql/03-indexes.sql` dosyasını çalıştırın
5. `sql/04-rls-policies.sql` dosyasını çalıştırın
6. `sql/05-functions.sql` dosyasını çalıştırın
7. `sql/06-views.sql` dosyasını çalıştırın
8. `sql/07-sample-data.sql` dosyasını çalıştırın (isteğe bağlı)

## 5. Row Level Security (RLS) Politikaları

RLS politikaları zaten SQL dosyalarında tanımlanmış. Bu politikalar:

- Kullanıcılar sadece kendi verilerini görebilir
- Proje sahipleri kendi projelerini yönetebilir
- Task atanan kişiler task'ları görebilir

## 6. Test Etme

### Kullanıcı Kaydı
1. `/register` sayfasına gidin
2. Yeni kullanıcı oluşturun
3. E-posta doğrulama mesajını kontrol edin
4. E-posta doğrulama linkine tıklayın

### Giriş
1. `/login` sayfasına gidin
2. Kayıtlı kullanıcı ile giriş yapın
3. Dashboard'a yönlendirildiğinizi kontrol edin

### Şifre Sıfırlama
1. `/forgot-password` sayfasına gidin
2. E-posta adresinizi girin
3. Şifre sıfırlama e-postasını kontrol edin
4. Linke tıklayarak yeni şifre belirleyin

## 7. Production Ayarları

Production'a geçerken:

1. Environment değişkenlerini production URL'leri ile güncelleyin
2. Supabase'de production redirect URL'lerini ekleyin
3. Email template'lerini production için özelleştirin
4. RLS politikalarını gözden geçirin

## 8. Güvenlik Notları

- `.env.local` dosyasını git'e commit etmeyin
- Production'da güçlü şifreler kullanın
- RLS politikalarını düzenli olarak gözden geçirin
- Supabase dashboard'da log'ları takip edin

## 9. Sorun Giderme

### Yaygın Hatalar

1. **"Invalid login credentials"**
   - E-posta doğrulaması yapılmış mı kontrol edin
   - Şifrenin doğru olduğundan emin olun

2. **"User already registered"**
   - Kullanıcı zaten mevcut, giriş yapmayı deneyin

3. **"Email not confirmed"**
   - E-posta doğrulama linkine tıklayın
   - Spam klasörünü kontrol edin

4. **Redirect URL hatası**
   - Supabase'de redirect URL'leri doğru ayarlandığından emin olun

### Destek

Sorun yaşarsanız:
1. Supabase Dashboard'da log'ları kontrol edin
2. Browser console'da hata mesajlarını kontrol edin
3. Network tab'ında API çağrılarını inceleyin 
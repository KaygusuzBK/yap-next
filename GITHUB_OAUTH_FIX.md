# 🔐 GitHub OAuth Sorunu Çözüm Rehberi

## Sorun
GitHub ile giriş yaparken şu hatayı alıyorsunuz:
```
Be careful!
The redirect_uri is not associated with this application.
The application might be misconfigured or could be trying to redirect you to a website you weren't expecting.
```

## Sorunun Nedeni
Projenizde **iki farklı GitHub OAuth akışı** var ve bunlar farklı redirect URI'lar kullanıyor:

1. **Supabase Auth akışı**: `window.location.origin/dashboard` kullanıyor
2. **Manuel GitHub OAuth**: `NEXT_PUBLIC_APP_URL/api/auth/github/callback` kullanıyor

## Çözüm Adımları

### 1. Environment Değişkenlerini Kontrol Edin

`.env.local` dosyanızda şu değişkenlerin doğru olduğundan emin olun:

```bash
# Temel URL ayarları (Vercel'den alınan bilgiler)
NEXT_PUBLIC_APP_URL=https://yap-next.vercel.app
NEXT_PUBLIC_SITE_URL=https://yap-next.vercel.app

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 2. Supabase Dashboard'da Site URL'i Güncelleyin

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. **Authentication** → **URL Configuration** bölümüne gidin
3. **Site URL** kısmını production domain'inizle güncelleyin:
   ```
   https://yap-next.vercel.app
   ```
4. **Redirect URLs** listesine şu URL'leri ekleyin:
   ```
   https://yap-next.vercel.app/dashboard
   https://yap-next.vercel.app/dashboard/integrations
   ```

### 3. GitHub OAuth App Ayarlarını Güncelleyin

1. [GitHub Settings](https://github.com/settings/applications) → **Developer settings** → **OAuth Apps**
2. Uygulamanızı seçin
3. **Authorization callback URL** kısmını güncelleyin:
   ```
   https://yap-next.vercel.app/dashboard
   ```
4. **Homepage URL** kısmını da güncelleyin:
   ```
   https://yap-next.vercel.app
   ```

### 4. OAuth Akışını Kontrol Edin

Projenizde hangi OAuth akışının kullanıldığını kontrol edin:

**Login sayfasında** (`src/app/login/page.tsx`):
- `OAuthButtons` komponenti kullanılıyor
- Bu komponent Supabase Auth kullanıyor
- Redirect: `window.location.origin/dashboard`

**Entegrasyonlar sayfasında** (`src/app/dashboard/integrations/page.tsx`):
- Manuel GitHub OAuth kullanılıyor
- Redirect: `NEXT_PUBLIC_SITE_URL/dashboard/integrations`

### 5. Test Edin

1. Environment değişkenlerini güncelledikten sonra uygulamayı yeniden başlatın:
   ```bash
   npm run dev
   ```

2. GitHub ile giriş yapmayı deneyin

3. Eğer hala sorun varsa, browser'ın Developer Tools'unda Network sekmesini açın ve OAuth akışını takip edin

## Alternatif Çözümler

### Çözüm A: Sadece Supabase Auth Kullanın
Tüm OAuth işlemlerini Supabase Auth üzerinden yapın:

```typescript
// src/features/auth/components/OAuthButtons.tsx
const signInWith = async (provider: 'github' | 'google') => {
  const supabase = getSupabase();
  await supabase.auth.signInWithOAuth({
    provider,
    options: { 
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` 
    },
  });
};
```

### Çözüm B: Manuel OAuth'u Kaldırın
Eğer sadece Supabase Auth kullanmak istiyorsanız, manuel OAuth route'larını kaldırabilirsiniz:

- `src/app/api/auth/github/route.ts`
- `src/app/api/auth/github/callback/route.ts`
- `src/lib/integrations/github.ts` (getGitHubOAuthURL fonksiyonu)

## Önemli Notlar

1. **Production'da HTTPS kullanın**: GitHub OAuth production'da HTTPS gerektirir
2. **URL'leri tutarlı tutun**: `NEXT_PUBLIC_APP_URL` ve `NEXT_PUBLIC_SITE_URL` aynı olmalı
3. **Environment değişkenlerini kontrol edin**: `.env.local` dosyasının doğru yerde olduğundan emin olun
4. **Cache'i temizleyin**: Browser cache'ini temizleyin veya incognito mode kullanın

## Debug İpuçları

1. **Console'da hata kontrolü**: Browser Developer Tools'da console hatalarını kontrol edin
2. **Network sekmesi**: OAuth akışında hangi URL'lerin çağrıldığını görün
3. **Environment değişkenleri**: `console.log(process.env.NEXT_PUBLIC_APP_URL)` ile değerleri kontrol edin

## Sonuç

Bu adımları takip ettikten sonra GitHub OAuth sorununuz çözülmüş olmalı. Eğer hala sorun yaşıyorsanız, hangi domain'i kullandığınızı ve hangi adımda takıldığınızı belirtin, daha spesifik yardım edebilirim.

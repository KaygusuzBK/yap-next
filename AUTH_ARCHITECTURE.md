# Auth Architecture - Modüler Yapı

Bu dokümantasyon, projenin modüler authentication sistemini açıklar.

## 📁 Klasör Yapısı

```
src/lib/services/auth/
├── index.ts                 # Ana export dosyası
├── authService.ts           # Ana auth service
├── factory.ts              # Provider factory
├── store.ts                # Zustand store
├── api.ts                  # Eski API (deprecated)
└── providers/              # Auth provider'ları
    ├── index.ts            # Provider exports
    ├── email.ts            # Email/Password auth
    ├── google.ts           # Google OAuth
    ├── github.ts           # GitHub OAuth
    └── microsoft.ts        # Microsoft OAuth
```

## 🔧 Provider Sistemi

### Email Provider
- **Dosya**: `providers/email.ts`
- **Sınıf**: `EmailAuthProvider`
- **Özellikler**:
  - Email/Password ile giriş
  - Email/Password ile kayıt
  - Şifre sıfırlama
  - Email doğrulama
  - Şifre değiştirme

### Google OAuth Provider
- **Dosya**: `providers/google.ts`
- **Sınıf**: `GoogleAuthProvider`
- **Özellikler**:
  - Google ile OAuth girişi
  - Otomatik kullanıcı oluşturma
  - Google profil bilgilerini alma

### GitHub OAuth Provider
- **Dosya**: `providers/github.ts`
- **Sınıf**: `GitHubAuthProvider`
- **Özellikler**:
  - GitHub ile OAuth girişi
  - GitHub profil bilgilerini alma
  - Repository erişimi (opsiyonel)

### Microsoft OAuth Provider
- **Dosya**: `providers/microsoft.ts`
- **Sınıf**: `MicrosoftAuthProvider`
- **Özellikler**:
  - Microsoft ile OAuth girişi
  - Azure AD entegrasyonu
  - Microsoft profil bilgilerini alma

## 🏭 Factory Pattern

### AuthFactory
- **Dosya**: `factory.ts`
- **Amaç**: Provider instance'larını yönetmek
- **Özellikler**:
  - Singleton provider instance'ları
  - Lazy loading
  - Provider cache'leme

```typescript
// Provider alma
const emailProvider = AuthFactory.getProvider('email');
const googleProvider = AuthFactory.getProvider('google');

// Mevcut provider'ları listeleme
const providers = AuthFactory.getAvailableProviders();
```

## 🔄 Auth Service

### Ana Service
- **Dosya**: `authService.ts`
- **Sınıf**: `AuthService`
- **Amaç**: Tüm auth işlemlerini yönetmek

```typescript
// Email ile giriş
await authService.loginWithEmail(credentials);

// OAuth ile giriş
await authService.loginWithOAuth('google');

// OAuth callback işleme
await authService.handleOAuthCallback('google');
```

## 📊 Store (Zustand)

### Auth Store
- **Dosya**: `store.ts`
- **Amaç**: Global auth state yönetimi

```typescript
const { 
  user, 
  isAuthenticated, 
  loading, 
  login, 
  loginWithOAuth,
  logout 
} = useAuthStore();
```

## 🎯 Kullanım Örnekleri

### 1. Email ile Giriş

```typescript
import { useAuthStore } from '@/lib/services/auth';

const { login } = useAuthStore();

const handleLogin = async (credentials) => {
  try {
    await login(credentials);
    // Başarılı giriş
  } catch (error) {
    // Hata yönetimi
  }
};
```

### 2. OAuth ile Giriş

```typescript
import { useAuthStore } from '@/lib/services/auth';

const { loginWithOAuth } = useAuthStore();

const handleGoogleLogin = async () => {
  try {
    await loginWithOAuth('google');
    // Kullanıcı Google'a yönlendirilecek
  } catch (error) {
    // Hata yönetimi
  }
};
```

### 3. OAuth Butonları

```typescript
import { OAuthButtons } from '@/components/forms/OAuthButtons';

<OAuthButtons 
  onSuccess={() => console.log('OAuth başarılı')}
  onError={(error) => console.error('OAuth hatası:', error)}
/>
```

## 🔐 OAuth Kurulumu

### Google OAuth
1. Google Cloud Console'da proje oluşturun
2. OAuth 2.0 client ID oluşturun
3. Supabase'de Google provider'ı aktif edin
4. Client ID ve Secret'ı Supabase'e ekleyin

### GitHub OAuth
1. GitHub'da OAuth App oluşturun
2. Client ID ve Secret alın
3. Supabase'de GitHub provider'ı aktif edin
4. Redirect URL'leri ayarlayın

### Microsoft OAuth
1. Azure Portal'da App Registration oluşturun
2. Client ID ve Secret alın
3. Supabase'de Microsoft provider'ı aktif edin
4. Redirect URL'leri ayarlayın

## 🚀 Yeni Provider Ekleme

### 1. Provider Sınıfı Oluşturma

```typescript
// providers/facebook.ts
export class FacebookAuthProvider {
  async signIn(): Promise<LoginResponse> {
    // Facebook OAuth implementasyonu
  }

  async handleCallback(): Promise<LoginResponse> {
    // Facebook callback işleme
  }

  async signOut(): Promise<{ message: string }> {
    // Facebook çıkış
  }
}
```

### 2. Factory'e Ekleme

```typescript
// factory.ts
case 'facebook':
  provider = new FacebookAuthProvider();
  break;
```

### 3. Type'lara Ekleme

```typescript
// providers/index.ts
export type AuthProviderType = 'email' | 'google' | 'github' | 'microsoft' | 'facebook';
```

### 4. Service'e Ekleme

```typescript
// authService.ts
async loginWithOAuth(provider: 'google' | 'github' | 'microsoft' | 'facebook')
```

## 🔧 Konfigürasyon

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (opsiyonel)
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

### Supabase Settings

1. **Authentication > Providers** bölümünde provider'ları aktif edin
2. **Redirect URLs** ayarlayın:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

## 🧪 Test Etme

### Email Auth Test
```bash
# Login form test
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### OAuth Test
1. OAuth butonuna tıklayın
2. Provider'a yönlendirildiğinizi kontrol edin
3. Callback sayfasında başarılı giriş yapıldığını kontrol edin

## 🔍 Debug

### Console Log'ları
```typescript
// Provider debug
console.log('Provider:', AuthFactory.getProvider('google'));

// Auth state debug
console.log('Auth state:', useAuthStore.getState());
```

### Network Tab
- OAuth redirect'leri kontrol edin
- Callback URL'lerini inceleyin
- Session token'larını kontrol edin

## 📝 Notlar

1. **Provider Isolation**: Her provider bağımsız çalışır
2. **Error Handling**: Her provider kendi hata mesajlarını yönetir
3. **Type Safety**: TypeScript ile tam tip güvenliği
4. **Extensibility**: Yeni provider'lar kolayca eklenebilir
5. **Maintainability**: Modüler yapı sayesinde kolay bakım 
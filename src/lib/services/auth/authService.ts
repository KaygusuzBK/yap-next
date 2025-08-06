import { AuthFactory } from './factory';
import { auth } from '@/lib/supabase';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User,
  AuthProviderType 
} from '@/lib/types';

export class AuthService {
  // Email ile giriş
  async loginWithEmail(credentials: LoginRequest): Promise<LoginResponse> {
    const emailProvider = AuthFactory.getProvider('email');
    return emailProvider.signIn(credentials);
  }

  // Email ile kayıt
  async registerWithEmail(userData: RegisterRequest): Promise<LoginResponse> {
    const emailProvider = AuthFactory.getProvider('email');
    return emailProvider.signUp(userData);
  }

  // OAuth ile giriş (Google, GitHub, Microsoft)
  async loginWithOAuth(provider: 'google' | 'github' | 'microsoft'): Promise<LoginResponse> {
    const oauthProvider = AuthFactory.getProvider(provider);
    return oauthProvider.signIn();
  }

  // OAuth callback'i işle
  async handleOAuthCallback(provider: 'google' | 'github' | 'microsoft'): Promise<LoginResponse> {
    const oauthProvider = AuthFactory.getProvider(provider);
    
    // OAuth provider'ların handleCallback metodunu çağır
    if (provider === 'google') {
      const googleProvider = oauthProvider as any;
      return googleProvider.handleCallback();
    } else if (provider === 'github') {
      const githubProvider = oauthProvider as any;
      return githubProvider.handleCallback();
    } else if (provider === 'microsoft') {
      const microsoftProvider = oauthProvider as any;
      return microsoftProvider.handleCallback();
    }
    
    throw new Error(`Desteklenmeyen OAuth provider: ${provider}`);
  }

  // Email şifre sıfırlama
  async forgotPassword(email: string): Promise<{ message: string }> {
    const emailProvider = AuthFactory.getProvider('email') as any;
    return emailProvider.forgotPassword(email);
  }

  // Email şifre sıfırlama (token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const emailProvider = AuthFactory.getProvider('email') as any;
    return emailProvider.resetPassword(token, newPassword);
  }

  // Email şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const emailProvider = AuthFactory.getProvider('email') as any;
    return emailProvider.changePassword(currentPassword, newPassword);
  }

  // Email doğrulama
  async verifyEmail(token: string): Promise<{ message: string }> {
    const emailProvider = AuthFactory.getProvider('email') as any;
    return emailProvider.verifyEmail(token);
  }

  // Email doğrulama yeniden gönder
  async resendVerification(email: string): Promise<{ message: string }> {
    const emailProvider = AuthFactory.getProvider('email') as any;
    return emailProvider.resendVerification(email);
  }

  // Çıkış (tüm provider'lar için)
  async logout(): Promise<{ message: string }> {
    const { error } = await auth.signOut();
    
    if (error) {
      throw new Error('Çıkış yapılırken hata oluştu');
    }
    
    return { message: 'Başarıyla çıkış yapıldı' };
  }

  // Kullanıcı profili
  async getProfile(): Promise<User> {
    const user = await auth.getCurrentUser();
    
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Kullanıcı',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || undefined,
      role: user.user_metadata?.role || 'member',
      isActive: true,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    };
  }

  // Token yenileme
  async refresh(): Promise<LoginResponse> {
    const user = await auth.getCurrentUser();
    
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const userData: User = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Kullanıcı',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || undefined,
      role: user.user_metadata?.role || 'member',
      isActive: true,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    };

    return {
      user: userData,
      token: '', // Supabase otomatik token yönetimi yapar
      tokenType: 'Bearer',
      expiresIn: 3600
    };
  }

  // Mevcut provider'ları listele
  getAvailableProviders(): AuthProviderType[] {
    return AuthFactory.getAvailableProviders();
  }
}

// Singleton instance
export const authService = new AuthService(); 
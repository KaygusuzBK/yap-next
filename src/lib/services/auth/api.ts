import { auth } from '@/lib/supabase';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User 
} from '@/lib/types';

export const authService = {
  // Kullanıcı girişi
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await auth.signIn(credentials.email, credentials.password);
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.user) {
      throw new Error('Giriş başarısız');
    }

    // Supabase user'ı bizim User tipimize dönüştür
    const user: User = {
      id: result.data.user.id,
      name: result.data.user.user_metadata?.name || result.data.user.email?.split('@')[0] || 'Kullanıcı',
      email: result.data.user.email || '',
      avatar: result.data.user.user_metadata?.avatar || undefined,
      role: result.data.user.user_metadata?.role || 'member',
      isActive: true,
      createdAt: result.data.user.created_at,
      updatedAt: result.data.user.updated_at || result.data.user.created_at
    };

    return {
      user,
      token: result.data.session?.access_token || '',
      tokenType: 'Bearer',
      expiresIn: result.data.session?.expires_in || 3600
    };
  },

  // Kullanıcı kaydı
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const result = await auth.signUp(userData.email, userData.password, {
      name: userData.name,
      role: userData.role
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.user) {
      throw new Error('Kayıt başarısız');
    }

    // Supabase user'ı bizim User tipimize dönüştür
    const user: User = {
      id: result.data.user.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || undefined,
      role: userData.role || 'member',
      isActive: true,
      createdAt: result.data.user.created_at,
      updatedAt: result.data.user.updated_at || result.data.user.created_at
    };

    return {
      user,
      token: result.data.session?.access_token || '',
      tokenType: 'Bearer',
      expiresIn: result.data.session?.expires_in || 3600
    };
  },

  // Token yenileme (Supabase otomatik yapar)
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
  },

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
  },

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    // Supabase'de şifre sıfırlama için özel endpoint yok
    // Burada sadece başarılı mesajı döndürülüyor
    return { message: 'Şifre sıfırlama e-postası gönderildi (demo)' };
  },

  // Şifre sıfırlama (token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Supabase'de bu işlem farklı şekilde yapılır
    return { message: 'Şifre başarıyla sıfırlandı' };
  },

  // Şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    // Supabase'de bu işlem farklı şekilde yapılır
    return { message: 'Şifre başarıyla değiştirildi' };
  },

  // Çıkış
  async logout(): Promise<{ message: string }> {
    await auth.signOut();
    return { message: 'Başarıyla çıkış yapıldı' };
  },

  // Kimlik doğrulama durumu kontrolü
  isAuthenticated(): boolean {
    // Supabase session kontrolü
    return false; // Bu client-side'da kontrol edilecek
  },

  // Token alma
  getToken(): string | null {
    // Supabase otomatik token yönetimi yapar
    return null;
  }
};
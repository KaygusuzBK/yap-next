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
      // Türkçe hata mesajları
      let errorMessage = 'Giriş başarısız';
      
      if (result.error.message.includes('Invalid login credentials')) {
        errorMessage = 'E-posta veya şifre hatalı';
      } else if (result.error.message.includes('Email not confirmed')) {
        errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor';
      } else if (result.error.message.includes('Too many requests')) {
        errorMessage = 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin';
      }
      
      throw new Error(errorMessage);
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
      let errorMessage = 'Kayıt başarısız';
      
      if (result.error.message.includes('User already registered')) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı';
      } else if (result.error.message.includes('Password should be at least')) {
        errorMessage = 'Şifre en az 6 karakter olmalıdır';
      } else if (result.error.message.includes('Invalid email')) {
        errorMessage = 'Geçersiz e-posta adresi';
      }
      
      throw new Error(errorMessage);
    }

    if (!result.data?.user) {
      throw new Error('Kayıt başarısız');
    }

    // Eğer email doğrulama gerekliyse
    if (!result.data.session) {
      throw new Error('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.');
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

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { error } = await auth.resetPassword(email);
    
    if (error) {
      let errorMessage = 'Şifre sıfırlama başarısız';
      
      if (error.message.includes('User not found')) {
        errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı';
      }
      
      throw new Error(errorMessage);
    }
    
    return { message: 'Şifre sıfırlama e-postası gönderildi' };
  },

  // Şifre sıfırlama (token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { error } = await auth.updatePassword(newPassword);
    
    if (error) {
      throw new Error('Şifre sıfırlama başarısız');
    }
    
    return { message: 'Şifre başarıyla sıfırlandı' };
  },

  // Şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    // Önce mevcut şifreyi doğrula
    const user = await auth.getCurrentUser();
    if (!user?.email) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Mevcut şifreyi doğrula
    const { error: signInError } = await auth.signIn(user.email, currentPassword);
    if (signInError) {
      throw new Error('Mevcut şifre hatalı');
    }

    // Şifreyi güncelle
    const { error } = await auth.updatePassword(newPassword);
    if (error) {
      throw new Error('Şifre güncellenemedi');
    }

    return { message: 'Şifre başarıyla değiştirildi' };
  },

  // Email doğrulama
  async verifyEmail(token: string): Promise<{ message: string }> {
    const { error } = await auth.verifyOtp(token);
    
    if (error) {
      throw new Error('E-posta doğrulama başarısız');
    }
    
    return { message: 'E-posta başarıyla doğrulandı' };
  },

  // Email doğrulama yeniden gönder
  async resendVerification(email: string): Promise<{ message: string }> {
    const { error } = await auth.resendVerification(email);
    
    if (error) {
      throw new Error('Doğrulama e-postası gönderilemedi');
    }
    
    return { message: 'Doğrulama e-postası yeniden gönderildi' };
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
import { auth } from '@/lib/supabase';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User 
} from '@/lib/types';

export class EmailAuthProvider {
  // Email/Password ile giriş
  async signIn(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Login attempt for:', credentials.email);
      
      const result = await auth.signIn(credentials.email, credentials.password);
      
      if (result.error) {
        console.error('❌ Login error:', result.error);
        
        // Türkçe hata mesajları
        let errorMessage = 'Giriş başarısız';
        
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-posta veya şifre hatalı';
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor';
        } else if (result.error.message.includes('Too many requests')) {
          errorMessage = 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin';
        } else if (result.error.message.includes('Unable to validate email address')) {
          errorMessage = 'Geçersiz e-posta adresi';
        } else {
          errorMessage = result.error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!result.data?.user) {
        console.error('❌ No user data returned');
        throw new Error('Giriş başarısız - kullanıcı bilgisi alınamadı');
      }

      console.log('✅ Login successful for:', result.data.user.email);

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
    } catch (error) {
      console.error('❌ EmailAuthProvider signIn error:', error);
      throw error;
    }
  }

  // Email/Password ile kayıt
  async signUp(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      console.log('📝 Register attempt for:', userData.email);
      
      const result = await auth.signUp(userData.email, userData.password, {
        name: userData.name,
        role: userData.role
      });
      
      if (result.error) {
        console.error('❌ Register error:', result.error);
        
        let errorMessage = 'Kayıt başarısız';
        
        if (result.error.message.includes('User already registered')) {
          errorMessage = 'Bu e-posta adresi zaten kayıtlı';
        } else if (result.error.message.includes('Password should be at least')) {
          errorMessage = 'Şifre en az 6 karakter olmalıdır';
        } else if (result.error.message.includes('Invalid email')) {
          errorMessage = 'Geçersiz e-posta adresi';
        } else {
          errorMessage = result.error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!result.data?.user) {
        console.error('❌ No user data returned from registration');
        throw new Error('Kayıt başarısız - kullanıcı oluşturulamadı');
      }

      console.log('✅ Registration successful for:', result.data.user.email);

      // Eğer email doğrulama gerekliyse
      if (!result.data.session) {
        console.log('📧 Email confirmation required');
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
    } catch (error) {
      console.error('❌ EmailAuthProvider signUp error:', error);
      throw error;
    }
  }

  // Şifre sıfırlama isteği
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      console.log('🔑 Forgot password request for:', email);
      
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        console.error('❌ Forgot password error:', error);
        
        let errorMessage = 'Şifre sıfırlama başarısız';
        
        if (error.message.includes('User not found')) {
          errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı';
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ Forgot password email sent');
      return { message: 'Şifre sıfırlama e-postası gönderildi' };
    } catch (error) {
      console.error('❌ EmailAuthProvider forgotPassword error:', error);
      throw error;
    }
  }

  // Şifre sıfırlama (token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      console.log('🔑 Reset password attempt');
      
      const { error } = await auth.updatePassword(newPassword);
      
      if (error) {
        console.error('❌ Reset password error:', error);
        throw new Error('Şifre sıfırlama başarısız');
      }
      
      console.log('✅ Password reset successful');
      return { message: 'Şifre başarıyla sıfırlandı' };
    } catch (error) {
      console.error('❌ EmailAuthProvider resetPassword error:', error);
      throw error;
    }
  }

  // Şifre değiştirme
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Önce mevcut şifreyi doğrula
      const { data: { user } } = await auth.getCurrentUser();
      if (!user?.email) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Mevcut şifreyi doğrula
      const { error: signInError } = await auth.signIn(user.email, currentPassword);
      if (signInError) {
        throw new Error('Mevcut şifre hatalı');
      }

      // Yeni şifreyi ayarla
      const { error } = await auth.updatePassword(newPassword);
      if (error) {
        throw new Error('Şifre değiştirme başarısız');
      }

      return { message: 'Şifre başarıyla değiştirildi' };
    } catch (error) {
      console.error('❌ EmailAuthProvider changePassword error:', error);
      throw error;
    }
  }

  // Email doğrulama
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      console.log('📧 Email verification attempt');
      
      const { error } = await auth.verifyOtp(token);
      
      if (error) {
        console.error('❌ Email verification error:', error);
        throw new Error('E-posta doğrulama başarısız');
      }
      
      console.log('✅ Email verification successful');
      return { message: 'E-posta başarıyla doğrulandı' };
    } catch (error) {
      console.error('❌ EmailAuthProvider verifyEmail error:', error);
      throw error;
    }
  }

  // Email doğrulama yeniden gönder
  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      console.log('📧 Resend verification email for:', email);
      
      const { error } = await auth.resendVerification(email);
      
      if (error) {
        console.error('❌ Resend verification error:', error);
        throw new Error('Doğrulama e-postası gönderilemedi');
      }
      
      console.log('✅ Verification email resent');
      return { message: 'Doğrulama e-postası yeniden gönderildi' };
    } catch (error) {
      console.error('❌ EmailAuthProvider resendVerification error:', error);
      throw error;
    }
  }
} 
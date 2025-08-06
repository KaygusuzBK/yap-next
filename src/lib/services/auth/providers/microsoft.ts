import { supabase } from '@/lib/supabase';
import { LoginResponse } from '@/lib/types';

export class MicrosoftAuthProvider {
  async signIn(): Promise<LoginResponse> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw new Error('Microsoft ile giriş başarısız');
    }

    // OAuth flow başlatıldı, kullanıcı Microsoft'a yönlendirilecek
    return {
      user: null,
      token: '',
      tokenType: 'Bearer',
      expiresIn: 3600
    };
  }

  async handleCallback(): Promise<LoginResponse> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      throw new Error('Microsoft girişi tamamlanamadı');
    }

    const user = {
      id: session.user.id,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Kullanıcı',
      email: session.user.email || '',
      avatar: session.user.user_metadata?.avatar || undefined,
      role: session.user.user_metadata?.role || 'member',
      isActive: true,
      createdAt: session.user.created_at,
      updatedAt: session.user.updated_at || session.user.created_at
    };

    return {
      user,
      token: session.access_token,
      tokenType: 'Bearer',
      expiresIn: session.expires_in
    };
  }

  // Microsoft hesabı ile kayıt (otomatik olarak giriş yapar)
  async signUp(): Promise<LoginResponse> {
    // Microsoft OAuth'da kayıt ve giriş aynı işlemdir
    return this.signIn();
  }

  // Microsoft hesabından çıkış
  async signOut(): Promise<{ message: string }> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error('Çıkış yapılırken hata oluştu');
    }
    
    return { message: 'Başarıyla çıkış yapıldı' };
  }

  // Microsoft hesabı bağlantısını kaldır
  async unlink(): Promise<{ message: string }> {
    // Bu işlem için Supabase'de özel bir endpoint gerekebilir
    // Şimdilik sadece çıkış yapıyoruz
    return this.signOut();
  }
} 
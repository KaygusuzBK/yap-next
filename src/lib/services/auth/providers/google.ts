import { supabase } from '@/lib/supabase';
import { LoginResponse } from '@/lib/types';

export class GoogleAuthProvider {
  async signIn(): Promise<LoginResponse> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw new Error('Google ile giriş başarısız');
    }

    // OAuth flow başlatıldı, kullanıcı Google'a yönlendirilecek
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
      throw new Error('Google girişi tamamlanamadı');
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

  // Google OAuth ile kayıt (giriş ile aynı işlem)
  async signUp(): Promise<LoginResponse> {
    return this.signIn();
  }
} 
import { create } from 'zustand';
import { authService } from './authService';
import { User, LoginRequest, RegisterRequest } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/services/notifications/notificationService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github' | 'microsoft') => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials: LoginRequest) => {
    try {
      set({ loading: true, error: null });
      
      const response = await authService.loginWithEmail(credentials);
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        loading: false 
      });
      
      notify.success('Başarıyla giriş yaptınız!');
    } catch (error: any) {
      const errorMessage = error.message || 'Giriş yapılırken hata oluştu';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      notify.error(errorMessage);
      throw error;
    }
  },

  loginWithOAuth: async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      set({ loading: true, error: null });
      
      await authService.loginWithOAuth(provider);
      
      notify.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} ile giriş başlatılıyor...`);
      
      // OAuth flow başlatıldı, kullanıcı provider'a yönlendirilecek
      // Gerçek response auth callback'te alınacak
    } catch (error: any) {
      const errorMessage = error.message || 'OAuth girişi başarısız';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      notify.error(errorMessage);
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    try {
      set({ loading: true, error: null });
      
      const response = await authService.registerWithEmail(userData);
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        loading: false 
      });
      
      notify.success('Hesabınız başarıyla oluşturuldu!');
    } catch (error: any) {
      const errorMessage = error.message || 'Kayıt olurken hata oluştu';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      notify.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      
      await authService.logout();
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
      
      notify.success('Başarıyla çıkış yaptınız');
    } catch (error: any) {
      // Logout hatası olsa bile state'i temizle
      const errorMessage = error.message || 'Çıkış yapılırken hata oluştu';
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: errorMessage
      });
      notify.error(errorMessage);
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ loading: true });
      
      const user = await authService.getProfile();
      
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: error.message || 'Kullanıcı bilgileri alınamadı'
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ loading: true });
      
      // Supabase session kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = await authService.getProfile();
        set({ 
          user, 
          isAuthenticated: true, 
          loading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          loading: false 
        });
      }
    } catch (error: any) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: error.message || 'Kimlik doğrulama kontrolü başarısız'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Supabase auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { checkAuth } = useAuthStore.getState();
    
    if (event === 'SIGNED_IN' && session) {
      await checkAuth();
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null, 
        isAuthenticated: false 
      });
    }
  });
}
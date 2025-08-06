import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('Please check your .env.local file and ensure:');
  console.error('NEXT_PUBLIC_SUPABASE_URL is set');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  
  // Development için fallback değerler (sadece uyarı için)
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Using fallback values for development');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);

// Auth helper functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData: { name: string; role?: string }) {
    console.log('🔧 Auth.signUp called with:', { email, name: userData.name });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'member',
        }
      }
    });
    
    if (error) {
      console.error('❌ Supabase signUp error:', error);
    } else {
      console.log('✅ Supabase signUp successful');
    }
    
    return { data, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    console.log('🔧 Auth.signIn called with:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Supabase signIn error:', error);
    } else {
      console.log('✅ Supabase signIn successful');
    }
    
    return { data, error };
  },

  // Sign out
  async signOut() {
    console.log('🔧 Auth.signOut called');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Supabase signOut error:', error);
      throw error;
    }
    
    console.log('✅ Supabase signOut successful');
  },

  // Get current user
  async getCurrentUser() {
    console.log('🔧 Auth.getCurrentUser called');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Supabase getCurrentUser error:', error);
      throw error;
    }
    
    console.log('✅ Supabase getCurrentUser successful:', user?.email);
    return user;
  },

  // Get session
  async getSession() {
    console.log('🔧 Auth.getSession called');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase getSession error:', error);
      throw error;
    }
    
    console.log('✅ Supabase getSession successful');
    return session;
  },

  // Reset password (send reset email)
  async resetPassword(email: string) {
    console.log('🔧 Auth.resetPassword called with:', { email });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('❌ Supabase resetPassword error:', error);
    } else {
      console.log('✅ Supabase resetPassword successful');
    }
    
    return { error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    console.log('🔧 Auth.updatePassword called');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('❌ Supabase updatePassword error:', error);
    } else {
      console.log('✅ Supabase updatePassword successful');
    }
    
    return { error };
  },

  // Verify OTP (for email verification)
  async verifyOtp(token: string) {
    console.log('🔧 Auth.verifyOtp called');
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });
    
    if (error) {
      console.error('❌ Supabase verifyOtp error:', error);
    } else {
      console.log('✅ Supabase verifyOtp successful');
    }
    
    return { error };
  },

  // Resend verification email
  async resendVerification(email: string) {
    console.log('🔧 Auth.resendVerification called with:', { email });
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      console.error('❌ Supabase resendVerification error:', error);
    } else {
      console.log('✅ Supabase resendVerification successful');
    }
    
    return { error };
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    console.log('🔧 Auth.onAuthStateChange called');
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions
export const db = {
  // Projects
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTask(task: any) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Comments
  async getComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createComment(comment: any) {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export default supabase; 
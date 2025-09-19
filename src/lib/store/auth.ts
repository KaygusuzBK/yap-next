"use client"

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { withRetry, handleAuthError } from '@/lib/auth-utils'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  logout: () => void
  checkAuth: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    
    setUser: (user) => set({ 
      user, 
      isAuthenticated: !!user,
      error: null 
    }),
    
    setLoading: (loading) => set({ loading }),
    
    setError: (error) => set({ error }),
    
    clearError: () => set({ error: null }),
    
    logout: async () => {
      try {
        const supabase = getSupabase()
        await supabase.auth.signOut()
      } catch (error) {
        console.warn('Logout error:', error)
      } finally {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      }
    },

    checkAuth: async () => {
      set({ loading: true, error: null })
      
      try {
        const supabase = getSupabase()
        const { data: { session }, error } = await withRetry(
          () => supabase.auth.getSession()
        )
        
        if (error) throw error
        
        set({ 
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Auth check error:', error)
        set({ 
          user: null,
          isAuthenticated: false,
          loading: false,
          error: handleAuthError(error)
        })
      }
    },

    refreshSession: async () => {
      try {
        const supabase = getSupabase()
        const { data: { session }, error } = await withRetry(
          () => supabase.auth.refreshSession()
        )
        
        if (error) throw error
        
        set({ 
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          error: null
        })
      } catch (error) {
        console.error('Session refresh error:', error)
        set({ error: handleAuthError(error) })
      }
    }
  }))
)



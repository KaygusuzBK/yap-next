"use client"

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

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
    
    logout: () => set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    }),
  }))
)



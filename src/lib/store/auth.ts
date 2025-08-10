"use client"

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

type AuthState = {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
}))



"use client"

import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'

type UserState = {
  name: string
  email: string
  setProfile: (name: string, email: string) => void
  loadFromLocalStorage: () => void
  hydrateFromProfiles: (userId: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  name: 'Kullanıcı',
  email: '—',
  setProfile: (name, email) => set({ name, email }),
  loadFromLocalStorage: () => {
    try {
      const name = window.localStorage.getItem('profile_name') || 'Kullanıcı'
      const email = window.localStorage.getItem('profile_email') || '—'
      set({ name, email })
    } catch {}
  },
  hydrateFromProfiles: async (userId: string) => {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('profiles')
        .select('full_name,email')
        .eq('id', userId)
        .single()
      if (data) {
        set({ name: data.full_name || 'Kullanıcı', email: data.email || '—' })
      }
    } catch {}
  },
}))



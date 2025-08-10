"use client"

import { create } from 'zustand'

type UserState = {
  name: string
  email: string
  setProfile: (name: string, email: string) => void
  loadFromLocalStorage: () => void
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
}))



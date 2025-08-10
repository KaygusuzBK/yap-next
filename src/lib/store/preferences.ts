"use client"

import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type Locale = 'tr' | 'en'

type PreferencesState = {
  theme: Theme
  locale: Locale
  setTheme: (t: Theme) => void
  setLocale: (l: Locale) => void
  load: () => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  locale: 'tr',
  setTheme: (t) => {
    set({ theme: t })
    try {
      document.documentElement.classList.toggle('dark', t === 'dark')
      localStorage.setItem('theme', t)
    } catch {}
  },
  setLocale: (l) => {
    set({ locale: l })
    try {
      localStorage.setItem('locale', l)
      document.documentElement.lang = l
    } catch {}
  },
  load: () => {
    try {
      const t = (localStorage.getItem('theme') as Theme) || 'light'
      const l = (localStorage.getItem('locale') as Locale) || 'tr'
      document.documentElement.classList.toggle('dark', t === 'dark')
      document.documentElement.lang = l
      set({ theme: t, locale: l })
    } catch {}
  },
}))



"use client"

import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type Locale = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'ar' | 'zh-CN'

type PreferencesState = {
  theme: Theme
  locale: Locale
  enabledLocales: Locale[]
  setTheme: (t: Theme) => void
  setLocale: (l: Locale) => void
  setEnabledLocales: (l: Locale[]) => void
  load: () => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  locale: 'tr',
  enabledLocales: [],
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
  setEnabledLocales: (list) => {
    set({ enabledLocales: list })
    try {
      const safe = Array.isArray(list) ? list : []
      localStorage.setItem('enabledLocales', JSON.stringify(safe))
    } catch {}
  },
  load: () => {
    try {
      const t = (localStorage.getItem('theme') as Theme) || 'light'
      const l = (localStorage.getItem('locale') as Locale) || 'tr'
      const raw = localStorage.getItem('enabledLocales')
      let enabled: Locale[] = []
      if (raw) {
        const arr = JSON.parse(raw) as unknown
        if (Array.isArray(arr)) {
          const allowed: Locale[] = ['tr','en','de','es','fr','ar','zh-CN']
          enabled = arr.filter((x): x is Locale => typeof x === 'string' && (allowed as string[]).includes(x))
        }
      }
      document.documentElement.classList.toggle('dark', t === 'dark')
      document.documentElement.lang = l
      set({ theme: t, locale: l, enabledLocales: enabled })
    } catch {}
  },
}))



"use client"

import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type Locale = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'ar' | 'zh-CN'

type PreferencesState = {
  theme: Theme
  locale: Locale
  enabledLocales: Locale[]
  tourSeen: boolean
  setTheme: (t: Theme) => void
  setLocale: (l: Locale) => void
  setEnabledLocales: (l: Locale[]) => void
  setTourSeen: (v: boolean) => void
  load: () => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  locale: 'tr',
  enabledLocales: [],
  tourSeen: false,
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
  setTourSeen: (v) => {
    set({ tourSeen: v })
    try {
      localStorage.setItem('tour_seen', v ? '1' : '0')
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
      const tour = localStorage.getItem('tour_seen') === '1'
      document.documentElement.classList.toggle('dark', t === 'dark')
      document.documentElement.lang = l
      set({ theme: t, locale: l, enabledLocales: enabled, tourSeen: tour })
    } catch {}
  },
}))



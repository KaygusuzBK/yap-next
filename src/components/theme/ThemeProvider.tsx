"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePreferencesStore } from '@/lib/store/preferences';
import { getUserTheme, pickReadableForeground, type UserTheme } from '@/lib/services/preferences/userTheme';

type Theme = 'light' | 'dark';
type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeStore = usePreferencesStore(s => s.theme)
  const setThemeStore = usePreferencesStore(s => s.setTheme)
  const load = usePreferencesStore(s => s.load)
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => { load() }, [load]);

  useEffect(() => {
    setTheme(themeStore)
  }, [themeStore])

  // Apply per-user custom theme variables when available
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const stored = await getUserTheme().catch(() => null)
      if (!mounted) return
      const mode: keyof UserTheme = themeStore === 'dark' ? 'dark' : 'light'
      const pal = stored?.[mode]
      const root = document.documentElement
      if (pal?.primary) {
        root.style.setProperty('--primary', pal.primary)
        root.style.setProperty('--primary-foreground', pal.primaryForeground || pickReadableForeground(pal.primary) || 'oklch(0.985 0 0)')
      }
      if (pal?.accent) {
        root.style.setProperty('--accent', pal.accent)
        root.style.setProperty('--accent-foreground', pal.accentForeground || pickReadableForeground(pal.accent) || 'oklch(0.21 0.006 285.885)')
      }
      if (pal?.ring) {
        root.style.setProperty('--ring', pal.ring)
      }
    })()
    return () => { mounted = false }
  }, [themeStore])

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggle: () => setThemeStore(theme === 'dark' ? 'light' : 'dark') }), [theme, setThemeStore]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}



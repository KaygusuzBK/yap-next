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
      // transitions
      if (stored?.transition?.enabled) {
        const dur = Math.max(0, Math.min(3000, stored.transition.durationMs ?? 200))
        const easing = stored.transition.easing || 'ease-in-out'
        root.style.setProperty('--_theme-transition', `background-color ${dur}ms ${easing}, color ${dur}ms ${easing}, border-color ${dur}ms ${easing}`)
      } else {
        root.style.removeProperty('--_theme-transition')
      }
      if (pal?.background) {
        root.style.setProperty('--background', pal.background)
        if (pal?.foreground) root.style.setProperty('--foreground', pal.foreground)
      }
      if (pal?.secondary) {
        root.style.setProperty('--secondary', pal.secondary)
        if (pal?.secondaryForeground) root.style.setProperty('--secondary-foreground', pal.secondaryForeground)
      }
      if (pal?.muted) {
        root.style.setProperty('--muted', pal.muted)
        if (pal?.mutedForeground) root.style.setProperty('--muted-foreground', pal.mutedForeground)
      }
      if (pal?.destructive) root.style.setProperty('--destructive', pal.destructive)
      if (pal?.border) root.style.setProperty('--border', pal.border)
      if (pal?.input) root.style.setProperty('--input', pal.input)
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
      // Sidebar scoped tokens
      if (pal?.sidebar) root.style.setProperty('--sidebar', pal.sidebar)
      if (pal?.sidebarForeground) root.style.setProperty('--sidebar-foreground', pal.sidebarForeground)
      if (pal?.sidebarPrimary) root.style.setProperty('--sidebar-primary', pal.sidebarPrimary)
      if (pal?.sidebarPrimaryForeground) root.style.setProperty('--sidebar-primary-foreground', pal.sidebarPrimaryForeground)
      if (pal?.sidebarAccent) root.style.setProperty('--sidebar-accent', pal.sidebarAccent)
      if (pal?.sidebarAccentForeground) root.style.setProperty('--sidebar-accent-foreground', pal.sidebarAccentForeground)
      if (pal?.sidebarBorder) root.style.setProperty('--sidebar-border', pal.sidebarBorder)
      if (pal?.sidebarRing) root.style.setProperty('--sidebar-ring', pal.sidebarRing)
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



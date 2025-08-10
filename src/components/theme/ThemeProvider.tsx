"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePreferencesStore } from '@/lib/store/preferences';

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

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggle: () => setThemeStore(theme === 'dark' ? 'light' : 'dark') }), [theme, setThemeStore]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}



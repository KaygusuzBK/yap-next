"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { usePreferencesStore } from "@/lib/store/preferences";
import { en } from "./locales/en";
import { tr } from "./locales/tr";

type Locale = "tr" | "en";

type Dictionary = typeof en;

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const dictionaries: Record<Locale, Dictionary> = { en, tr };

const I18nContext = createContext<I18nContextType | null>(null);

function getFromPath(dict: Dictionary, path: string): string | undefined {
  const result = path
    .split(".")
    .reduce<unknown>((obj, key) => {
      if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, dict);
  return typeof result === "string" ? result : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const prefLocale = usePreferencesStore(s => s.locale)
  const setPrefLocale = usePreferencesStore(s => s.setLocale)
  const loadPrefs = usePreferencesStore(s => s.load)
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => { loadPrefs() }, [loadPrefs])
  useEffect(() => { setLocaleState(prefLocale) }, [prefLocale])

  const setLocale = useCallback((next: Locale) => {
    setPrefLocale(next)
  }, [setPrefLocale]);

  const t = useMemo(() => {
    return (path: string) => {
      const dict = dictionaries[locale] ?? dictionaries.tr;
      const val = getFromPath(dict, path);
      if (typeof val === "string") return val;
      const fallback = getFromPath(dictionaries.tr, path);
      return typeof fallback === "string" ? fallback : path;
    };
  }, [locale]);

  const value = useMemo<I18nContextType>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}



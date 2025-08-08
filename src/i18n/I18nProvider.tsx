"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (window.localStorage.getItem("locale") as Locale | null) : null;
    if (stored && (stored === "tr" || stored === "en")) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    } else {
      document.documentElement.lang = "tr";
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem("locale", next);
      document.documentElement.lang = next;
    } catch {}
  }, []);

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



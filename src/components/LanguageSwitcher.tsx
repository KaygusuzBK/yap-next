"use client";

import { Button } from "./ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { usePreferencesStore } from "@/lib/store/preferences";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const prefLocale = usePreferencesStore(s => s.locale)
  const setPrefLocale = usePreferencesStore(s => s.setLocale)
  const next = locale === "tr" ? "en" : "tr";
  if (prefLocale !== locale) {
    // sync preference on render to keep it simple
    setLocale(prefLocale)
  }
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => { setPrefLocale(next); setLocale(next) }}
      aria-label="Change language"
      className="h-8 w-8 p-0 justify-center"
    >
      <span className="text-[11px] font-semibold tracking-wide">
        {locale.toUpperCase()}
      </span>
    </Button>
  );
}



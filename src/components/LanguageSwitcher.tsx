"use client";

import { Button } from "./ui/button";
import { useI18n } from "@/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const next = locale === "tr" ? "en" : "tr";
  return (
    <Button size="sm" variant="outline" onClick={() => setLocale(next)} aria-label="Change language">
      {locale.toUpperCase()} ▾
    </Button>
  );
}



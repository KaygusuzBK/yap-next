"use client";

import { Button } from "./ui/button";
import { useI18n } from "@/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const next = locale === "tr" ? "en" : "tr";
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setLocale(next)}
      aria-label="Change language"
      className="h-8 w-8 p-0 justify-center"
    >
      <span className="text-[11px] font-semibold tracking-wide">
        {locale.toUpperCase()}
      </span>
    </Button>
  );
}



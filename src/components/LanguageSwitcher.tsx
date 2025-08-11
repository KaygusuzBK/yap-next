"use client";

import { Button } from "./ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { usePreferencesStore } from "@/lib/store/preferences";

const LOCALES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh-CN', label: '中文 (简体)' },
] as const;
type LocaleCode = typeof LOCALES[number]['code'];

function getFlag(code: LocaleCode): string {
  switch (code) {
    case 'tr': return '🇹🇷'
    case 'en': return '🇬🇧'
    case 'de': return '🇩🇪'
    case 'es': return '🇪🇸'
    case 'fr': return '🇫🇷'
    case 'ar': return '🇸🇦'
    case 'zh-CN': return '🇨🇳'
    default: return '🌐'
  }
}

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const enabled = usePreferencesStore(s => s.enabledLocales)
  const current = LOCALES.find(l => l.code === locale) || LOCALES[0];
  const list = (enabled && enabled.length > 0)
    ? LOCALES.filter(l => enabled.includes(l.code as unknown as import('@/lib/store/preferences').Locale))
    : LOCALES
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          aria-label="Change language"
          className="h-8 px-2 justify-center gap-2"
        >
          <span className="text-base leading-none">{getFlag(current.code as LocaleCode)}</span>
          <span className="text-[11px] font-semibold tracking-wide">{String(current.label)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {list.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as LocaleCode)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{getFlag(l.code)}</span>
              <span>{l.label}</span>
            </span>
            {l.code === locale && <span className="text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



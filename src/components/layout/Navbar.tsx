"use client";

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useEffect, useState } from 'react';
import { subscribeNotifications, type AppNotification } from '@/lib/services/notifications/notificationService';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();
  const [toastOpen, setToastOpen] = useState(false)
  const [lastNotif, setLastNotif] = useState<AppNotification | null>(null)
  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications((n) => {
      setLastNotif(n)
      setToastOpen(true)
      const id = setTimeout(() => setToastOpen(false), 4000)
      return () => clearTimeout(id)
    }, { userId: user.id })
    return () => { try { unsub() } catch {} }
  }, [user])
  if (pathname.startsWith('/dashboard')) return null;
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold flex items-center gap-2">
          <Logo size={20} withLink={false} />
          <span>{t('common.appName')}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link className="opacity-80 hover:opacity-100" href="/dashboard">{t('common.dashboard')}</Link>
          {user ? (
            <Button size="sm" variant="outline" onClick={() => signOut()}>{t('common.signOut')}</Button>
          ) : (
            <>
              <Link className="opacity-80 hover:opacity-100" href="/login">{t('common.signIn')}</Link>
              <Link className="opacity-80 hover:opacity-100" href="/register">{t('common.signUp')}</Link>
            </>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
      </div>
      {toastOpen && lastNotif && (
        <div className="fixed right-4 top-14 z-50 rounded border bg-background px-3 py-2 shadow">
          <div className="text-sm font-medium">Yeni bildirim</div>
          <div className="text-xs text-muted-foreground max-w-xs break-words">
            {lastNotif.type === 'mention' ? 'Bir yorumda sizden bahsedildi' : lastNotif.type}
          </div>
        </div>
      )}
    </header>
  );
}



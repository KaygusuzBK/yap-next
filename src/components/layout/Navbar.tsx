"use client";

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();
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
        </nav>
      </div>
    </header>
  );
}



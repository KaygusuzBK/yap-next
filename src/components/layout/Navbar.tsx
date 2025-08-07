"use client";

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">YAP</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link className="opacity-80 hover:opacity-100" href="/dashboard">Dashboard</Link>
          {user ? (
            <Button size="sm" variant="outline" onClick={() => signOut()}>Çıkış</Button>
          ) : (
            <>
              <Link className="opacity-80 hover:opacity-100" href="/login">Giriş</Link>
              <Link className="opacity-80 hover:opacity-100" href="/register">Kayıt</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}



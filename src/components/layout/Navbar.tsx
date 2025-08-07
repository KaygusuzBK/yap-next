"use client";

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">YAP</Link>
        <nav className="flex items-center gap-2">
          <Link className="text-sm" href="/dashboard">Dashboard</Link>
          {user ? (
            <Button variant="outline" onClick={() => signOut()}>Çıkış</Button>
          ) : (
            <>
              <Link className="text-sm" href="/login">Giriş</Link>
              <Link className="text-sm" href="/register">Kayıt</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}



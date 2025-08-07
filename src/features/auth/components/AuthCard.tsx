"use client";

import Link from 'next/link';

export default function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
        </header>
        <section className="space-y-4">{children}</section>
        {footer && <footer className="text-sm text-gray-600">{footer}</footer>}
        <div className="text-center text-sm">
          <Link href="/">Ana sayfa</Link>
        </div>
      </div>
    </main>
  );
}



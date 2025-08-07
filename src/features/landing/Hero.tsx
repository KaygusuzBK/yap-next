"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* background gradient + glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,oklch(0.92_0.03_270/_0.35),transparent_60%)] dark:bg-[radial-gradient(80%_60%_at_50%_10%,oklch(0.3_0.03_270/_0.35),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 size-[600px] rounded-full blur-3xl opacity-30 bg-primary/40" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
          Yap Project • Supabase • Next.js
        </span>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Uzay temalı, hızlı ve güvenli
          <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent"> proje yönetimi</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          Shadcn UI, Supabase Auth ve RLS ile güçlendirilmiş modern bir başlangıç.
          Basit ama güçlü bir altyapıyla dakikalar içinde üretken olun.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">Hemen Başla</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Giriş Yap</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="ghost">Kayıt Ol</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}



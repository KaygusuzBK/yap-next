"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* background gradient + glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,oklch(0.92_0.03_270/_0.35),transparent_60%)] dark:bg-[radial-gradient(80%_60%_at_50%_10%,oklch(0.3_0.03_270/_0.35),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 size-[600px] rounded-full blur-3xl opacity-30 bg-primary/40" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
          {t("landing.hero.badge")}
        </span>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("landing.hero.title")}
          <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">{t("landing.hero.titleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          {t("landing.hero.desc")}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">{t("landing.hero.ctaStart")}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">{t("landing.hero.ctaLogin")}</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="ghost">{t("landing.hero.ctaRegister")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}



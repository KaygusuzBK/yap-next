"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function CTA() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_100%,oklch(0.92_0.03_270/_0.25),transparent_60%)] dark:bg-[radial-gradient(60%_40%_at_50%_100%,oklch(0.3_0.03_270/_0.25),transparent_60%)]" />
      </div>
      <div className="mx-auto max-w-4xl rounded-xl border bg-card/60 p-8 text-center backdrop-blur">
        <h2 className="text-2xl font-semibold">{t("landing.cta.title")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          {t("landing.cta.desc")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/register"><Button size="lg">{t("landing.cta.register")}</Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">{t("landing.cta.login")}</Button></Link>
        </div>
      </div>
    </section>
  );
}



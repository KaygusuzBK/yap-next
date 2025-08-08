"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/I18nProvider";

export default function Stats() {
  const { t } = useI18n();
  const stats = [
    { label: t("landing.stats.team"), value: "12+" },
    { label: t("landing.stats.projects"), value: "48" },
    { label: t("landing.stats.tasks"), value: "1.2K" },
    { label: t("landing.stats.satisfaction"), value: "98%" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-input/60">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}



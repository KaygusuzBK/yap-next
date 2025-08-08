"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Rocket, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export default function Features() {
  const { t } = useI18n();
  const items = [
    { icon: Shield, title: t("landing.features.items.0.title"), desc: t("landing.features.items.0.desc") },
    { icon: Rocket, title: t("landing.features.items.1.title"), desc: t("landing.features.items.1.desc") },
    { icon: Sparkles, title: t("landing.features.items.2.title"), desc: t("landing.features.items.2.desc") },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-input/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="text-primary" /> {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{desc}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}



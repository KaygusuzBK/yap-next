import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Rocket, Sparkles } from "lucide-react";

const items = [
  {
    icon: Shield,
    title: "Güvenli RLS",
    desc: "Supabase RLS politikaları ile veri güvenliği ve erişim kontrolü.",
  },
  {
    icon: Rocket,
    title: "Hızlı Başlangıç",
    desc: "Next.js App Router + shadcn UI ile hazır altyapı.",
  },
  {
    icon: Sparkles,
    title: "Modern Tasarım",
    desc: "Monokrom tema, gradientler ve ince animasyonlarla modern görünüm.",
  },
];

export default function Features() {
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



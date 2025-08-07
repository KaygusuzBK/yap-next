import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Takım", value: "12+" },
  { label: "Projeler", value: "48" },
  { label: "Görevler", value: "1.2K" },
  { label: "Memnuniyet", value: "98%" },
];

export default function Stats() {
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



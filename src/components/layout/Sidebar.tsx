"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const items = [
  { href: "/dashboard", label: "Genel Bakış" },
  { href: "/dashboard#projects", label: "Projeler" },
  { href: "/dashboard#teams", label: "Takımlar" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-[240px] shrink-0 border-r bg-card/60 backdrop-blur">
      <div className="p-4">
        <p className="px-2 text-xs font-medium text-muted-foreground">Navigasyon</p>
        <nav className="mt-2 grid">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition",
                pathname === it.href && "bg-accent text-accent-foreground"
              )}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
        <div className="space-y-2 px-2">
          <p className="text-xs font-medium text-muted-foreground">Kısayollar</p>
          <div className="grid text-sm text-muted-foreground">
            <span>⌘ + K Komut Paleti</span>
            <span>⌘ + N Yeni Proje</span>
          </div>
        </div>
      </div>
    </aside>
  );
}



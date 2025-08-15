"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/lib/store/preferences";
import { usePathname } from "next/navigation";

type Step = {
  selector?: string; // CSS selector to highlight
  title: string;
  description: string;
  placement?: "center" | "top" | "bottom" | "left" | "right";
};

function useElementRect(selector?: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) return setRect(null);
    let el: HTMLElement | null = null;
    try {
      el = document.querySelector(selector) as HTMLElement | null;
    } catch {
      // Invalid selector; ignore
      setRect(null);
      return;
    }
    if (!el) return setRect(null);
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [selector]);
  return rect;
}

export default function OnboardingTour() {
  const tourSeen = usePreferencesStore((s) => s.tourSeen);
  const setTourSeen = usePreferencesStore((s) => s.setTourSeen);
  const loadPrefs = usePreferencesStore((s) => s.load);
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    loadPrefs();
    setMounted(true);
  }, [loadPrefs]);

  const steps: Step[] = useMemo(
    () => [
      {
        title: "Hoş geldin!",
        description:
          "Kısa bir tur ile YAP'ı tanıyalım. İstediğin zaman 'Geç' diyebilirsin.",
        placement: "center",
      },
      {
        selector: '[data-slot="sidebar-content"]',
        title: "Yan menü",
        description:
          "Görevlerim, Projeler ve Takımlar sekmelerinden içeriklere ulaşabilirsin.",
        placement: "right",
      },
      {
        selector: '[data-tour="create-task"], [data-tour="create-task-mobile"]',
        title: "Hızlı oluştur",
        description: "Yeni görev ve proje eklemek için artı butonlarını kullan.",
        placement: "bottom",
      },
      {
        selector: '[data-tour="mobile-tabbar"]',
        title: "Alt sekme çubuğu",
        description: "Mobilde Ana, Projeler, Görevler ve Takımlar sekmeleri burada.",
        placement: "top",
      },
      {
        selector: '[data-tour="filter"]',
        title: "Filtreler",
        description: "Görevleri durum, tarih ve önceliğe göre filtreleyebilirsin.",
        placement: "bottom",
      },
      {
        title: "Hazırsın!",
        description:
          "Komut Paleti (⌘K) ile her yerden hızlı aksiyon alabilirsin. İyi çalışmalar!",
        placement: "center",
      },
    ],
    []
  );

  const current = steps[stepIndex];
  const highlightRect = useElementRect(current.selector);
  const open = mounted && !tourSeen && (pathname?.startsWith('/dashboard') ?? false);

  if (!open) return null;

  return createPortal(
    (
      <div className="fixed inset-0 z-[60]">
        {/* Dimmer */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Highlight */}
        {highlightRect && (
          <div
            className="absolute rounded-md ring-2 ring-primary bg-transparent pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
          />
        )}
        {/* Tooltip/Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-lg border bg-background shadow-lg p-4 space-y-2 text-center">
            <h3 className="text-lg font-semibold">{current.title}</h3>
            <p className="text-sm text-muted-foreground">{current.description}</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="ghost" onClick={() => setTourSeen(true)}>Geç</Button>
              {stepIndex > 0 && (
                <Button variant="outline" onClick={() => setStepIndex((i) => i - 1)}>Geri</Button>
              )}
              {stepIndex < steps.length - 1 ? (
                <Button onClick={() => setStepIndex((i) => i + 1)}>İleri</Button>
              ) : (
                <Button onClick={() => setTourSeen(true)}>Bitir</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}



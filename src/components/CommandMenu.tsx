"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export default function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Komutlar veya sayfalar... (⌘K)" />
      <CommandList>
        <CommandEmpty>Sonuç yok</CommandEmpty>
        <CommandGroup heading="Navigasyon">
          <CommandItem onSelect={() => go("/")}>Ana sayfa</CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            Dashboard
            <CommandShortcut>⇧ D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/login")}>Giriş</CommandItem>
          <CommandItem onSelect={() => go("/register")}>Kayıt</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Eylemler">
          <CommandItem onSelect={() => go("/dashboard#projects")}>Yeni Proje</CommandItem>
          <CommandItem onSelect={() => go("/dashboard#teams")}>Yeni Takım</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}



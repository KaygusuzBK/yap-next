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
import { fetchProjects } from "@/features/projects/api";
import { fetchMyTasks } from "@/features/tasks/api";
import { fetchTeams } from "@/features/teams/api";

export default function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [projects, setProjects] = React.useState<Array<{ id: string; title: string }>>([]);
  const [tasks, setTasks] = React.useState<Array<{ id: string; title: string; project_title?: string }>>([]);
  const [teams, setTeams] = React.useState<Array<{ id: string; name: string }>>([]);
  const [recents, setRecents] = React.useState<Array<{ href: string; label: string; sub?: string; type: 'task' | 'project' | 'team'; ts: number }>>([]);
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

  React.useEffect(() => {
    if (!open) return;
    // Load recents from localStorage
    try {
      const raw = localStorage.getItem('recent-items');
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ href: string; label: string; sub?: string; type: 'task' | 'project' | 'team'; ts: number }>
        setRecents(parsed.sort((a,b) => b.ts - a.ts).slice(0, 10))
      }
    } catch {}
    if (projects.length || tasks.length || teams.length) return;
    (async () => {
      try {
        const [p, t, tm] = await Promise.all([fetchProjects(), fetchMyTasks(), fetchTeams()]);
        setProjects(p.map(pr => ({ id: pr.id, title: pr.title })));
        setTasks(t.map(ts => ({ id: ts.id, title: ts.title, project_title: ts.project_title })));
        setTeams(tm.map(team => ({ id: team.id, name: team.name })));
      } catch {}
    })();
  }, [open, projects.length, tasks.length, teams.length]);

  const go = (href: string, recent?: { label: string; sub?: string; type: 'task' | 'project' | 'team' }) => {
    setOpen(false);
    router.push(href);
    if (recent) {
      try {
        const raw = localStorage.getItem('recent-items');
        const list: Array<{ href: string; label: string; sub?: string; type: 'task' | 'project' | 'team'; ts: number }> = raw ? JSON.parse(raw) : []
        const now = Date.now()
        const next = [{ href, label: recent.label, sub: recent.sub, type: recent.type, ts: now }, ...list.filter(i => i.href !== href)]
        localStorage.setItem('recent-items', JSON.stringify(next.slice(0, 20)))
        setRecents(next.slice(0, 10))
      } catch {}
    }
  };

  const q = query.trim().toLowerCase();

  // simple fuzzy match: checks that all query chars appear in order
  const fuzzy = (needle: string, hay: string) => {
    if (!needle) return true
    let i = 0
    const n = needle
    const h = hay
    for (let j = 0; j < h.length && i < n.length; j++) {
      if (h[j] === n[i]) i++
    }
    return i === n.length
  }

  const match = (text: string) => {
    const t = text.toLowerCase()
    return t.includes(q) || fuzzy(q, t)
  }

  const filteredProjects = q ? projects.filter(p => match(p.title)) : projects.slice(0, 8);
  const filteredTasks = q ? tasks.filter(t => (match(t.title) || match(t.project_title || ''))) : tasks.slice(0, 10);
  const filteredTeams = q ? teams.filter(tm => match(tm.name)) : teams.slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ara veya komut yaz... (⌘K, ↑↓ gezin, Enter aç)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Sonuç yok</CommandEmpty>
        {!q && recents.length > 0 && (
          <CommandGroup heading="Son açılanlar">
            {recents.slice(0, 6).map((r) => (
              <CommandItem key={r.href} onSelect={() => go(r.href)}>
                {r.label}
                {r.sub ? <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
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
        <CommandGroup heading="Görevler">
          {filteredTasks.map((t) => (
            <CommandItem key={t.id} onSelect={() => go(`/dashboard/tasks/${t.id}`, { label: t.title, sub: t.project_title, type: 'task' })}>
              {t.title}
              {t.project_title ? <span className="ml-auto text-xs text-muted-foreground">{t.project_title}</span> : null}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projeler">
          {filteredProjects.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(`/dashboard/projects/${p.id}`, { label: p.title, type: 'project' })}>
              {p.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Takımlar">
          {filteredTeams.map((tm) => (
            <CommandItem key={tm.id} onSelect={() => go(`/dashboard/teams/${tm.id}`, { label: tm.name, type: 'team' })}>
              {tm.name}
            </CommandItem>
          ))}
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



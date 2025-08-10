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
    if (!open || projects.length || tasks.length || teams.length) return;
    (async () => {
      try {
        const [p, t, tm] = await Promise.all([fetchProjects(), fetchMyTasks(), fetchTeams()]);
        setProjects(p.map(pr => ({ id: pr.id, title: pr.title })));
        setTasks(t.map(ts => ({ id: ts.id, title: ts.title, project_title: ts.project_title })));
        setTeams(tm.map(team => ({ id: team.id, name: team.name })));
      } catch {}
    })();
  }, [open, projects.length, tasks.length, teams.length]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const q = query.trim().toLowerCase();
  const filteredProjects = q ? projects.filter(p => p.title.toLowerCase().includes(q)) : projects.slice(0, 8);
  const filteredTasks = q ? tasks.filter(t => (t.title.toLowerCase().includes(q) || (t.project_title || '').toLowerCase().includes(q))) : tasks.slice(0, 10);
  const filteredTeams = q ? teams.filter(tm => tm.name.toLowerCase().includes(q)) : teams.slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ara veya komut yaz... (⌘K)" value={query} onValueChange={setQuery} />
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
        <CommandGroup heading="Görevler">
          {filteredTasks.map((t) => (
            <CommandItem key={t.id} onSelect={() => go(`/dashboard/tasks/${t.id}`)}>
              {t.title}
              {t.project_title ? <span className="ml-auto text-xs text-muted-foreground">{t.project_title}</span> : null}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projeler">
          {filteredProjects.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(`/dashboard/projects/${p.id}`)}>
              {p.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Takımlar">
          {filteredTeams.map((tm) => (
            <CommandItem key={tm.id} onSelect={() => go(`/dashboard/teams/${tm.id}`)}>
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



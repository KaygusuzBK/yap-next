"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useProjects, useCreateProject } from "@/features/projects/queries";
import { useMyTasks, useCreateTask } from "@/features/tasks/queries";
import { useTeams } from "@/features/teams/queries";
import { useCommandMenuStore } from "@/lib/store/commandMenu";
import { useMutation } from "@tanstack/react-query";
import { assignTaskToUser, getProjectMembers } from "@/features/tasks/api";
import { toast } from "sonner";

export default function CommandMenu() {
  const open = useCommandMenuStore(s => s.open);
  const setOpen = useCommandMenuStore(s => s.setOpen);
  const query = useCommandMenuStore(s => s.query);
  const setQuery = useCommandMenuStore(s => s.setQuery);
  const recents = useCommandMenuStore(s => s.recents);
  const loadRecents = useCommandMenuStore(s => s.loadRecents);
  const addRecent = useCommandMenuStore(s => s.addRecent);
  const { data: projectsData = [] } = useProjects();
  const { data: tasksData = [] } = useMyTasks();
  const { data: teamsData = [] } = useTeams();
  // recents now come from store
  const router = useRouter();

  // Action state
  const [action, setAction] = React.useState<null | 'newTask' | 'newProject' | 'quickAssign'>(null)
  // New Task form state
  const [taskTitle, setTaskTitle] = React.useState("")
  const [taskProjectId, setTaskProjectId] = React.useState<string>("")
  const createTask = useCreateTask()
  // New Project form state
  const [projectTitle, setProjectTitle] = React.useState("")
  const [projectDesc, setProjectDesc] = React.useState("")
  const createProject = useCreateProject()
  // Quick assign state
  const [assignTaskId, setAssignTaskId] = React.useState<string>("")
  const [assignMembers, setAssignMembers] = React.useState<Array<{ id: string; email: string; name?: string }>>([])
  const [assignUserId, setAssignUserId] = React.useState<string>("")
  const assignMutation = useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) => assignTaskToUser(taskId, userId),
    onSuccess: () => {
      toast.success("Atama yapıldı")
      setAction(null)
      setOpen(false)
    },
    onError: () => toast.error("Atama başarısız")
  })

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMeta = (e.metaKey || e.ctrlKey)
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (isMeta && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setOpen(true);
        setAction('newTask')
      } else if (isMeta && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setOpen(true);
        setAction('newProject')
      } else if (isMeta && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setOpen(true);
        setAction('quickAssign')
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    loadRecents();
    // reset inline forms when palette opens
    setAction(null)
    setTaskTitle("")
    setTaskProjectId("")
    setProjectTitle("")
    setProjectDesc("")
    setAssignTaskId("")
    setAssignMembers([])
    setAssignUserId("")
  }, [open, loadRecents]);

  const go = (href: string, recent?: { label: string; sub?: string; type: 'task' | 'project' | 'team' }) => {
    setOpen(false);
    router.push(href);
    if (recent) {
      addRecent({ href, label: recent.label, sub: recent.sub, type: recent.type })
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

  const projects = projectsData.map(pr => ({ id: pr.id, title: pr.title }));
  const tasks = tasksData.map(ts => ({ id: ts.id, title: ts.title, project_title: ts.project_title }));
  const teams = teamsData.map(team => ({ id: team.id, name: team.name }));
  const filteredProjects = q ? projects.filter(p => match(p.title)) : projects.slice(0, 8);
  const filteredTasks = q ? tasks.filter(t => (match(t.title) || match(t.project_title || ''))) : tasks.slice(0, 10);
  const filteredTeams = q ? teams.filter(tm => match(tm.name)) : teams.slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ara veya komut yaz... (⌘K, ⌘⇧T yeni görev, ⌘⇧N yeni proje)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Sonuç yok</CommandEmpty>
        {/* Inline command forms */}
        {action === 'newTask' && (
          <CommandGroup heading="Yeni Görev">
            <div className="px-2 py-1.5 space-y-2">
              <input
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Görev başlığı"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <select
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
              >
                <option value="">Proje seçin</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button className="text-xs px-2 py-1 rounded-md border" onClick={() => setAction(null)}>Vazgeç</button>
                <button
                  className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                  disabled={!taskTitle.trim() || !taskProjectId || createTask.isPending}
                  onClick={async () => {
                    try {
                      await createTask.mutateAsync({ project_id: taskProjectId, title: taskTitle.trim() })
                      setAction(null)
                      setOpen(false)
                      setTaskTitle("")
                      setTaskProjectId("")
                    } catch {}
                  }}
                >{createTask.isPending ? 'Oluşturuluyor...' : 'Oluştur'}</button>
              </div>
            </div>
          </CommandGroup>
        )}
        {action === 'newProject' && (
          <CommandGroup heading="Yeni Proje">
            <div className="px-2 py-1.5 space-y-2">
              <input
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Proje başlığı"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
              <input
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Açıklama (opsiyonel)"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className="text-xs px-2 py-1 rounded-md border" onClick={() => setAction(null)}>Vazgeç</button>
                <button
                  className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                  disabled={!projectTitle.trim() || createProject.isPending}
                  onClick={async () => {
                    try {
                      await createProject.mutateAsync({ title: projectTitle.trim(), description: projectDesc || null })
                      setAction(null)
                      setOpen(false)
                      setProjectTitle("")
                      setProjectDesc("")
                    } catch {}
                  }}
                >{createProject.isPending ? 'Oluşturuluyor...' : 'Oluştur'}</button>
              </div>
            </div>
          </CommandGroup>
        )}
        {action === 'quickAssign' && (
          <CommandGroup heading="Hızlı Atama">
            <div className="px-2 py-1.5 space-y-2">
              <select
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                value={assignTaskId}
                onChange={async (e) => {
                  const v = e.target.value
                  setAssignTaskId(v)
                  setAssignMembers([])
                  setAssignUserId("")
                  const task = tasks.find(t => t.id === v)
                  if (task) {
                    try {
                      const members = await getProjectMembers(task.project_id)
                      setAssignMembers(members)
                    } catch {}
                  }
                }}
              >
                <option value="">Görev seçin</option>
                {tasks.slice(0, 50).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <select
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                disabled={!assignTaskId || assignMembers.length === 0}
              >
                <option value="">Kişi seçin</option>
                {assignMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name || m.email}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button className="text-xs px-2 py-1 rounded-md border" onClick={() => setAction(null)}>Vazgeç</button>
                <button
                  className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                  disabled={!assignTaskId || !assignUserId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate({ taskId: assignTaskId, userId: assignUserId })}
                >{assignMutation.isPending ? 'Atanıyor...' : 'Ata'}</button>
              </div>
            </div>
          </CommandGroup>
        )}
        {!q && !action && (
          <CommandGroup heading="Hızlı navigasyon">
            <CommandItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link href="/dashboard#projects">Projeler</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link href="/dashboard#teams">Takımlar</Link>
            </CommandItem>
          </CommandGroup>
        )}
        {!q && !action && recents.length > 0 && (
          <CommandGroup heading="Son açılanlar">
            {recents.slice(0, 6).map((r) => (
              <CommandItem key={r.href} onSelect={() => go(r.href)}>
                {r.label}
                {r.sub ? <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!action && (
        <CommandGroup heading="Navigasyon">
          <CommandItem onSelect={() => go("/")}>Ana sayfa</CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            Dashboard
            <CommandShortcut>⇧ D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/login")}>Giriş</CommandItem>
          <CommandItem onSelect={() => go("/register")}>Kayıt</CommandItem>
        </CommandGroup>
        )}
        <CommandSeparator />
        {!action && (
        <CommandGroup heading="Görevler">
          {filteredTasks.map((t) => (
            <CommandItem key={t.id} onSelect={() => go(`/dashboard/tasks/${t.id}`, { label: t.title, sub: t.project_title, type: 'task' })}>
              {t.title}
              {t.project_title ? <span className="ml-auto text-xs text-muted-foreground">{t.project_title}</span> : null}
            </CommandItem>
          ))}
        </CommandGroup>
        )}
        {!action && (
        <CommandGroup heading="Projeler">
          {filteredProjects.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(`/dashboard/projects/${p.id}`, { label: p.title, type: 'project' })}>
              {p.title}
            </CommandItem>
          ))}
        </CommandGroup>
        )}
        {!action && (
        <CommandGroup heading="Takımlar">
          {filteredTeams.map((tm) => (
            <CommandItem key={tm.id} onSelect={() => go(`/dashboard/teams/${tm.id}`, { label: tm.name, type: 'team' })}>
              {tm.name}
            </CommandItem>
          ))}
        </CommandGroup>
        )}
        <CommandSeparator />
        {!action && (
          <CommandGroup heading="Eylemler">
            <CommandItem onSelect={() => setAction('newTask')}>
              Yeni Görev
              <CommandShortcut>⌘⇧ T</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setAction('newProject')}>
              Yeni Proje
              <CommandShortcut>⌘⇧ N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setAction('quickAssign')}>
              Hızlı Atama
              <CommandShortcut>⌘⇧ A</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}



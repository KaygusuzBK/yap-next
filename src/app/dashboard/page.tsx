"use client"

import { useEffect, useState } from "react"
import { type Task } from "@/features/tasks/api"
import { getSupabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/I18nProvider"
import DashboardHeader from "@/components/layout/DashboardHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folder, Users, TrendingUp, Calendar as CalendarIcon, GripVertical } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchStatusesForProjects, type ProjectTaskStatus } from "@/features/tasks/api"
import { toast } from "sonner"
import PendingInvitations from "@/components/PendingInvitations"
import { useProjects } from "@/features/projects/queries"
import { useTeams } from "@/features/teams/queries"
import { useMyTasks, useUpdateTask } from "@/features/tasks/queries"

export default function Page() {
  const { t } = useI18n()
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: teams = [], isLoading: loadingTeams } = useTeams()
  const { data: myTasks = [], isLoading: loadingTasks } = useMyTasks()
  const updateTaskMutation = useUpdateTask()

  // Local board state for drag interactions
  const [boardTasks, setBoardTasks] = useState<Task[]>([])
  
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<"todo" | "in_progress" | "review" | "completed" | null>(null)
  const [statusesByProject, setStatusesByProject] = useState<Record<string, ProjectTaskStatus[]>>({})

  const priorityTheme: Record<NonNullable<Task["priority"]>, { bar: string; chip: string; text: string; dot: string }> = {
    urgent: {
      bar: "bg-red-500",
      chip: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    high: {
      bar: "bg-amber-500",
      chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    medium: {
      bar: "bg-sky-500",
      chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
      text: "text-sky-600 dark:text-sky-400",
      dot: "bg-sky-500",
    },
    low: {
      bar: "bg-emerald-500",
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
  }

  // Sync board tasks and statuses when myTasks reference actually changes
  useEffect(() => {
    let mounted = true
    // Avoid unnecessary state updates causing render loops: shallow compare by id/length
    setBoardTasks(prev => {
      if (prev.length === myTasks.length && prev.every((p, i) => p.id === myTasks[i]?.id)) return prev
      return myTasks
    })
    ;(async () => {
      try {
        const uniqueProjectIds = Array.from(new Set(myTasks.map(t => t.project_id)))
        if (!mounted) return
        if (uniqueProjectIds.length > 0) {
          const map = await fetchStatusesForProjects(uniqueProjectIds)
          if (mounted) setStatusesByProject(map)
        } else if (mounted) {
          setStatusesByProject({})
        }
      } catch {
        // noop
      }
    })()
    return () => { mounted = false }
  }, [myTasks])

  // Set up realtime subscription once
  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('board_project_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        // cache will update on mutations; could invalidate here if needed
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [])

  function getGroupForTask(task: Task): "todo" | "in_progress" | "review" | "completed" {
    const statuses = statusesByProject[task.project_id]
    if (statuses && statuses.length > 0) {
      const def = statuses.find(s => s.key === task.status)
      if (def) return def.group
    }
    // Fallback for legacy keys
    if (task.status === 'in_progress' || task.status === 'review' || task.status === 'completed') return task.status
    return 'todo'
  }

  function getDefaultKeyForGroup(projectId: string, group: "todo" | "in_progress" | "review" | "completed"): string {
    const statuses = statusesByProject[projectId]
    if (statuses && statuses.length > 0) {
      const byGroup = statuses.filter(s => s.group === group)
      const firstByOrder = byGroup.sort((a,b) => a.position - b.position)[0]
      if (firstByOrder) return firstByOrder.key
    }
    // fallback to base key when mapping not available
    return group
  }

  return (
    <main className="flex flex-1 flex-col w-full px-4 py-3 md:px-6 md:py-4 space-y-6">
      <div className="w-full space-y-6">
        <DashboardHeader
          title={t('dashboard.breadcrumb.dashboard')}
          breadcrumb={[
            { label: t('dashboard.breadcrumb.home'), href: '/' },
            { label: t('dashboard.breadcrumb.dashboard') },
          ]}
        />
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dashboard.overview.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden transition-all hover:shadow-md">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalProjects')}</CardTitle>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Folder className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? <Skeleton className="h-7 w-12" /> : projects.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {loadingProjects ? <Skeleton className="mt-1 h-4 w-32" /> : t('dashboard.overview.totalProjectsDesc')}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalTeams')}</CardTitle>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingTeams ? <Skeleton className="h-7 w-12" /> : teams.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {loadingTeams ? <Skeleton className="mt-1 h-4 w-40" /> : t('dashboard.overview.totalTeamsDesc')}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.activeProjects')}</CardTitle>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? <Skeleton className="h-7 w-12" /> : projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('dashboard.overview.activeProjectsDesc')}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.thisMonth')}</CardTitle>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    projects.filter(p => {
                      const created = new Date(p.created_at)
                      const now = new Date()
                      return created.getMonth() === now.getMonth() && 
                             created.getFullYear() === now.getFullYear()
                    }).length
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('dashboard.overview.thisMonthDesc')}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <PendingInvitations />

        {/* Teams and Projects sections removed as requested */}

        {/* Board & Backlog using shadcn Tabs */}
        <Tabs defaultValue="board" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="backlog">Backlog</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-3">
            
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 md:overflow-visible overflow-x-auto pb-2 [grid-auto-columns:90%] [grid-auto-flow:column] md:[grid-auto-flow:initial] md:[grid-auto-columns:initial]">
              {([
                { key: 'todo', title: 'Yapılacak' },
                { key: 'in_progress', title: 'Devam Ediyor' },
                { key: 'review', title: 'İncelemede' },
                { key: 'completed', title: 'Tamamlandı' },
              ] as const).map((col) => {
                const columnTasks = boardTasks.filter(t => getGroupForTask(t) === col.key)
                return (
                  <Card
                    key={col.key}
                    onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.key) }}
                    onDragLeave={() => setDragOverStatus(prev => (prev === col.key ? null : prev))}
                    onDrop={async () => {
                      if (!dragTaskId) return
                      const task = boardTasks.find(t => t.id === dragTaskId)
                      if (!task || task.status === col.key) { setDragOverStatus(null); setDragTaskId(null); return }
                      const prevStatus = task.status
                      // optimistic
                      setBoardTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: col.key } : t))
                      setDragOverStatus(null)
                      setDragTaskId(null)
                      try {
                        const nextKey = getDefaultKeyForGroup(task.project_id, col.key)
                        await updateTaskMutation.mutateAsync({ id: task.id, status: nextKey })
                      } catch {
                        // revert
                        setBoardTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: prevStatus } : t))
                        toast.error(t('dashboard.toasts.moveError'))
                      }
                    }}
                    className={`min-h-[320px] overflow-hidden transition-all ${dragOverStatus === col.key ? 'ring-2 ring-primary/70 shadow-md border-primary/40 bg-primary/5' : 'hover:border-primary/20'} bg-muted/30 backdrop-blur-sm`}
                  >
                    <CardHeader className="sticky top-0 z-10 flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-b from-background/95 to-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                      <CardTitle className="text-sm font-medium">{col.title}</CardTitle>
                      <Badge variant={col.key === 'completed' ? 'secondary' : 'outline'} className="rounded-full">{loadingTasks ? '...' : columnTasks.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto pt-2">
                      {loadingTasks ? (
                        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                      ) : columnTasks.length === 0 ? (
                        <div className="text-sm text-muted-foreground flex items-center justify-center h-24 border border-dashed rounded-md">Sürükleyip bırakın</div>
                      ) : (
                        <div className="space-y-2">
                          {columnTasks
                            .slice(0, 50)
                            .sort((a,b) => (a.position ?? 0) - (b.position ?? 0))
                            .map((task) => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => {
                                setDragTaskId(task.id)
                                const node = document.createElement('div')
                                node.className = 'inline-block max-w-[240px] whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-xs rounded-md border bg-background shadow pointer-events-none'
                                node.textContent = task.title
                                document.body.appendChild(node)
                                e.dataTransfer.setDragImage(node, 10, 10)
                                setTimeout(() => node.remove(), 0)
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                if (!dragTaskId || dragTaskId === task.id) return
                                // aynı sütunda yer değiştirme
                                const dragging = myTasks.find(t => t.id === dragTaskId)
                                if (!dragging) return
                                if (getGroupForTask(dragging) !== getGroupForTask(task)) return
                                setBoardTasks(prev => {
                                  const inSame = prev.filter(t => getGroupForTask(t) === getGroupForTask(task))
                                  const ids = inSame.map(t => t.id)
                                  const from = ids.indexOf(dragTaskId)
                                  const to = ids.indexOf(task.id)
                                  if (from === -1 || to === -1 || from === to) return prev
                                  const copy = [...prev]
                                  const fromIndex = copy.findIndex(t => t.id === dragTaskId)
                                  const toIndex = copy.findIndex(t => t.id === task.id)
                                  const [removed] = copy.splice(fromIndex, 1)
                                  copy.splice(toIndex, 0, removed)
                                  return copy
                                })
                              }}
                              onDragEnd={async () => {
                                // Persist relative order by writing incremental positions
                                const same = boardTasks.filter(t => getGroupForTask(t) === getGroupForTask(task))
                                const ordered = same
                                  .slice(0, 50)
                                  .sort((a,b) => (a.position ?? 0) - (b.position ?? 0))
                                // reassign sequential positions (10,20,30...)
                                const base = 10
                                const updates = ordered.map((t, i) => ({ id: t.id, position: base*(i+1) }))
                                try {
                                  await Promise.all(updates.map(u => updateTaskMutation.mutateAsync({ id: u.id, position: u.position })))
                                } catch {}
                                setDragTaskId(null)
                              }}
                              className="group relative rounded-lg border p-3 hover:bg-accent/40 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ring-1 ring-transparent hover:ring-primary/20 bg-card/50 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              role="button"
                              tabIndex={0}
                              aria-label={`Görev: ${task.title}`}
                              onKeyDown={(e) => {
                                if (dragTaskId) return
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  window.location.href = `/dashboard/tasks/${task.id}`
                                }
                              }}
                               onClick={() => { if (!dragTaskId) window.location.href = `/dashboard/tasks/${task.id}` }}
                            >
                                <span className={`absolute left-0 top-0 h-full w-1 rounded-l-md ${priorityTheme[task.priority ?? 'low'].bar}`} />
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate leading-5">{task.title}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      {task.project_title && (
                                        <span className="inline-flex items-center max-w-[160px] truncate rounded-full border px-2 py-0.5 bg-muted/40">
                                          {task.project_title}
                                        </span>
                                      )}
                                      {task.due_date && (
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                                          <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                          {new Date(task.due_date).toLocaleDateString('tr-TR')}
                                        </span>
                                      )}
                                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${priorityTheme[task.priority ?? 'low'].chip}`}>
                                        <span className={`h-2 w-2 rounded-full ${priorityTheme[task.priority ?? 'low'].dot}`} />
                                        {task.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                            </div>
                          ))}
                          {columnTasks.length > 5 && (
                            <div className="text-xs text-muted-foreground">+{columnTasks.length - 5} daha</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="backlog">
            <Card className="overflow-hidden bg-muted/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sticky top-0 z-10 bg-gradient-to-b from-background/95 to-background/70 backdrop-blur border-b">
                <CardTitle className="text-sm font-medium">Yapılacaklar</CardTitle>
                <Badge variant="outline">{loadingTasks ? '...' : myTasks.filter(t => t.status === 'todo').length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto pt-2">
                {loadingTasks ? (
                  <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                ) : (
                  <div className="space-y-2">
                    {myTasks
                      .filter(t => t.status === 'todo')
                      .sort((a, b) => {
                        const prioRank = { urgent: 4, high: 3, medium: 2, low: 1 } as const
                        const diff = prioRank[b.priority] - prioRank[a.priority]
                        if (diff !== 0) return diff
                        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity
                        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity
                        return ad - bd
                      })
                      .slice(0, 10)
                      .map(task => (
                        <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="block">
                          <div className="group relative rounded-lg border p-3 hover:bg-accent/40 hover:shadow-sm transition-all ring-1 ring-transparent hover:ring-primary/20 bg-card/50 backdrop-blur-sm">
                            <span className={`absolute left-0 top-0 h-full w-1 rounded-l-md ${priorityTheme[task.priority ?? 'low'].bar}`} />
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate leading-5">{task.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {task.project_title && (
                                    <span className="inline-flex items-center max-w-[180px] truncate rounded-full border px-2 py-0.5 bg-muted/40">
                                      {task.project_title}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                                      <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                      {new Date(task.due_date).toLocaleDateString('tr-TR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${priorityTheme[task.priority ?? 'low'].chip}`}>
                                <span className={`h-2 w-2 rounded-full ${priorityTheme[task.priority ?? 'low'].dot}`} />
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </Link>
                    ))}
                    {myTasks.filter(t => t.status === 'todo').length === 0 && (
                      <div className="text-sm text-muted-foreground">{t('dashboard.empty.backlog')}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
// import { type Project } from "@/features/projects/api"
// import { type Team } from "@/features/teams/api"
import { type Task } from "@/features/tasks/api"
import { getSupabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/I18nProvider"
import DashboardHeader from "@/components/layout/DashboardHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Folder, Users, TrendingUp, Calendar as CalendarIcon, GripVertical } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchStatusesForProjects, type ProjectTaskStatus } from "@/features/tasks/api"
import { toast } from "sonner"
import PendingInvitations from "@/components/PendingInvitations"
import { useProjects } from "@/features/projects/queries"
import { useTeams } from "@/features/teams/queries"
import { useMyTasks, useUpdateTask } from "@/features/tasks/queries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { getUserPrefs, saveUserPrefs, type UserPrefs } from "@/lib/services/account"
import NewTaskForm from "@/features/tasks/components/NewTaskForm"
import RecentActivities from "@/components/RecentActivities"

export default function Page() {
  const { t } = useI18n()
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: teams = [], isLoading: loadingTeams } = useTeams()
  const { data: myTasks = [], isLoading: loadingTasks } = useMyTasks()
  const updateTaskMutation = useUpdateTask()
  // Dashboard görünürlük tercihleri
  const [dashboardPrefs, setDashboardPrefs] = useState<{ showOverview: boolean; showPerformance: boolean; showActivities: boolean; showInvites: boolean; showBoard: boolean; showBacklog: boolean }>(
    { showOverview: true, showPerformance: true, showActivities: true, showInvites: true, showBoard: true, showBacklog: true }
  )
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Widget görünürlük ve sıralama (Hızlı, Yakın Vade, Gecikenler, Mini Kanban)
  type WidgetId = 'quick' | 'upcoming' | 'overdue' | 'mini'
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(['quick','upcoming','overdue','mini'])
  const [widgetVisible, setWidgetVisible] = useState<Record<WidgetId, boolean>>({ quick: true, upcoming: true, overdue: true, mini: true })

  useEffect(() => {
    ;(async () => {
      try {
        const p = await getUserPrefs().catch(() => ({} as UserPrefs))
        const dp = (p as any).dashboard as Partial<typeof dashboardPrefs> | undefined
        const wv = (p as any)?.dashboard?.widgetsVisible as Record<WidgetId, boolean> | undefined
        const wo = (p as any)?.dashboard?.widgetsOrder as WidgetId[] | undefined
        if (dp) setDashboardPrefs(prev => ({ ...prev, ...dp }))
        if (wv) setWidgetVisible(prev => ({ ...prev, ...wv }))
        if (wo && Array.isArray(wo) && wo.length) setWidgetOrder(wo)
      } catch {}
    })()
  }, [])

  async function saveDashboardPrefs(next: Partial<typeof dashboardPrefs>) {
    setPrefsSaving(true)
    try {
      await saveUserPrefs({ dashboard: { ...dashboardPrefs, ...next } } as any)
      setDashboardPrefs(prev => ({ ...prev, ...next }))
    } finally {
      setPrefsSaving(false)
    }
  }

  // Performans kartları için sıralama ve görünürlük
  type PerfCardId = 'w7' | 'w14' | 'w30'
  const [perfOrder, setPerfOrder] = useState<PerfCardId[]>(['w7','w14','w30'])
  const [perfVisible, setPerfVisible] = useState<Record<PerfCardId, boolean>>({ w7: true, w14: true, w30: true })
  const [dragPerf, setDragPerf] = useState<PerfCardId | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const p = await getUserPrefs().catch(() => ({} as UserPrefs))
        const po = (p as any)?.dashboard?.perfOrder as PerfCardId[] | undefined
        const pv = (p as any)?.dashboard?.perfVisible as Record<PerfCardId, boolean> | undefined
        if (po && Array.isArray(po) && po.length) setPerfOrder(po)
        if (pv) setPerfVisible(prev => ({ ...prev, ...pv }))
      } catch {}
    })()
  }, [])

  async function persistPerf(next?: { order?: PerfCardId[]; visible?: Record<PerfCardId, boolean> }) {
    try {
      await saveUserPrefs({ dashboard: { perfOrder: next?.order ?? perfOrder, perfVisible: next?.visible ?? perfVisible } } as any)
    } catch {}
  }

  function addPerfCard(id: PerfCardId) {
    const nv = { ...perfVisible, [id]: true }
    setPerfVisible(nv)
    if (!perfOrder.includes(id)) {
      const no = [...perfOrder, id]
      setPerfOrder(no)
      persistPerf({ order: no, visible: nv })
    } else {
      persistPerf({ visible: nv })
    }
  }

  // Local board state for drag interactions
  const [boardTasks, setBoardTasks] = useState<Task[]>([])
  
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<"todo" | "in_progress" | "review" | "completed" | null>(null)
  const [statusesByProject, setStatusesByProject] = useState<Record<string, ProjectTaskStatus[]>>({})
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("")

  // Performance metrics
  const [perf7, setPerf7] = useState<{ completed: number; seconds: number } | null>(null)
  const [perf14, setPerf14] = useState<{ completed: number; seconds: number } | null>(null)
  const [perf30, setPerf30] = useState<{ completed: number; seconds: number } | null>(null)

  function formatDurationBrief(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) return `${hours}sa ${minutes}dk`
    return `${minutes}dk`
  }

  async function computePerformance(days: number): Promise<{ completed: number; seconds: number }> {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) return { completed: 0, seconds: 0 }
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()
    // Completed count: status change to completed by this user in period
    let completed = 0
    try {
      const { data: acts } = await supabase
        .from('task_activities')
        .select('id, details, created_at')
        .eq('user_id', uid)
        .eq('action', 'task_updated')
        .gte('created_at', since)
      type Act = { id: string; details: { status?: { old?: string | null; new?: string | null } } | null; created_at: string }
      const list: Act[] = (acts as Act[] | null) ?? []
      completed = list.filter(a => a.details?.status?.new === 'completed').length
    } catch {}
    // Time spent: sum durations of time logs by this user in period
    let seconds = 0
    try {
      const { data: logs } = await supabase
        .from('task_time_logs')
        .select('start_time, end_time')
        .eq('user_id', uid)
        .gte('start_time', since)
        .order('start_time', { ascending: true })
      const nowMs = Date.now()
      for (const row of (logs || []) as Array<{ start_time: string; end_time: string | null }>) {
        const s = new Date(row.start_time).getTime()
        const e = row.end_time ? new Date(row.end_time).getTime() : nowMs
        if (e > s) seconds += Math.floor((e - s) / 1000)
      }
    } catch {}
    return { completed, seconds }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [w7, w14, w30] = await Promise.all([
          computePerformance(7),
          computePerformance(14),
          computePerformance(30),
        ])
        setPerf7(w7); setPerf14(w14); setPerf30(w30)
      } catch {}
    })()
  }, [])

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

  // Sync board tasks from cache (guard to avoid infinite loops when reference changes)
  useEffect(() => {
    setBoardTasks(prev => {
      if (prev.length === myTasks.length && prev.every((p, i) => p.id === myTasks[i]?.id && p.updated_at === myTasks[i]?.updated_at && p.status === myTasks[i]?.status && (p.position ?? null) === (myTasks[i]?.position ?? null))) {
        return prev
      }
      return myTasks
    })
  }, [myTasks])

  // Load statuses only when involved project ids actually change
  const lastIdsKeyRef = useRef<string>("")
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const uniqueProjectIds = Array.from(new Set(myTasks.map(t => t.project_id)))
        const idsKey = uniqueProjectIds.sort().join(',')
        if (idsKey === lastIdsKeyRef.current) return
        lastIdsKeyRef.current = idsKey
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

  // Subscribe once for realtime project_tasks updates
  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('board_project_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        // cache will update on mutations; could invalidate here if needed
      })
      .subscribe()
    return () => { try { channel.unsubscribe() } catch {} }
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

  const filteredBoardTasks = useMemo(() => {
    if (projectFilter === 'all') return boardTasks
    return boardTasks.filter(t => t.project_id === projectFilter)
  }, [boardTasks, projectFilter])

  const filteredMyTasks = useMemo(() => {
    if (projectFilter === 'all') return myTasks
    return myTasks.filter(t => t.project_id === projectFilter)
  }, [myTasks, projectFilter])

  // Backlog grupları (boşsa tüm görevlerden düş)
  const backlogGroups = useMemo(() => {
    const base = {
      completed: [] as Task[],
      in_progress: [] as Task[],
      review: [] as Task[],
      todo: [] as Task[],
    }
    const source = filteredMyTasks.length > 0 ? filteredMyTasks : myTasks
    for (const t of source) {
      const g = getGroupForTask(t)
      base[g].push(t)
    }
    return base
  }, [filteredMyTasks, myTasks])

  // Overview grid drag-reorder state
  type OverviewId = 'totalProjects' | 'totalTeams' | 'activeProjects' | 'thisMonth'
  const defaultOverview: OverviewId[] = ['totalProjects','totalTeams','activeProjects','thisMonth']
  const [overviewOrder, setOverviewOrder] = useState<OverviewId[]>([...defaultOverview])
  const [dragOverview, setDragOverview] = useState<OverviewId | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const p = await getUserPrefs().catch(() => ({} as UserPrefs))
        const ord = (p as any)?.dashboard?.overviewOrder as OverviewId[] | undefined
        if (ord && Array.isArray(ord) && ord.length) setOverviewOrder(ord)
      } catch {}
    })()
  }, [])

  async function persistOverviewOrder(next: OverviewId[]) {
    try {
      await saveUserPrefs({ dashboard: { overviewOrder: next } } as any)
    } catch {}
  }

  function renderOverviewCard(id: OverviewId) {
    if (id === 'totalProjects') {
      return (
        <Card
          key={id}
          className={`relative overflow-hidden transition-all hover:shadow-md ${editMode ? 'wiggle cursor-move' : ''}`}
          draggable={editMode}
          onDragStart={() => setDragOverview(id)}
          onDragOver={(e) => { if (editMode) e.preventDefault() }}
          onDrop={() => {
            if (!editMode || !dragOverview || dragOverview === id) return
            const from = overviewOrder.indexOf(dragOverview)
            const to = overviewOrder.indexOf(id)
            if (from === -1 || to === -1) return
            const copy = [...overviewOrder]
            const [rm] = copy.splice(from, 1)
            copy.splice(to, 0, rm as OverviewId)
            setOverviewOrder(copy)
            setDragOverview(null)
            persistOverviewOrder(copy)
          }}
        >
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
      )
    }
    if (id === 'totalTeams') {
      return (
        <Card
          key={id}
          className={`relative overflow-hidden transition-all hover:shadow-md ${editMode ? 'wiggle cursor-move' : ''}`}
          draggable={editMode}
          onDragStart={() => setDragOverview(id)}
          onDragOver={(e) => { if (editMode) e.preventDefault() }}
          onDrop={() => {
            if (!editMode || !dragOverview || dragOverview === id) return
            const from = overviewOrder.indexOf(dragOverview)
            const to = overviewOrder.indexOf(id)
            if (from === -1 || to === -1) return
            const copy = [...overviewOrder]
            const [rm] = copy.splice(from, 1)
            copy.splice(to, 0, rm as OverviewId)
            setOverviewOrder(copy)
            setDragOverview(null)
            persistOverviewOrder(copy)
          }}
        >
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
      )
    }
    if (id === 'activeProjects') {
      return (
        <Card
          key={id}
          className={`relative overflow-hidden transition-all hover:shadow-md ${editMode ? 'wiggle cursor-move' : ''}`}
          draggable={editMode}
          onDragStart={() => setDragOverview(id)}
          onDragOver={(e) => { if (editMode) e.preventDefault() }}
          onDrop={() => {
            if (!editMode || !dragOverview || dragOverview === id) return
            const from = overviewOrder.indexOf(dragOverview)
            const to = overviewOrder.indexOf(id)
            if (from === -1 || to === -1) return
            const copy = [...overviewOrder]
            const [rm] = copy.splice(from, 1)
            copy.splice(to, 0, rm as OverviewId)
            setOverviewOrder(copy)
            setDragOverview(null)
            persistOverviewOrder(copy)
          }}
        >
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
      )
    }
    // thisMonth
    return (
      <Card
        key={id}
        className={`relative overflow-hidden transition-all hover:shadow-md ${editMode ? 'wiggle cursor-move' : ''}`}
        draggable={editMode}
        onDragStart={() => setDragOverview(id)}
        onDragOver={(e) => { if (editMode) e.preventDefault() }}
        onDrop={() => {
          if (!editMode || !dragOverview || dragOverview === id) return
          const from = overviewOrder.indexOf(dragOverview)
          const to = overviewOrder.indexOf(id)
          if (from === -1 || to === -1) return
          const copy = [...overviewOrder]
          const [rm] = copy.splice(from, 1)
          copy.splice(to, 0, rm as OverviewId)
          setOverviewOrder(copy)
          setDragOverview(null)
          persistOverviewOrder(copy)
        }}
      >
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
    )
  }

  return (
    <main className="flex flex-1 flex-col w-full px-4 py-3 md:px-6 md:py-4 space-y-6">
      <div className="w-full">
        <DashboardHeader
          title={t('dashboard.breadcrumb.dashboard')}
          breadcrumb={[
            { label: t('dashboard.breadcrumb.home'), href: '/' },
            { label: t('dashboard.breadcrumb.dashboard') },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={editMode ? 'default' : 'outline'}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? 'Bitti' : 'Düzenle'}
              </Button>
              {editMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">Yeni Card Ekle</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Performans</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => addPerfCard('w7')}>Son 7 Gün</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addPerfCard('w14')}>Son 14 Gün</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addPerfCard('w30')}>Son 30 Gün</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Diğer</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { const nv = { ...widgetVisible, upcoming: true }; setWidgetVisible(nv); /* persist later with other edits if needed */ }}>Yakın Vade</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { const nv = { ...widgetVisible, overdue: true }; setWidgetVisible(nv); /* persist later */ }}>Gecikenler</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { const nv = { ...widgetVisible, mini: true }; setWidgetVisible(nv); /* persist later */ }}>Mini Kanban</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        />

            <div className="space-y-6">
                {/* Ana içerik ve sağ sidebar */}
                <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_20rem] xl:items-stretch">
                  {/* Sol taraf - Ana içerik */}
                  <div className="space-y-4 md:space-y-6">
                    {dashboardPrefs.showOverview && (
                    <section className="space-y-3 md:space-y-4">
                      <h2 className="text-base md:text-lg font-semibold">{t('dashboard.overview.title')}</h2>
                      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                        {overviewOrder.map(c => renderOverviewCard(c))}
                      </div>
                    </section>
                    )}

                    {/* Performance section */}
                    {dashboardPrefs.showPerformance && (
                    <section className="space-y-3 md:space-y-4">
                      <h2 className="text-base md:text-lg font-semibold">Performans</h2>
                      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        <Card className={editMode ? 'wiggle' : ''}>
                          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium">Son 7 Gün</CardTitle></CardHeader>
                          <CardContent className="pb-2 sm:pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Görev</div>
                                <div className="text-lg sm:text-xl font-bold">{perf7 ? perf7.completed : '—'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Süre</div>
                                <div className="text-xs sm:text-sm font-medium">{perf7 ? formatDurationBrief(perf7.seconds) : '—'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className={editMode ? 'wiggle' : ''}>
                          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium">Son 14 Gün</CardTitle></CardHeader>
                          <CardContent className="pb-2 sm:pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Görev</div>
                                <div className="text-lg sm:text-xl font-bold">{perf14 ? perf14.completed : '—'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Süre</div>
                                <div className="text-xs sm:text-sm font-medium">{perf14 ? formatDurationBrief(perf14.seconds) : '—'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className={editMode ? 'wiggle' : ''}>
                          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium">Son 30 Gün</CardTitle></CardHeader>
                          <CardContent className="pb-2 sm:pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Görev</div>
                                <div className="text-lg sm:text-xl font-bold">{perf30 ? perf30.completed : '—'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Süre</div>
                                <div className="text-xs sm:text-sm font-medium">{perf30 ? formatDurationBrief(perf30.seconds) : '—'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </section>
                    )}
                  </div>

                  {/* Sağ taraf - Aktiviteler */}
                  {dashboardPrefs.showActivities && (
                  <div className="hidden xl:block h-[400px] overflow-hidden mt-10">
                    <RecentActivities limit={25} compact showHeader={true} className="h-full" />
                  </div>
                  )}
                </div>

                {/* Mobil aktiviteler - alt kısımda */}
                {dashboardPrefs.showActivities && (
                <div className="xl:hidden">
                  <RecentActivities limit={3} compact showHeader={true} />
                </div>
                )}

            {dashboardPrefs.showInvites && (<PendingInvitations />)}

            {/* Board & Backlog kaldırıldı */}
          </div>
        </div>

      {/* Yeni Görev Modalı */}
      <Dialog open={taskModalOpen} onOpenChange={(open) => {
        setTaskModalOpen(open)
        if (open) {
          const def = projectFilter !== 'all' ? projectFilter : (projects[0]?.id ?? '')
          setNewTaskProjectId(def)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Görev</DialogTitle>
          </DialogHeader>
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">Önce bir proje oluşturun.</div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Proje</div>
                <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                  <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {newTaskProjectId && (
                <NewTaskForm
                  projectId={newTaskProjectId}
                  onCreated={() => { setTaskModalOpen(false) }}
                  onCancel={() => setTaskModalOpen(false)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit modal kaldırıldı: düzenleme editMode ile yönetiliyor */}
    </main>
  )
}

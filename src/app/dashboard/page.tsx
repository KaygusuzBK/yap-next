"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { type Task } from "@/features/tasks/api"
import { getSupabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/I18nProvider"
import DashboardHeader from "@/components/layout/DashboardHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Folder, Kanban, Grid3X3, Table, Plus, ListTodo, CheckCircle, Clock, AlertCircle, Target, BarChart3, Activity, Settings, Palette, Layout, GripVertical, Info } from "lucide-react"
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
import TaskKanban from "@/components/tasks/TaskKanban"
import TaskBoard from "@/components/tasks/TaskBoard"
import TaskTable from "@/components/tasks/TaskTable"
import { Context, ContextContent, ContextContentBody, ContextContentHeader, ContextTrigger } from "@/components/ai-elements/context"
// SprintList removed

export default function Page() {
  const { t } = useI18n()
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: teams = [], isLoading: loadingTeams } = useTeams()
  const { data: myTasks = [], isLoading: loadingTasks } = useMyTasks()
  const updateTaskMutation = useUpdateTask()
  // Dashboard görünürlük tercihleri
  const [dashboardPrefs, setDashboardPrefs] = useState<{ showActivities: boolean; showInvites: boolean; showBoard: boolean; showBacklog: boolean }>(
    { showActivities: true, showInvites: true, showBoard: true, showBacklog: true }
  )

  // Kişiselleştirme state'leri
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['summary', 'tasks', 'activities', 'invites'])
  const [widgetSizes, setWidgetSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({
    summary: 'large',
    tasks: 'large', 
    activities: 'medium',
    invites: 'small'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  // Özetteki kartları yeniden sıralamak için state
  const [summaryOrder, setSummaryOrder] = useState<Array<'completed' | 'in_progress' | 'overdue' | 'due_today'>>([
    'completed', 'in_progress', 'overdue', 'due_today'
  ])
  const [draggedSummary, setDraggedSummary] = useState<null | 'completed' | 'in_progress' | 'overdue' | 'due_today'>(null)
  
  // Alttaki 3 kartı yeniden sıralamak için state
  const [bottomCardsOrder, setBottomCardsOrder] = useState<Array<'priority' | 'activity' | 'actions'>>([
    'priority', 'activity', 'actions'
  ])
  const [draggedBottomCard, setDraggedBottomCard] = useState<null | 'priority' | 'activity' | 'actions'>(null)
  
  // Görev görünümü tercihi
  const [taskView, setTaskView] = useState<'kanban' | 'board' | 'table'>('kanban')
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)


  useEffect(() => {
    ;(async () => {
      try {
        const p = await getUserPrefs().catch(() => ({} as UserPrefs))
        const dp = (p as any).dashboard as Partial<typeof dashboardPrefs> | undefined
        const wo = (p as any)?.dashboard?.widgetOrder as string[] | undefined
        const ws = (p as any)?.dashboard?.widgetSizes as Record<string, 'small' | 'medium' | 'large'> | undefined
        const th = (p as any)?.dashboard?.theme as 'light' | 'dark' | 'system' | undefined
        const so = (p as any)?.dashboard?.summaryOrder as Array<'completed' | 'in_progress' | 'overdue' | 'due_today'> | undefined
        const bco = (p as any)?.dashboard?.bottomCardsOrder as Array<'priority' | 'activity' | 'actions'> | undefined
        
        if (dp) setDashboardPrefs(prev => ({ ...prev, ...dp }))
        if (wo && Array.isArray(wo) && wo.length) setWidgetOrder(wo)
        if (ws) setWidgetSizes(prev => ({ ...prev, ...ws }))
        if (th) setTheme(th)
        if (so && Array.isArray(so) && so.length === 4) setSummaryOrder(so)
        if (bco && Array.isArray(bco) && bco.length === 3) setBottomCardsOrder(bco)
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

  // Kişiselleştirme fonksiyonları
  const handleWidgetDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleWidgetDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleWidgetDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    const newOrder = [...widgetOrder]
    const draggedIndex = newOrder.indexOf(draggedWidget)
    const targetIndex = newOrder.indexOf(targetWidgetId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedWidget)
      setWidgetOrder(newOrder)
      saveUserPrefs({ dashboard: { widgetOrder: newOrder } } as any)
    }

    setDraggedWidget(null)
    setIsDragging(false)
  }

  // Summary kartları için drag & drop
  const handleSummaryDragStart = (e: React.DragEvent, id: 'completed' | 'in_progress' | 'overdue' | 'due_today') => {
    if (!editMode) return
    setDraggedSummary(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleSummaryDragOver = (e: React.DragEvent) => {
    if (!editMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleSummaryDrop = (e: React.DragEvent, targetId: 'completed' | 'in_progress' | 'overdue' | 'due_today') => {
    if (!editMode) return
    e.preventDefault()
    if (!draggedSummary || draggedSummary === targetId) return
    const order = [...summaryOrder]
    const from = order.indexOf(draggedSummary)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    order.splice(from, 1)
    order.splice(to, 0, draggedSummary)
    setSummaryOrder(order)
    saveUserPrefs({ dashboard: { summaryOrder: order } } as any)
    setDraggedSummary(null)
  }

  // Alttaki kartlar için drag & drop
  const handleBottomCardDragStart = (e: React.DragEvent, id: 'priority' | 'activity' | 'actions') => {
    if (!editMode) return
    setDraggedBottomCard(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleBottomCardDragOver = (e: React.DragEvent) => {
    if (!editMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleBottomCardDrop = (e: React.DragEvent, targetId: 'priority' | 'activity' | 'actions') => {
    if (!editMode) return
    e.preventDefault()
    if (!draggedBottomCard || draggedBottomCard === targetId) return
    const order = [...bottomCardsOrder]
    const from = order.indexOf(draggedBottomCard)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    order.splice(from, 1)
    order.splice(to, 0, draggedBottomCard)
    setBottomCardsOrder(order)
    saveUserPrefs({ dashboard: { bottomCardsOrder: order } } as any)
    setDraggedBottomCard(null)
  }

  const handleWidgetSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    const newSizes = { ...widgetSizes, [widgetId]: size }
    setWidgetSizes(newSizes)
    saveUserPrefs({ dashboard: { widgetSizes: newSizes } } as any)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    saveUserPrefs({ dashboard: { theme: newTheme } } as any)
    
    // Tema değişikliğini uygula
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System tema - sistem tercihini takip et
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
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

  const getGroupForTask = useCallback((task: Task): "todo" | "in_progress" | "review" | "completed" => {
    const statuses = statusesByProject[task.project_id]
    if (statuses && statuses.length > 0) {
      const def = statuses.find(s => s.key === task.status)
      if (def) return def.group
    }
    // Fallback for legacy keys
    if (task.status === 'in_progress' || task.status === 'review' || task.status === 'completed') return task.status
    return 'todo'
  }, [statusesByProject])

  // Özet istatistikleri
  const summaryStats = useMemo(() => {
    if (!myTasks || myTasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        dueTodayTasks: 0,
        dueThisWeekTasks: 0,
        urgentTasks: 0,
        highPriorityTasks: 0,
        completionRate: 0,
        avgTasksPerProject: 0,
        mostActiveProject: null as string | null,
        recentActivity: 0
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    let totalTasks = myTasks.length
    let completedTasks = 0
    let inProgressTasks = 0
    let overdueTasks = 0
    let dueTodayTasks = 0
    let dueThisWeekTasks = 0
    let urgentTasks = 0
    let highPriorityTasks = 0
    let recentActivity = 0

    const projectTaskCounts: Record<string, number> = {}

    myTasks.forEach(task => {
      // Durum sayıları
      const group = getGroupForTask(task)
      if (group === 'completed') completedTasks++
      if (group === 'in_progress') inProgressTasks++

      // Öncelik sayıları
      if (task.priority === 'urgent') urgentTasks++
      if (task.priority === 'high') highPriorityTasks++

      // Tarih kontrolü
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
        
        if (dueDateOnly < today) overdueTasks++
        if (dueDateOnly.getTime() === today.getTime()) dueTodayTasks++
        if (dueDateOnly >= today && dueDateOnly <= weekFromNow) dueThisWeekTasks++
      }

      // Proje aktivitesi
      if (task.project_id) {
        projectTaskCounts[task.project_id] = (projectTaskCounts[task.project_id] || 0) + 1
      }

      // Son 7 gün aktivitesi (basit kontrol)
      const createdDate = new Date(task.created_at)
      if (createdDate >= sevenDaysAgo) recentActivity++
    })

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const avgTasksPerProject = projects.length > 0 ? Math.round(totalTasks / projects.length) : 0
    
    // En aktif proje
    const mostActiveProjectId = Object.keys(projectTaskCounts).reduce((a, b) => 
      (projectTaskCounts[a] || 0) > (projectTaskCounts[b] || 0) ? a : b, Object.keys(projectTaskCounts)[0] || ''
    )
    const mostActiveProject = mostActiveProjectId ? projects.find(p => p.id === mostActiveProjectId)?.title || null : null

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueTodayTasks,
      dueThisWeekTasks,
      urgentTasks,
      highPriorityTasks,
      completionRate,
      avgTasksPerProject,
      mostActiveProject,
      recentActivity
    }
  }, [myTasks, projects, getGroupForTask])

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
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    if (projectFilter === 'overdue') {
      return boardTasks.filter(t => t.due_date && new Date(t.due_date) < start)
    }
    if (projectFilter === 'today') {
      return boardTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return d >= start && d < end
      })
    }
    return boardTasks.filter(t => t.project_id === projectFilter)
  }, [boardTasks, projectFilter])

  const filteredMyTasks = useMemo(() => {
    if (projectFilter === 'all') return myTasks
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    if (projectFilter === 'overdue') {
      return myTasks.filter(t => t.due_date && new Date(t.due_date) < start)
    }
    if (projectFilter === 'today') {
      return myTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return d >= start && d < end
      })
    }
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
  }, [filteredMyTasks, myTasks, getGroupForTask])



  // Widget boyutları için CSS sınıfları
  const getWidgetSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'medium': return 'col-span-2'
      case 'large': return 'col-span-4'
      default: return 'col-span-4'
    }
  }

  return (
    <main className="flex flex-1 flex-col w-full px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 space-y-4 sm:space-y-6">
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
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
{t('dashboard.controls.settings')}
              </Button>
              <Button
                size="sm"
                variant={editMode ? 'default' : 'outline'}
                onClick={() => {
                  if (editMode) {
                    // Düzenleme modundan çıkarken tüm drag state'lerini temizle
                    setDraggedWidget(null)
                    setIsDragging(false)
                    setDraggedSummary(null)
                    setDraggedBottomCard(null)
                  }
                  setEditMode((v) => !v)
                }}
              >
{editMode ? t('dashboard.controls.done') : t('dashboard.controls.edit')}
              </Button>
            </div>
          )}
        />

            <div className="space-y-6">
                {/* Ana içerik ve sağ sidebar */}
                <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_18rem] xl:grid-cols-[1fr_20rem] xl:items-stretch">
                  {/* Sol taraf - Ana içerik */}
                  <div className="space-y-4 md:space-y-6 min-w-0">


                    {/* Özet Bölümü */}
                    <section 
                      className={`space-y-4 ${editMode ? 'cursor-move' : ''} ${isDragging ? 'opacity-50' : ''} ${getWidgetSizeClass(widgetSizes.summary || 'medium')}`}
                      draggable={editMode}
                      onDragStart={(e) => handleWidgetDragStart(e, 'summary')}
                      onDragOver={handleWidgetDragOver}
                      onDrop={(e) => handleWidgetDrop(e, 'summary')}
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
{t('dashboard.summary.title')}
                          {editMode && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                        </h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {summaryStats.totalTasks} Toplam Görev
                          </Badge>
                          {editMode && (
                            <Select
                              value={widgetSizes.summary}
                              onValueChange={(value) => handleWidgetSizeChange('summary', value as 'small' | 'medium' | 'large')}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">{t('dashboard.controls.size.small')}</SelectItem>
                                <SelectItem value="medium">{t('dashboard.controls.size.medium')}</SelectItem>
                                <SelectItem value="large">{t('dashboard.controls.size.large')}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      
                      <div className={`grid gap-3 ${widgetSizes.summary === 'small' ? 'grid-cols-1' : widgetSizes.summary === 'medium' ? 'grid-cols-2' : 'grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'} min-w-0`}>
                        {summaryOrder.map((id) => (
                          <div
                            key={id}
                            draggable={editMode}
                            onDragStart={(e) => handleSummaryDragStart(e, id)}
                            onDragOver={handleSummaryDragOver}
                            onDrop={(e) => handleSummaryDrop(e, id)}
                            className={editMode ? 'cursor-move' : ''}
                          >
                            {id === 'completed' && (
                              <Card className="relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">{t('dashboard.summary.completed')}</CardTitle>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-green-600">{summaryStats.completedTasks}</div>
                                  <div className="text-xs text-muted-foreground">%{summaryStats.completionRate} {t('dashboard.summary.completionRate')}</div>
                                </CardContent>
                              </Card>
                            )}
                            {id === 'in_progress' && (
                              <Card className="relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">{t('dashboard.summary.inProgress')}</CardTitle>
                                  <Activity className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-blue-600">{summaryStats.inProgressTasks}</div>
                                  <div className="text-xs text-muted-foreground">{t('dashboard.summary.activeTasks')}</div>
                                </CardContent>
                              </Card>
                            )}
                            {id === 'overdue' && (
                              <Card className="relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">{t('dashboard.summary.overdue')}</CardTitle>
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-red-600">{summaryStats.overdueTasks}</div>
                                  <div className="text-xs text-muted-foreground">{t('dashboard.summary.urgentAction')}</div>
                                </CardContent>
                              </Card>
                            )}
                            {id === 'due_today' && (
                              <Card className="relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">{t('dashboard.summary.dueToday')}</CardTitle>
                                  <Clock className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-orange-600">{summaryStats.dueTodayTasks}</div>
                                  <div className="text-xs text-muted-foreground">{t('dashboard.summary.dueTodayDesc')}</div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        ))}
                      </div>

          {/* İkinci satır - Detaylı istatistikler */}
          <div className={`grid gap-3 ${widgetSizes.summary === 'small' ? 'grid-cols-1' : widgetSizes.summary === 'medium' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} min-w-0`}>
                        {bottomCardsOrder.map((id) => (
                          <div
                            key={id}
                            draggable={editMode}
                            onDragStart={(e) => handleBottomCardDragStart(e, id)}
                            onDragOver={handleBottomCardDragOver}
                            onDrop={(e) => handleBottomCardDrop(e, id)}
                            className={editMode ? 'cursor-move' : ''}
                          >
                            {id === 'priority' && (
                              <Card className="h-full flex flex-col">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Target className="h-4 w-4" />
{t('dashboard.cards.priority.title')}
                                    {editMode && <GripVertical className="h-4 w-4 text-muted-foreground ml-auto" />}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t('dashboard.cards.priority.urgent')}</span>
                                    <Badge variant="destructive" className="text-xs">
                                      {summaryStats.urgentTasks}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t('dashboard.cards.priority.high')}</span>
                                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                      {summaryStats.highPriorityTasks}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t('dashboard.cards.priority.thisWeek')}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {summaryStats.dueThisWeekTasks}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            {id === 'activity' && (
                              <Card className="h-full flex flex-col">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Folder className="h-4 w-4" />
{t('dashboard.cards.activity.title')}
                                    {editMode && <GripVertical className="h-4 w-4 text-muted-foreground ml-auto" />}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t('dashboard.cards.activity.avgTasksPerProject')}</span>
                                    <span className="text-sm font-medium">{summaryStats.avgTasksPerProject}</span>
                                  </div>
                                  {summaryStats.mostActiveProject && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">{t('dashboard.cards.activity.mostActiveProject')}</span>
                                      <span className="text-sm font-medium truncate max-w-[120px]" title={summaryStats.mostActiveProject}>
                                        {summaryStats.mostActiveProject}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{t('dashboard.cards.activity.last7Days')}</span>
                                    <span className="text-sm font-medium">{summaryStats.recentActivity} {t('dashboard.cards.activity.newTasks')}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            {id === 'actions' && (
                              <Card className="h-full flex flex-col">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
{t('dashboard.cards.actions.title')}
                                    {editMode && <GripVertical className="h-4 w-4 text-muted-foreground ml-auto" />}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 flex-1">
                                  <Button 
                                    size="sm" 
                                    className="w-full justify-start" 
                                    variant="outline"
                                    onClick={() => setTaskModalOpen(true)}
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
{t('dashboard.cards.actions.addTask')}
                                  </Button>
                                  {summaryStats.overdueTasks > 0 && (
                                    <Button 
                                      size="sm" 
                                      className="w-full justify-start" 
                                      variant="destructive"
                                      onClick={() => setProjectFilter("overdue")}
                                    >
                                      <AlertCircle className="h-3 w-3 mr-2" />
                                      Gecikenleri Göster
                                    </Button>
                                  )}
                                  {summaryStats.dueTodayTasks > 0 && (
                                    <Button 
                                      size="sm" 
                                      className="w-full justify-start" 
                                      variant="outline"
                                      onClick={() => setProjectFilter("today")}
                                    >
                                      <Clock className="h-3 w-3 mr-2" />
{t('dashboard.cards.actions.viewDueToday')}
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
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

            {/* Sprint section removed */}

            {/* Görev Görünümleri */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Görevlerim</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Tabs value={taskView} onValueChange={(value) => setTaskView(value as 'kanban' | 'board' | 'table')} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto overflow-x-auto no-scrollbar">
                      <TabsTrigger value="kanban" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" title="Kanban görünümü - Görevleri kolonlar halinde yönetin">
                        <Kanban className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Kanban</span>
                      </TabsTrigger>
                      <TabsTrigger value="board" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" title="Pano görünümü - Görevleri daha geniş alanda görün">
                        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Pano</span>
                      </TabsTrigger>
                      <TabsTrigger value="table" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" title="Tablo görünümü - Görevleri sıralama ve filtreleme ile listeleyin">
                        <Table className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Tablo</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex items-center gap-2">
                    {/* Hover detay ikonu */}
                    <Context usedTokens={summaryStats.totalTasks} maxTokens={Math.max(1, summaryStats.totalTasks)}>
                      <ContextTrigger>
                        <Button variant="ghost" size="icon" aria-label="Detay">
                          <Info className="h-4 w-4" />
                        </Button>
                      </ContextTrigger>
                      <ContextContent align="start">
                        <ContextContentHeader>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Genel Bakış</span>
                            <span className="font-medium">Görev Özeti</span>
                          </div>
                        </ContextContentHeader>
                        <ContextContentBody>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between"><span className="text-muted-foreground">Gecikmiş</span><span className="font-medium">{summaryStats.overdueTasks}</span></div>
                            <div className="flex items-center justify-between"><span className="text-muted-foreground">Bugün</span><span className="font-medium">{summaryStats.dueTodayTasks}</span></div>
                            <div className="flex items-center justify-between"><span className="text-muted-foreground">Toplam</span><span className="font-medium">{summaryStats.totalTasks}</span></div>
                          </div>
                        </ContextContentBody>
                      </ContextContent>
                    </Context>
                  <Button
                    size="sm"
                    onClick={() => {
                      if ((projects ?? []).length === 0) {
                        toast.info('Önce bir proje oluşturun.');
                        // Açık "Yeni Görev" yerine proje oluşturma deneyimi verelim
                        // Dashboard genelinde proje oluşturma modali yok; hızlı yönlendirme:
                        const el = document.querySelector('[data-tour="create-project"]') as HTMLElement | null
                        if (el) el.click();
                        return;
                      }
                      setTaskModalOpen(true)
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Görev
                  </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 overflow-x-auto">
                {loadingTasks ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : myTasks && myTasks.length > 0 ? (
                  <>
                    {taskView === 'kanban' && (
                      <div className="min-w-[720px]">
                        <TaskKanban
                        tasks={filteredMyTasks}
                        statusesByProject={statusesByProject}
                        onTaskUpdate={(taskId, updates) => {
                          updateTaskMutation.mutate({ id: taskId, ...updates })
                        }}
                        getGroupForTask={getGroupForTask}
                        getDefaultKeyForGroup={getDefaultKeyForGroup}
                        projects={projects}
                        />
                      </div>
                    )}
                    
                    {taskView === 'board' && (
                      <div className="min-w-[720px]">
                        <TaskBoard
                        tasks={filteredMyTasks}
                        statusesByProject={statusesByProject}
                        onTaskUpdate={(taskId, updates) => {
                          updateTaskMutation.mutate({ id: taskId, ...updates })
                        }}
                        getGroupForTask={getGroupForTask}
                        projects={projects}
                        />
                      </div>
                    )}
                    
                    {taskView === 'table' && (
                      <div className="min-w-[720px]">
                        <TaskTable
                        tasks={filteredMyTasks}
                        statusesByProject={statusesByProject}
                        onTaskUpdate={(taskId, updates) => {
                          updateTaskMutation.mutate({ id: taskId, ...updates })
                        }}
                        getGroupForTask={getGroupForTask}
                        projects={projects}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <ListTodo className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-lg font-medium">Henüz görev yok</p>
                      <p className="text-sm">İlk görevinizi oluşturmak için yukarıdaki butona tıklayın</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
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
            <div className="text-center py-6 space-y-3">
              <div className="text-sm text-muted-foreground">Önce bir proje oluşturun.</div>
              <Button onClick={() => {
                const el = document.querySelector('[data-tour="create-project"]') as HTMLElement | null
                if (el) el.click();
              }}>Yeni Proje Oluştur</Button>
            </div>
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

      {/* Ayarlar Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
{t('dashboard.settings.title')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tema Seçimi */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
{t('dashboard.settings.theme')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300" />
{t('dashboard.settings.light')}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600" />
{t('dashboard.settings.dark')}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('system')}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-gray-800 border-2 border-gray-300" />
{t('dashboard.settings.system')}
                </Button>
              </div>
            </div>

            {/* Widget Görünürlüğü */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Layout className="h-4 w-4" />
{t('dashboard.settings.widgetVisibility')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('dashboard.settings.taskSummary')}</span>
                  <Switch
                    checked={dashboardPrefs.showBoard}
                    onCheckedChange={(checked) => saveDashboardPrefs({ showBoard: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('dashboard.settings.activities')}</span>
                  <Switch
                    checked={dashboardPrefs.showActivities}
                    onCheckedChange={(checked) => saveDashboardPrefs({ showActivities: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('dashboard.settings.invites')}</span>
                  <Switch
                    checked={dashboardPrefs.showInvites}
                    onCheckedChange={(checked) => saveDashboardPrefs({ showInvites: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Widget Sıralama */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
{t('dashboard.settings.widgetOrdering')}
              </h3>
              <div className="text-sm text-muted-foreground">
{t('dashboard.settings.editModeDescription')}
              </div>
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="w-full"
              >
{t('dashboard.settings.openEditMode')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

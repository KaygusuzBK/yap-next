"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Plus, Folder, Target } from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/lib/store/auth"
import { useUserStore } from "@/lib/store/user"
import { getSupabase } from "@/lib/supabase"
import { updateTeamName, deleteTeam, setTeamPrimaryProject, inviteToTeam, getPendingInvitations, fetchTeams } from "@/features/teams/api"
import { updateTask } from "@/features/tasks/api"
import { useSidebarData } from "./sidebar/hooks/useSidebarData"

import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { SidebarInput } from "@/components/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

// Import sections
import { TeamsSection } from "./sidebar/TeamsSection"
import { ProjectsSection } from "./sidebar/ProjectsSection"
import { TasksSection } from "./sidebar/TasksSection"
import { PerformanceSection } from "./sidebar/PerformanceSection"
import { SidebarModals } from "./sidebar/modals/SidebarModals"
import CalendarSidebar from "./sidebar/CalendarSidebar"
import NotificationsBell from "./NotificationsBell"
import { NavUser } from "./nav-user"

// Import types
import type { TeamStat, PerformanceData, PendingInvite, NavItem } from "./sidebar/types"

// Navigation data
const navData: NavItem[] = [
  {
    title: "Görevlerim",
    url: "/dashboard#tasks",
    icon: () => <div>📋</div>,
    isActive: true,
  },
  {
    title: "Projeler",
    url: "/dashboard#projects",
    icon: () => <div>📁</div>,
    isActive: false,
  },
  {
    title: "Takımlar",
    url: "/dashboard#teams",
    icon: () => <div>👥</div>,
    isActive: false,
  },
  {
    title: "Entegrasyonlar",
    url: "/dashboard/integrations",
    icon: () => <div>🔗</div>,
    isActive: false,
  },
  {
    title: "Takvim",
    url: "/dashboard/tasks/calendar",
    icon: () => <div>📅</div>,
    isActive: false,
  },
  {
    title: "Performans",
    url: "/dashboard/performance-reports",
    icon: () => <div>📊</div>,
    isActive: false,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const currentPath = pathname || ''

  // Auth state
  const authUser = useAuthStore(s => s.user)
  const profileName = useUserStore(s => s.name)
  const profileEmail = useUserStore(s => s.email)

  // Sidebar data
  const {
    projectStats,
    taskStats,
    myTasksView,
    setMyTasksView,
    nearestTask,
    loadingProjects,
    projectError,
    loadingTasks,
    taskError,
    qc
  } = useSidebarData()

  // Active item state
  const [activeItem, setActiveItem] = React.useState(navData[0])
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)

  // Team state
  const [teamStats, setTeamStats] = React.useState<TeamStat[]>([])
  const [loadingTeams, setLoadingTeams] = React.useState(false)
  const [teamError, setTeamError] = React.useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([])

  // Modal states
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [assignProjectId, setAssignProjectId] = React.useState<string | null>(null)
  const [teamProjects, setTeamProjects] = React.useState<Array<{ id: string; title: string }>>([])
  const [addMemberOpen, setAddMemberOpen] = React.useState(false)
  const [memberEmail, setMemberEmail] = React.useState("")
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [taskProjectId, setTaskProjectId] = React.useState<string | null>(null)
  const [myTasksOpen, setMyTasksOpen] = React.useState(false)

  // Rename states
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Calendar states
  const [calendarView, setCalendarView] = React.useState<'month' | 'week' | 'day'>('month')
  const [calendarDate, setCalendarDate] = React.useState<Date>(new Date())

  // Task filter states
  const [taskStatusFilter, setTaskStatusFilter] = React.useState<'all' | 'open' | 'completed'>('all')
  const [taskDueFilter, setTaskDueFilter] = React.useState<'all' | 'overdue' | 'today' | 'week'>('all')
  const [taskPriorityFilter, setTaskPriorityFilter] = React.useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')
  const [taskSortBy, setTaskSortBy] = React.useState<'smart' | 'due' | 'priority'>('smart')

  // Performance states
  const [performanceData, setPerformanceData] = React.useState<PerformanceData | null>(null)
  const [loadingPerformance, setLoadingPerformance] = React.useState(false)
  const [performanceError, setPerformanceError] = React.useState<string | null>(null)

  // Drag & Drop states
  const [dragType, setDragType] = React.useState<null | 'team' | 'project' | 'task'>(null)
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  // Sync selectedTaskId with route path
  React.useEffect(() => {
    const match = currentPath.match(/\/dashboard\/tasks\/(.+)$/)
    if (match && match[1]) {
      setSelectedTaskId(match[1])
    } else if (!currentPath.includes('/dashboard/tasks/')) {
      setSelectedTaskId(null)
    }
  }, [currentPath])

  // Set active item based on hash
  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const found = navData.find((i) => i.url.endsWith(hash))
    if (found) setActiveItem(found)
  }, [])

  // Fetch pending invitations
  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        const list = await getPendingInvitations()
        setPendingInvites(list as PendingInvite[])
      } catch { 
        setPendingInvites([]) 
      }
    }
    fetchPending()
  }, [])

  // Fetch team stats
  const fetchTeamStats = React.useCallback(async () => {
    try {
      setLoadingTeams(true)
      setTeamError(null)
      // Sadece kullanıcının sahibi olduğu veya üyesi olduğu takımlar
      const teams = await fetchTeams()

      if ((teams ?? []).length === 0) {
        setTeamStats([])
        return
      }

      const supabase = getSupabase()
      const { data: projects } = await supabase
        .from("projects")
        .select("id,title,team_id")
        .in("team_id", teams.map(t => t.id))

      const teamIdToProjectTitle = new Map<string, string>()
      ;(projects ?? []).forEach((p) => {
        if (!teamIdToProjectTitle.has(p.team_id)) {
          teamIdToProjectTitle.set(p.team_id, p.title)
        }
      })

      setTeamStats(teams.map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: null,
        projectTitle: teamIdToProjectTitle.get(t.id) ?? null,
      })))
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : "Takım verileri alınamadı")
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  // Fetch performance data
  const fetchPerformanceData = React.useCallback(async () => {
    if (activeItem?.title !== "Performans") return
    
    try {
      setLoadingPerformance(true)
      setPerformanceError(null)
      const supabase = getSupabase()
      
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('id, status, created_by, project_id, created_at, updated_at')
      
      if (tasksError) throw new Error(`Görevler yüklenemedi: ${tasksError.message}`)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      setPerformanceData({
        totalTasks,
        completedTasks,
        completionRate,
        teamStats: [],
        projectStats: []
      })
    } catch (error) {
      setPerformanceError(error instanceof Error ? error.message : 'Veri yüklenirken hata oluştu')
    } finally {
      setLoadingPerformance(false)
    }
  }, [activeItem?.title])

  // Load team stats when teams is active
  React.useEffect(() => {
    if (activeItem?.title === "Takımlar") {
      fetchTeamStats()
    }
  }, [activeItem, fetchTeamStats])

  // Load performance data when performance is active
  React.useEffect(() => {
    fetchPerformanceData()
  }, [fetchPerformanceData])

  // Realtime updates
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('sidebar-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        qc.invalidateQueries({ queryKey: ['tasks'] }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        qc.invalidateQueries({ queryKey: ['projects'] }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, () => {
        qc.invalidateQueries({ queryKey: ['projects'] }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, () => {
        qc.invalidateQueries({ queryKey: ['tasks'] }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_activities' }, () => {
        qc.invalidateQueries({ queryKey: ['tasks'] }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])

  // Event handlers
  const handleNavClick = React.useCallback((item: NavItem) => {
    setActiveItem(item)
    setOpen(true)
  }, [setOpen])

  const onOpenRename = React.useCallback((teamId: string, currentName: string) => {
    setSelectedTeamId(teamId)
    setRenameValue(currentName)
    setRenameOpen(true)
  }, [])

  const onDeleteTeam = React.useCallback(async (teamId: string) => {
    if (!confirm("Takımı silmek istediğinize emin misiniz?")) return
    await deleteTeam(teamId)
    fetchTeamStats()
  }, [fetchTeamStats])

  const onAssignProject = React.useCallback(async (teamId: string) => {
    setSelectedTeamId(teamId)
    setAssignProjectId(null)
    const supabase = getSupabase()
    const { data } = await supabase
      .from("projects")
      .select("id,title")
      .eq("team_id", teamId)
    setTeamProjects(data ?? [])
    setAssignOpen(true)
  }, [])

  const onAddMember = React.useCallback((teamId: string) => {
    setSelectedTeamId(teamId)
    setAddMemberOpen(true)
  }, [])

  const onTaskSelect = React.useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    router.push(`/dashboard/tasks/${taskId}`)
  }, [router])

  const onTaskStatusChange = React.useCallback(async (taskId: string, status: string) => {
    try {
      await updateTask({ id: taskId, status })
      await qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (e) {
      console.error('Durum güncellenemedi', e)
    }
  }, [qc])

  const onTaskCreated = React.useCallback(async () => {
    setCreateTaskOpen(false)
    setTaskProjectId(null)
    if (activeItem?.title === "Görevlerim") {
      await qc.invalidateQueries({ queryKey: ['tasks'] })
    }
  }, [activeItem?.title, qc])

  const onRenameTeam = React.useCallback(async () => {
    if (!selectedTeamId) return
    try {
      setSaving(true)
      await updateTeamName({ team_id: selectedTeamId, name: renameValue.trim() })
      setRenameOpen(false)
      fetchTeamStats()
    } finally {
      setSaving(false)
    }
  }, [selectedTeamId, renameValue, fetchTeamStats])

  const onAssignProjectConfirm = React.useCallback(async () => {
    if (!selectedTeamId || !assignProjectId) return
    await setTeamPrimaryProject({ team_id: selectedTeamId, project_id: assignProjectId })
    setAssignOpen(false)
    fetchTeamStats()
  }, [selectedTeamId, assignProjectId, fetchTeamStats])

  const onAddMemberConfirm = React.useCallback(async () => {
    if (!selectedTeamId || !memberEmail.trim()) return
    try {
      setSaving(true)
      await inviteToTeam({ 
        team_id: selectedTeamId, 
        email: memberEmail.trim(),
        role: "member"
      })
      setAddMemberOpen(false)
      setMemberEmail("")
      fetchTeamStats()
    } catch (error) {
      console.error("Üye ekleme hatası:", error)
      toast.error("Üye eklenirken bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setSaving(false)
    }
  }, [selectedTeamId, memberEmail, fetchTeamStats])

  // Drag & Drop handlers
  const onDragStartGeneric = React.useCallback((type: 'team' | 'project' | 'task', index: number) => {
    setDragType(type)
    setDragIndex(index)
  }, [])

  const onDragOverGeneric = React.useCallback((e: React.DragEvent, type: 'team' | 'project' | 'task', index: number) => {
    if (dragType === type) {
      e.preventDefault()
      setDragOverIndex(index)
    }
  }, [dragType])

  const onDropGeneric = React.useCallback((type: 'team' | 'project' | 'task', index: number) => {
    // Simplified drag & drop for now
    setDragType(null)
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  // Context menu handlers
  const handleCreateTeam = React.useCallback(() => {
    setCreateOpen(true)
  }, [])

  const handleRefreshTeams = React.useCallback(() => {
    fetchTeamStats()
  }, [fetchTeamStats])

  // Active section checks
  const isTasksActive = activeItem?.title === "Görevlerim"
  const isCalendarActive = activeItem?.title === "Takvim"
  const isTeamsActive = activeItem?.title === "Takımlar"
  const isProjectsActive = activeItem?.title === "Projeler"
  const isPerformanceActive = activeItem?.title === "Performans"
  const isIntegrationsActive = activeItem?.title === "Entegrasyonlar"

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Sidebar
          collapsible="icon"
          className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
          {...props}
        >
          {/* Icon Sidebar */}
          <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                    <Logo size={16} className="scale-120" withLink={false} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent className="px-1.5 md:px-0">
                  <SidebarMenu>
                    {navData.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          tooltip={{ children: item.title, hidden: false }}
                          onClick={() => handleNavClick(item)}
                          isActive={activeItem?.title === item.title}
                          className="px-2.5 md:px-2"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div className="px-2 pb-1">
                <NotificationsBell userId={authUser?.id || ''} />
              </div>
              <NavUser user={{
                name: profileName || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'Kullanıcı',
                email: profileEmail || authUser?.email || '—',
                avatar: '',
              }} />
            </SidebarFooter>
          </Sidebar>

          {/* Main Sidebar */}
          <Sidebar collapsible="none" className="hidden flex-1 md:flex">
            <SidebarHeader className="gap-3.5 border-b p-4">
              <div className="flex w-full items-center justify-between">
                <div className="text-foreground text-base font-medium">
                  {activeItem?.title}
                </div>
                <div className="flex items-center gap-2">
                  {isTeamsActive && (
                    <>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setCreateTeamOpen(true)} title="Takım Oluştur">
                        <Plus className="size-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => router.push('/dashboard/teams')} title="Takımlar sayfası">
                        <Folder className="size-4" />
                      </Button>
                    </>
                  )}
                  {isProjectsActive && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setCreateProjectOpen(true)}
                      title="Proje Oluştur"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                  {isTasksActive && (
                    <div className="flex items-center gap-2">
                      {nearestTask && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/tasks/${nearestTask.id}`)}
                          className="h-8 w-8 rounded-full border-2 hover:bg-blue-600 hover:text-white transition-all duration-200 hover:scale-105"
                          title={`En yakın göreve git: ${nearestTask.title}`}
                        >
                          <Target className="size-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        data-tour="create-task"
                        onClick={() => {
                          if ((projectStats ?? []).length === 0) {
                            toast.info('Önce bir proje oluşturun.');
                            setCreateProjectOpen(true)
                            return
                          }
                          setTaskProjectId(projectStats[0]?.id ?? null)
                          setCreateTaskOpen(true)
                        }}
                        className="h-8 w-8 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <SidebarInput placeholder="Type to search..." />
            </SidebarHeader>
            <SidebarContent className="overflow-auto">
              <SidebarGroup className="px-0">
                <SidebarGroupContent>
                  {isTeamsActive ? (
                    <div className="p-4 min-h-0">
                      {teamStats.length === 0 && !loadingTeams && !teamError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                          <div className="text-sm text-muted-foreground">Henüz takım yok.</div>
                          <Button onClick={() => setCreateTeamOpen(true)}>
                            Yeni Takım Oluştur
                          </Button>
                        </div>
                      ) : (
                        <TeamsSection
                          teamStats={teamStats}
                          loadingTeams={loadingTeams}
                          teamError={teamError}
                          pendingInvites={pendingInvites}
                          onOpenRename={onOpenRename}
                          onDelete={onDeleteTeam}
                          onAssignProject={onAssignProject}
                          onAddMember={onAddMember}
                          onSelect={(id) => router.push(`/dashboard/teams/${id}`)}
                          onDragStart={onDragStartGeneric}
                          onDragOver={onDragOverGeneric}
                          onDrop={onDropGeneric}
                          dragType={dragType}
                          dragOverIndex={dragOverIndex}
                        />
                      )}
                    </div>
                  ) : isPerformanceActive ? (
                    <div className="p-4 min-h-0">
                      <PerformanceSection
                        performanceData={performanceData}
                        loadingPerformance={loadingPerformance}
                        performanceError={performanceError}
                        onRetry={fetchPerformanceData}
                      />
                    </div>
                  ) : isCalendarActive ? (
                    <CalendarSidebar
                      currentDate={calendarDate}
                      onDateChange={setCalendarDate}
                      view={calendarView}
                      onViewChange={setCalendarView}
                    />
                  ) : isProjectsActive ? (
                    <div className="p-4 min-h-0">
                      {projectStats.length === 0 && !loadingProjects && !projectError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                          <div className="text-sm text-muted-foreground">Henüz proje yok.</div>
                          <Button onClick={() => setCreateProjectOpen(true)}>
                            Yeni Proje Oluştur
                          </Button>
                        </div>
                      ) : (
                        <ProjectsSection
                          projectStats={projectStats}
                          taskStats={taskStats}
                          loadingProjects={loadingProjects}
                          projectError={projectError}
                          onSelect={(id) => router.push(`/dashboard/projects/${id}`)}
                          onDragStart={onDragStartGeneric}
                          onDragOver={onDragOverGeneric}
                          onDrop={onDropGeneric}
                          dragType={dragType}
                          dragOverIndex={dragOverIndex}
                        />
                      )}
                    </div>
                  ) : isTasksActive ? (
                    <div className="p-4 min-h-0">
                      {taskStats.length === 0 && !loadingTasks && !taskError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                          <div className="text-sm text-muted-foreground">Henüz görev yok.</div>
                          <Button onClick={() => { setTaskProjectId(projectStats[0]?.id ?? null); setCreateTaskOpen(true) }}>
                            İlk Görevini Oluştur
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 flex items-center gap-2 text-xs">
                            <button
                              className={`px-2 py-1 rounded border ${myTasksView === 'assigned' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                              onClick={() => setMyTasksView('assigned')}
                            >
                              Bana atananlar
                            </button>
                            <button
                              className={`px-2 py-1 rounded border ${myTasksView === 'created' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                              onClick={() => setMyTasksView('created')}
                            >
                              Oluşturduklarım
                            </button>
                            <button
                              className={`px-2 py-1 rounded border ${myTasksView === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                              onClick={() => setMyTasksView('all')}
                            >
                              Tümü
                            </button>
                          </div>
                          <TasksSection
                            taskStats={taskStats}
                            loadingTasks={loadingTasks}
                            taskError={taskError}
                            selectedTaskId={selectedTaskId}
                            currentPath={currentPath}
                            onSelect={onTaskSelect}
                            onStatusChange={onTaskStatusChange}
                            onMyTasksOpen={() => setMyTasksOpen(true)}
                            taskStatusFilter={taskStatusFilter}
                            taskDueFilter={taskDueFilter}
                            taskPriorityFilter={taskPriorityFilter}
                            taskSortBy={taskSortBy}
                            onStatusFilterChange={setTaskStatusFilter}
                            onDueFilterChange={setTaskDueFilter}
                            onPriorityFilterChange={setTaskPriorityFilter}
                            onSortByChange={setTaskSortBy}
                          />
                        </>
                      )}
                    </div>
                  ) : isIntegrationsActive ? (
                    <div className="p-4 min-h-0">
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <div className="text-sm text-muted-foreground">Entegrasyonlar sayfasına yönlendiriliyorsunuz...</div>
                        <Button onClick={() => router.push('/dashboard/integrations')}>
                          Entegrasyonları Aç
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>Henüz bildirim yok</p>
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          {/* Modals */}
          <SidebarModals
            createOpen={createOpen}
            setCreateOpen={setCreateOpen}
            createTeamOpen={createTeamOpen}
            setCreateTeamOpen={setCreateTeamOpen}
            renameOpen={renameOpen}
            setRenameOpen={setRenameOpen}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            selectedTeamId={selectedTeamId}
            saving={saving}
            setSaving={setSaving}
            onRenameTeam={onRenameTeam}
            onDeleteTeam={onDeleteTeam}
            fetchTeamStats={fetchTeamStats}
            createProjectOpen={createProjectOpen}
            setCreateProjectOpen={setCreateProjectOpen}
            assignOpen={assignOpen}
            setAssignOpen={setAssignOpen}
            assignProjectId={assignProjectId}
            setAssignProjectId={setAssignProjectId}
            teamProjects={teamProjects}
            onAssignProject={onAssignProjectConfirm}
            createTaskOpen={createTaskOpen}
            setCreateTaskOpen={setCreateTaskOpen}
            taskProjectId={taskProjectId}
            setTaskProjectId={setTaskProjectId}
            myTasksOpen={myTasksOpen}
            setMyTasksOpen={setMyTasksOpen}
            taskStats={taskStats}
            projectStats={projectStats}
            onTaskSelect={onTaskSelect}
            onTaskStatusChange={onTaskStatusChange}
            onTaskCreated={onTaskCreated}
            isTasksActive={isTasksActive}
            addMemberOpen={addMemberOpen}
            setAddMemberOpen={setAddMemberOpen}
            memberEmail={memberEmail}
            setMemberEmail={setMemberEmail}
            onAddMember={onAddMemberConfirm}
            taskStatusFilter={taskStatusFilter}
            taskDueFilter={taskDueFilter}
            taskPriorityFilter={taskPriorityFilter}
            taskSortBy={taskSortBy}
          />
        </Sidebar>
      </ContextMenuTrigger>
      {isTeamsActive && (
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCreateTeam}>Takım Oluştur</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleRefreshTeams}>Yenile</ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}

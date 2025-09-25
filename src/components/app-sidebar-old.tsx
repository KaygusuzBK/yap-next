"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Folder, ListTodo, Users, Plus, MoreVertical, Calendar, CheckCircle, Filter, Target, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import type { ChangeEvent } from "react"

import { useAuthStore } from "@/lib/store/auth"
import { useUserStore } from "@/lib/store/user"
import { applySavedOrder, saveOrder } from "@/lib/sidebarOrder"
import { getSupabase } from "@/lib/supabase"
import { updateTeamName, deleteTeam, setTeamPrimaryProject, inviteToTeam, getPendingInvitations, acceptTeamInvitation, declineTeamInvitation, getTeamMembers } from "@/features/teams/api"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import { updateTask } from "@/features/tasks/api"
import { useProjects, projectKeys } from "@/features/projects/queries"
import { useMyTasks, keys as taskQueryKeys } from "@/features/tasks/queries"

import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import Input from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// (removed duplicate NewTeamForm import)
import NewProjectForm from "@/features/projects/components/NewProjectForm"
import NewTaskForm from "@/features/tasks/components/NewTaskForm"
import { NavUser } from "@/components/nav-user"
import NotificationsBell from "@/components/NotificationsBell"
import CalendarSidebar from "@/components/sidebar/CalendarSidebar"

type TeamStat = {
  id: string
  name: string
  memberCount: number | null
  projectTitle: string | null
}

type ProjectStat = {
  id: string
  title: string
  status: string
  teamName: string | null
  createdAt: string
}

type TaskStat = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  due_date: string | null
  project_title: string
  project_id: string
  days_remaining: number | null
}

const TeamRow = React.memo(function TeamRow({
  team,
  onOpenRename,
  onDelete,
  onAssignProject,
  onAddMember,
  onSelect,
}: {
  team: TeamStat
  onOpenRename: (teamId: string, currentName: string) => void
  onDelete: (teamId: string) => void
  onAssignProject: (teamId: string) => void
  onAddMember: (teamId: string) => void
  onSelect: (teamId: string) => void
}) {
  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm"
      onClick={() => onSelect(team.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(team.id)
      }}
    >
      <button type="button" onClick={() => onSelect(team.id)} className="text-left">
        <div className="font-medium">{team.name}</div>
        <div className="text-xs text-muted-foreground mt-1">Üye sayısı: {team.memberCount ?? "—"}</div>
        <div className="text-xs text-muted-foreground">Proje: {team.projectTitle ?? "—"}</div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="shrink-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAddMember(team.id)}>Üye Ekle</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAssignProject(team.id)}>Proje Ata</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onOpenRename(team.id, team.name)}>İsmi Değiştir</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(team.id)}>Sil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

const ProjectRow = React.memo(function ProjectRow({
  project,
  counts,
  onSelect,
}: {
  project: ProjectStat
  counts?: { todo: number; in_progress: number; review: number; completed: number }
  onSelect: (projectId: string) => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': {
        return <Calendar className="h-3 w-3 text-blue-500" />
      }
      case 'completed': {
        return <CheckCircle className="h-3 w-3 text-green-500" />
      }
      case 'archived': {
        return <Folder className="h-3 w-3 text-gray-500" />
      }
      default: {
        return <Calendar className="h-3 w-3" />
      }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': {
        return 'Aktif'
      }
      case 'completed': {
        return 'Tamamlandı'
      }
      case 'archived': {
        return 'Arşivlenmiş'
      }
      default: {
        return status
      }
    }
  }

  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm"
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(project.id)
      }}
    >
      <button type="button" onClick={() => onSelect(project.id)} className="text-left">
        <div className="font-medium">{project.title}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {getStatusIcon(project.status)}
          {getStatusText(project.status)}
        </div>
        <div className="text-xs text-muted-foreground">
          {project.teamName ? `Takım: ${project.teamName}` : 'Kişisel Proje'}
        </div>
        {counts && (
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" />Y:{counts.todo}</span>
            <span className="inline-flex items-center gap-1 text-blue-600"><span className="h-2 w-2 rounded-full bg-blue-500" />D:{counts.in_progress}</span>
            <span className="inline-flex items-center gap-1 text-yellow-600"><span className="h-2 w-2 rounded-full bg-yellow-500" />İ:{counts.review}</span>
            <span className="inline-flex items-center gap-1 text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" />T:{counts.completed}</span>
          </div>
        )}
      </button>
    </div>
  )
})

const TaskRow = React.memo(function TaskRow({
  task,
  onSelect,
  onStatusChange,
  isCurrent,
}: {
  task: TaskStat
  onSelect: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStat['status']) => void
  isCurrent?: boolean
}) {
  const [dragX, setDragX] = React.useState(0)
  const startXRef = React.useRef<number | null>(null)

  const getPriorityColor = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low': {
        return 'text-green-600'
      }
      case 'medium': {
        return 'text-blue-600'
      }
      case 'high': {
        return 'text-orange-600'
      }
      case 'urgent': {
        return 'text-red-600'
      }
      default: {
        return 'text-gray-600'
      }
    }
  }

  const getPriorityText = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low': {
        return 'Düşük'
      }
      case 'medium': {
        return 'Orta'
      }
      case 'high': {
        return 'Yüksek'
      }
      case 'urgent': {
        return 'Acil'
      }
      default: {
        return priority
      }
    }
  }

  const getDaysRemainingText = (days: number | null) => {
    if (days === null) {
      return 'Tarih yok'
    }
    if (days < 0) {
      return `${Math.abs(days)} gün gecikmiş`
    }
    if (days === 0) {
      return 'Bugün'
    }
    if (days === 1) {
      return '1 gün kaldı'
    }
    return `${days} gün kaldı`
  }

  const getDaysRemainingColor = (days: number | null) => {
    if (days === null) {
      return 'text-gray-500'
    }
    if (days < 0) {
      return 'text-red-600'
    }
    if (days <= 1) {
      return 'text-orange-600'
    }
    if (days <= 3) {
      return 'text-yellow-600'
    }
    return 'text-green-600'
  }

  const statusColor = React.useMemo(() => {
    switch (task.status) {
      case 'in_progress': {
        return 'bg-blue-500'
      }
      case 'completed': {
        return 'bg-green-500'
      }
      case 'review': {
        return 'bg-yellow-500'
      }
      default: {
        return 'bg-transparent'
      }
    }
  }, [task.status])

  // Swipe-to-update helpers
  const firedRef = React.useRef(false)
  const SWIPE_THRESHOLD = 6

  const onMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX
    firedRef.current = false
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    const clamped = Math.max(-140, Math.min(140, dx))
    setDragX(clamped)

    if (!firedRef.current) {
      if (clamped < -SWIPE_THRESHOLD) {
        const nextStatus = getNextStatus(task.status)
        if (nextStatus) {
          firedRef.current = true
          onStatusChange(task.id, nextStatus)
          setDragX(0)
        }
      } else if (clamped > SWIPE_THRESHOLD) {
        const prevStatus = getPrevStatus(task.status)
        if (prevStatus) {
          firedRef.current = true
          onStatusChange(task.id, prevStatus)
          setDragX(0)
        }
      }
    }
  }
  const onMouseUp = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      const prevStatus = getPrevStatus(task.status)
      const threshold = SWIPE_THRESHOLD
      if (!firedRef.current) {
        if (dx < -threshold && nextStatus) onStatusChange(task.id, nextStatus)
        else if (dx > threshold && prevStatus) onStatusChange(task.id, prevStatus)
      }
    }
    startXRef.current = null
    setDragX(0)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    firedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return
    const dx = e.touches[0].clientX - startXRef.current
    const clamped = Math.max(-140, Math.min(140, dx))
    setDragX(clamped)

    if (!firedRef.current) {
      if (clamped < -SWIPE_THRESHOLD) {
        const nextStatus = getNextStatus(task.status)
        if (nextStatus) {
          firedRef.current = true
          onStatusChange(task.id, nextStatus)
          setDragX(0)
        }
      } else if (clamped > SWIPE_THRESHOLD) {
        const prevStatus = getPrevStatus(task.status)
        if (prevStatus) {
          firedRef.current = true
          onStatusChange(task.id, prevStatus)
          setDragX(0)
        }
      }
    }
  }
  const onTouchEnd = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      const prevStatus = getPrevStatus(task.status)
      const threshold = SWIPE_THRESHOLD
      if (!firedRef.current) {
        if (dx < -threshold && nextStatus) onStatusChange(task.id, nextStatus)
        else if (dx > threshold && prevStatus) onStatusChange(task.id, prevStatus)
      }
    }
    startXRef.current = null
    setDragX(0)
  }

  function getNextStatus(status: TaskStat['status']): TaskStat['status'] | null {
    if (status === 'todo') return 'in_progress'
    if (status === 'in_progress') return 'review'
    if (status === 'review') return 'completed'
    return null
  }
  function getPrevStatus(status: TaskStat['status']): TaskStat['status'] | null {
    if (status === 'completed') return 'review'
    if (status === 'review') return 'in_progress'
    if (status === 'in_progress') return 'todo'
    return null
  }

  return (
    <div
      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm ${
        task.status === 'completed' ? 'opacity-60 bg-muted/20' : ''
      }`}
      onClick={() => onSelect(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(task.id)
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative text-left flex-1 transform transition-transform pl-3`}
        style={{ transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined }}
      >
        {/* Status indicator - fill full height on the left */}
        <span className={`absolute left-0 inset-y-0 w-1.5 rounded-none ${statusColor}`} />{/* burası */}

        {/* Swipe overlay (left=next, right=prev) */}
        {dragX !== 0 && (
          <div
            className={`absolute inset-0 z-0 ${(() => {
              const target = dragX < 0 ? getNextStatus(task.status) : getPrevStatus(task.status)
              if (target === 'in_progress') return 'bg-blue-100 dark:bg-blue-900/30'
              if (target === 'review') return 'bg-yellow-100 dark:bg-yellow-900/30'
              if (target === 'completed') return 'bg-green-100 dark:bg-green-900/30'
              if (target === 'todo') return 'bg-zinc-100 dark:bg-zinc-800/40'
              return 'bg-transparent'
            })()}`}
            style={{ opacity: Math.min(Math.abs(dragX) / 120, 0.85) }}
          />
        )}

        {/* Content */}
        <div className={`relative z-10 ${Math.abs(dragX) > 20 ? 'opacity-60' : ''} flex flex-col items-start text-left`}>
          <div className={`font-medium line-clamp-1 ${
            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.title}
            {isCurrent && (
              <span className="ml-2 inline-block h-2 w-2 align-middle rounded-full bg-primary" title="Şu an açık" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs ${
              task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
            }`}>
              Proje: {task.project_title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-current ${getPriorityColor(task.priority)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getPriorityText(task.priority)}
            </span>
            {/* Status chip next to priority */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              task.status === 'in_progress' ? 'text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800' :
              task.status === 'completed' ? 'text-green-700 border-green-200 dark:text-green-300 dark:border-green-800' :
              task.status === 'review' ? 'text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800' :
              'text-muted-foreground border-border'
            } ${task.status === 'completed' ? 'opacity-70' : ''}`}>
              {task.status === 'in_progress' ? 'Devam ediyor' : task.status === 'completed' ? 'Tamamlandı' : task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
            </span>
            <span className={`text-xs ${getDaysRemainingColor(task.days_remaining)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getDaysRemainingText(task.days_remaining)}
            </span>
          </div>
        </div>
        {/* removed bottom-right status chip */}
        {/* Labels on top */}
        {dragX < -4 && getNextStatus(task.status) && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 text-xs font-semibold drop-shadow-sm ${
            getNextStatus(task.status) === 'in_progress' ? 'text-blue-700' :
            getNextStatus(task.status) === 'review' ? 'text-yellow-700' :
            'text-green-700'
          }`}>
            {getNextStatus(task.status) === 'in_progress' ? 'Devam ediyor' : getNextStatus(task.status) === 'review' ? 'İncelemede' : 'Tamamlandı'}
          </span>
        )}
        {dragX > 4 && getPrevStatus(task.status) && (
          <span className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 text-xs font-semibold drop-shadow-sm ${
            getPrevStatus(task.status) === 'in_progress' ? 'text-blue-700' :
            getPrevStatus(task.status) === 'review' ? 'text-yellow-700' :
            getPrevStatus(task.status) === 'todo' ? 'text-zinc-700 dark:text-zinc-300' : ''
          }`}>
            {getPrevStatus(task.status) === 'in_progress' ? 'Devam ediyor' : getPrevStatus(task.status) === 'review' ? 'İncelemede' : 'Yapılacak'}
          </span>
        )}
      </button>
    </div>
  )
})

// This is sample data
const data = {
  user: {
    name: "",
    email: "",
    avatar: "/logo.svg",
  },
  navMain: [
    {
      title: "Görevlerim",
      url: "/dashboard#tasks",
      icon: ListTodo,
      isActive: true,
    },
    {
      title: "Takvim",
      url: "/dashboard/tasks/calendar",
      icon: Calendar,
      isActive: false,
    },
    {
      title: "Projeler",
      url: "/dashboard#projects",
      icon: Folder,
      isActive: false,
    },
    {
      title: "Takımlar",
      url: "/dashboard#teams",
      icon: Users,
      isActive: false,
    },
    {
      title: "Performans",
      url: "/dashboard/performance-reports",
      icon: BarChart3,
      isActive: false,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const { setOpen } = useSidebar()
  const router = useRouter()
  const pathname = typeof window === 'undefined' ? '' : undefined as any
  const currentPath = usePathname?.() ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)

  // Sync selectedTaskId with route path to avoid lag
  React.useEffect(() => {
    const match = currentPath.match(/\/dashboard\/tasks\/(.+)$/)
    if (match && match[1]) {
      setSelectedTaskId(match[1])
    } else if (!currentPath.includes('/dashboard/tasks/')) {
      setSelectedTaskId(null)
    }
  }, [currentPath])
  const authUser = useAuthStore(s => s.user)
  const profileName = useUserStore(s => s.name)
  const profileEmail = useUserStore(s => s.email)
  const [teamStats, setTeamStats] = React.useState<TeamStat[]>([])
  const [loadingTeams, setLoadingTeams] = React.useState(false)
  const [teamError, setTeamError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false)
  // orderTick state removed: memo bağımlılıklarını sadeleştirdik
  const [pendingInvites, setPendingInvites] = React.useState<Array<{ id: string; token: string; email: string; role: string; created_at: string; expires_at: string; teams?: { id: string; name?: string } }>>([])
  // legacy counter state no longer used (we render full list under Teams)
  // const [pendingCount, setPendingCount] = React.useState<number>(0)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const found = data.navMain.find((i) => i.url.endsWith(hash))
    if (found) setActiveItem(found)
  }, [])

  // Pending invitations list (sidebar Teams section)
  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        const list = await getPendingInvitations()
        setPendingInvites(list as Array<{ id: string; token: string; email: string; role: string; created_at: string; expires_at: string; teams?: { id: string; name?: string } }>)
      } catch { setPendingInvites([]) }
    }
    fetchPending()
  }, [])

  // URL hash değişikliklerini dinlemeye gerek yok artık

  const fetchTeamStats = React.useCallback(async () => {
    try {
      setLoadingTeams(true)
      setTeamError(null)
      const supabase = getSupabase()
      const { data: teams, error: tErr } = await supabase
        .from("teams")
        .select("id,name")
        .order("created_at", { ascending: false })
      if (tErr) throw tErr
      const teamIds = (teams ?? []).map((t) => t.id)
      if (teamIds.length === 0) {
        setTeamStats([])
        return
      }
      const [{ data: projects }] = await Promise.all([
        supabase
          .from("projects")
          .select("id,title,team_id")
          .in("team_id", teamIds),
      ])
      const teamIdToProjectTitle = new Map<string, string>()
      ;(projects ?? []).forEach((p) => {
        if (!teamIdToProjectTitle.has(p.team_id)) {
          teamIdToProjectTitle.set(p.team_id, p.title)
        }
      })
      // Count members via secure RPC per team (owner or member can see full list)
      const counts = await Promise.all(teamIds.map(async (id) => {
        try {
          const list = await getTeamMembers(id)
          return [id, list.length] as const
        } catch {
          return [id, 0] as const
        }
      }))
      const teamIdToCount = new Map<string, number>(counts)
      let stats = (teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: teamIdToCount.get(t.id) ?? null,
        projectTitle: teamIdToProjectTitle.get(t.id) ?? null,
      }))
      stats = applySavedOrder('teams', stats)
      setTeamStats(stats)
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : "Takım verileri alınamadı")
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  // Removed legacy pending counter effect; list is shown under Teams

  const qc = useQueryClient()
  const { data: hookProjects = [], isLoading: hookLoadingProjects, error: hookProjectsError } = useProjects()
  const { data: hookMyTasks = [], isLoading: hookLoadingMyTasks, error: hookTasksError } = useMyTasks()

  // Derived loading/error flags for rendering
  const loadingProjects = hookLoadingProjects
  const projectError = hookProjectsError ? (hookProjectsError as Error).message : null
  const loadingTasks = hookLoadingMyTasks
  const taskError = hookTasksError ? (hookTasksError as Error).message : null

  const projectStats = React.useMemo(() => {
    const base = hookProjects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      teamName: p.team_id ? null : null,
      createdAt: p.created_at,
    })) as ProjectStat[]
    return applySavedOrder('projects', base)
  }, [hookProjects])

  const taskStats = React.useMemo(() => {
    const nextAll: TaskStat[] = hookMyTasks.map((task) => {
      const dueDate = task.due_date ? new Date(task.due_date) : null
      const now = new Date()
      const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        project_title: task.project_title || '',
        project_id: task.project_id,
        days_remaining: daysRemaining,
      }
    })
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 } as Record<string, number>
    nextAll.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (priorityDiff !== 0) return priorityDiff
      const ad = a.days_remaining ?? Number.POSITIVE_INFINITY
      const bd = b.days_remaining ?? Number.POSITIVE_INFINITY
      return ad - bd
    })
    return applySavedOrder('tasks', nextAll)
  }, [hookMyTasks])

  // En yakın görevi bul
  const nearestTask = React.useMemo(() => {
    const incompleteTasks = taskStats.filter(task => 
      task.status !== 'completed' && task.due_date
    )
    
    if (incompleteTasks.length === 0) return null
    
    const today = new Date()
    
    // Önce bugünün görevleri, sonra gelecekteki görevler, son olarak geçmişteki görevler
    const todayTasks = incompleteTasks.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      return dueDate.toDateString() === today.toDateString()
    })
    
    if (todayTasks.length > 0) {
      return todayTasks.sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })[0]
    }
    
    const futureTasks = incompleteTasks.filter(task => {
      if (!task.due_date) return false
      return new Date(task.due_date) > today
    })
    
    if (futureTasks.length > 0) {
      return futureTasks.sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })[0]
    }
    
    const pastTasks = incompleteTasks.filter(task => {
      if (!task.due_date) return false
      return new Date(task.due_date) < today
    })
    
    if (pastTasks.length > 0) {
      return pastTasks.sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime() // En yakın geçmiş görev
      })[0]
    }
    
    return null
  }, [taskStats])

  React.useEffect(() => {
    if (activeItem?.title === "Takımlar") {
      fetchTeamStats()
    }
  }, [activeItem, fetchTeamStats])

  // Realtime: refresh tasks in sidebar when tasks change anywhere
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('sidebar-task-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        console.log('Project tasks changed, refreshing sidebar...')
        qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('Tasks changed, refreshing sidebar...')
        qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        console.log('Projects changed, refreshing sidebar...')
        qc.invalidateQueries({ queryKey: projectKeys.all() }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])

  const isTasksActive = activeItem?.title === "Görevlerim"
  const isCalendarActive = activeItem?.title === "Takvim"
  const isTeamsActive = activeItem?.title === "Takımlar"
  const isProjectsActive = activeItem?.title === "Projeler"
  const isPerformanceActive = activeItem?.title === "Performans"

  // Performans verileri için state
  const [performanceData, setPerformanceData] = React.useState<{
    totalTasks: number
    completedTasks: number
    completionRate: number
    teamStats: Array<{ name: string; completed: number; total: number; rate: number }>
    projectStats: Array<{ name: string; completed: number; total: number; rate: number }>
  } | null>(null)
  const [loadingPerformance, setLoadingPerformance] = React.useState(false)
  const [performanceError, setPerformanceError] = React.useState<string | null>(null)

  // Performans verilerini çek
  const fetchPerformanceData = React.useCallback(async () => {
    if (!isPerformanceActive) return
    
    try {
      setLoadingPerformance(true)
      setPerformanceError(null)
      const supabase = getSupabase()
      
      // Tüm görevleri çek (project_tasks tablosundan)
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('id, status, created_by, project_id, created_at, updated_at')
      
      if (tasksError) {
        console.error('Tasks query error:', tasksError)
        throw new Error(`Görevler yüklenemedi: ${tasksError.message}`)
      }

      // Takım üyelerini çek
      const { data: teamMembers, error: teamError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          users!inner(id, full_name)
        `)
      
      if (teamError) {
        console.warn('Team members could not be loaded:', teamError)
      }

      // Projeleri çek
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
      
      if (projectError) {
        console.warn('Projects could not be loaded:', projectError)
      }

      // İstatistikleri hesapla
      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      
      console.log('Performance data loaded:', {
        totalTasks,
        completedTasks,
        completionRate,
        sampleTasks: tasks?.slice(0, 3)
      })

      // Takım istatistikleri
      const teamStats = teamMembers?.map(member => {
        const memberTasks = tasks?.filter(t => t.created_by === member.user_id) || []
        const memberCompleted = memberTasks.filter(t => t.status === 'completed').length
        return {
          name: (member as any).users?.full_name || 'Bilinmeyen',
          completed: memberCompleted,
          total: memberTasks.length,
          rate: memberTasks.length > 0 ? (memberCompleted / memberTasks.length) * 100 : 0
        }
      }).filter(member => member.total > 0) || []

      // Proje istatistikleri
      const projectStats = projects?.map(project => {
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || []
        const projectCompleted = projectTasks.filter(t => t.status === 'completed').length
        return {
          name: project.title,
          completed: projectCompleted,
          total: projectTasks.length,
          rate: projectTasks.length > 0 ? (projectCompleted / projectTasks.length) * 100 : 0
        }
      }).filter(project => project.total > 0) || []

      setPerformanceData({
        totalTasks,
        completedTasks,
        completionRate,
        teamStats,
        projectStats
      })
    } catch (error) {
      console.error('Failed to load performance data:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      })
      setPerformanceError(error instanceof Error ? error.message : 'Veri yüklenirken hata oluştu')
      // Hata durumunda fallback veri göster
      setPerformanceData({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        teamStats: [],
        projectStats: []
      })
    } finally {
      setLoadingPerformance(false)
    }
  }, [isPerformanceActive])

  // Performans verilerini yükle
  React.useEffect(() => {
    fetchPerformanceData()
  }, [fetchPerformanceData])

  const handleNavClick = React.useCallback(
    (item: (typeof data.navMain)[number]) => {
      setActiveItem(item)
      // keep demo mails stable to reduce jank
      setOpen(true)
    },
    [setOpen]
  )

  const onOpenRename = React.useCallback((teamId: string, currentName: string) => {
    setSelectedTeamId(teamId)
    setRenameValue(currentName)
    setRenameOpen(true)
  }, [])

  const onDeleteTeam = React.useCallback(
    async (teamId: string) => {
      if (!confirm("Takımı silmek istediğinize emin misiniz?")) return
      await deleteTeam(teamId)
      fetchTeamStats()
    },
    [fetchTeamStats]
  )

  const [assignOpen, setAssignOpen] = React.useState(false)
  const [assignProjectId, setAssignProjectId] = React.useState<string | null>(null)
  const [teamProjects, setTeamProjects] = React.useState<Array<{ id: string; title: string }>>([])
  const [addMemberOpen, setAddMemberOpen] = React.useState(false)
  const [memberEmail, setMemberEmail] = React.useState("")
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [taskProjectId, setTaskProjectId] = React.useState<string | null>(null)

  // Takvim state'leri
  const [calendarView, setCalendarView] = React.useState<'month' | 'week' | 'day'>('month')
  const [calendarDate, setCalendarDate] = React.useState<Date>(new Date())

  // Görev filtreleme & sıralama kontrolleri
  const [taskStatusFilter, setTaskStatusFilter] = React.useState<'all' | 'open' | 'completed'>('all')
  const [taskDueFilter, setTaskDueFilter] = React.useState<'all' | 'overdue' | 'today' | 'week'>('all')
  const [taskPriorityFilter, setTaskPriorityFilter] = React.useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')
  const [taskSortBy, setTaskSortBy] = React.useState<'smart' | 'due' | 'priority'>('smart')
  const [myTasksOpen, setMyTasksOpen] = React.useState(false)

  // Drag & Drop state and helpers
  const [dragType, setDragType] = React.useState<null | 'team' | 'project' | 'task'>(null)
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  function reorderArray<T>(items: T[], startIndex: number, endIndex: number): T[] {
    const updated = [...items]
    const [removed] = updated.splice(startIndex, 1)
    updated.splice(endIndex, 0, removed)
    return updated
  }

  // duplicate helpers removed

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
    if (dragType !== type || dragIndex === null) return
    if (type === 'team') {
      const updated = reorderArray(teamStats, dragIndex, index)
      setTeamStats(updated)
      saveOrder('teams', updated.map(t => t.id))
    } else if (type === 'project') {
      const updated = reorderArray(projectStats, dragIndex, index)
      saveOrder('projects', updated.map(p => p.id))
    } else if (type === 'task') {
      const filtered = taskStats.filter(t => {
        if (taskStatusFilter === 'open' && t.status === 'completed') return false
        if (taskStatusFilter === 'completed' && t.status !== 'completed') return false
        if (taskDueFilter === 'overdue' && !(t.days_remaining !== null && t.days_remaining < 0)) return false
        if (taskDueFilter === 'today' && !(t.days_remaining === 0)) return false
        if (taskDueFilter === 'week' && !(t.days_remaining !== null && t.days_remaining >= 0 && t.days_remaining <= 7)) return false
        if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false
        return true
      })
      const re = reorderArray(filtered, dragIndex, index)
      const reorderedIds = new Set(re.map(t => t.id))
      const updated = [...re, ...taskStats.filter(t => !reorderedIds.has(t.id))]
      saveOrder('tasks', updated.map(t => t.id))
      // orderTick kaldırıldı; derived list useMemo deps yeterli
    }
    setDragType(null)
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragType, dragIndex, teamStats, projectStats, taskStats, taskStatusFilter, taskDueFilter, taskPriorityFilter])

  // Drag & Drop state and helpers
  // duplicate state removed
  // duplicate state removed

  // duplicate helper removed

  // saveOrder/applySavedOrder moved to @/lib/sidebarOrder for stable references

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

  // Context menu fonksiyonlarını memoize et
  const handleCreateTeam = React.useCallback(() => {
    setCreateOpen(true)
  }, [])

  const handleRefreshTeams = React.useCallback(() => {
    fetchTeamStats()
  }, [fetchTeamStats])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Sidebar
          collapsible="icon"
          className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
          {...props}
        >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
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
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
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

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
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
            </div>
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
                    <span className="sr-only">En yakın göreve git</span>
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="outline"
                  data-tour="create-task"
                  onClick={() => { setTaskProjectId(projectStats[0]?.id ?? null); setCreateTaskOpen(true) }}
                  className="h-8 w-8 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                >
                  <Plus className="size-4" />
                  <span className="sr-only">Görev oluştur</span>
                </Button>
              </div>
            )}
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent className="overflow-auto">
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isTeamsActive ? (
                <div className="p-4 min-h-0">
                  <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni Takım</DialogTitle>
                      </DialogHeader>
                      <NewTeamForm startExpanded onCreated={() => setCreateTeamOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  {loadingTeams && (
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  )}
                  {teamError && (
                    <p className="text-sm text-red-600">{teamError}</p>
                  )}
                  {!loadingTeams && !teamError && teamStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz takım yok.</p>
                  )}
                  {!loadingTeams && !teamError && (
                    <div className="flex flex-col">
                      {teamStats.map((t, index) => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={() => onDragStartGeneric('team', index)}
                          onDragOver={(e) => onDragOverGeneric(e, 'team', index)}
                          onDrop={() => onDropGeneric('team', index)}
                          className={dragType === 'team' && dragOverIndex === index ? 'outline outline-2 outline-primary/60 rounded-sm' : ''}
                        >
                          <TeamRow
                            team={t}
                            onOpenRename={onOpenRename}
                            onDelete={onDeleteTeam}
                            onAssignProject={onAssignProject}
                            onAddMember={onAddMember}
                            onSelect={(id) => router.push(`/dashboard/teams/${id}`)}
                          />
                        </div>
                      ))}
                      {/* Pending invitations under teams */}
                      {pendingInvites.length > 0 && (
                        <div className="mt-3 rounded-md border p-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium">Davetler ({pendingInvites.length})</div>
                          </div>
                          <div className="space-y-2">
                            {pendingInvites.map((inv) => (
                              <div key={inv.id} className="flex items-center justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{inv.teams?.name ?? 'Takım'}</div>
                                  <div className="text-muted-foreground">{inv.email}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" onClick={async () => { try { await acceptTeamInvitation(inv.token); toast.success('Kabul edildi'); setPendingInvites(prev => prev.filter(i => i.id !== inv.id)) } catch {} }}>Kabul</Button>
                                  <Button size="sm" variant="outline" onClick={async () => { try { await declineTeamInvitation(inv.token); toast.success('Reddedildi'); setPendingInvites(prev => prev.filter(i => i.id !== inv.id)) } catch {} }}>Reddet</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : isPerformanceActive ? (
                <div className="p-4 min-h-0">
                  {loadingPerformance ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                    </div>
                  ) : performanceError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-red-500 opacity-50" />
                        <div className="text-sm text-red-600 mb-2">Hata oluştu</div>
                        <div className="text-xs text-muted-foreground">{performanceError}</div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => fetchPerformanceData()}
                        >
                          Tekrar Dene
                        </Button>
                      </div>
                    </div>
                  ) : !performanceData ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <div className="text-sm text-muted-foreground">Veri bulunamadı</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Performans Özeti */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Performans Özeti</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg border bg-card">
                            <div className="text-2xl font-bold text-green-600">{performanceData.completedTasks}</div>
                            <div className="text-xs text-muted-foreground">Tamamlanan</div>
                          </div>
                          <div className="p-3 rounded-lg border bg-card">
                            <div className="text-2xl font-bold text-blue-600">{performanceData.totalTasks}</div>
                            <div className="text-xs text-muted-foreground">Toplam</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Başarı Oranı</span>
                            <span className="text-lg font-bold text-purple-600">{performanceData.completionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${performanceData.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Takım Performansı */}
                      {performanceData.teamStats.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-muted-foreground">Takım Performansı</h3>
                          <div className="space-y-2">
                            {performanceData.teamStats
                              .sort((a, b) => b.rate - a.rate)
                              .slice(0, 3)
                              .map((member, index) => {
                                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500']
                                return (
                                  <div key={member.name} className="flex items-center justify-between p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                                      <span className="text-sm truncate">{member.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{member.rate.toFixed(1)}%</span>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Proje Performansı */}
                      {performanceData.projectStats.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-muted-foreground">Proje Performansı</h3>
                          <div className="space-y-2">
                            {performanceData.projectStats
                              .sort((a, b) => b.rate - a.rate)
                              .slice(0, 3)
                              .map((project, index) => {
                                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500']
                                return (
                                  <div key={project.name} className="flex items-center justify-between p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                                      <span className="text-sm truncate">{project.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{project.rate.toFixed(1)}%</span>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Detaylı Rapor İçin Buton */}
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100"
                          onMouseEnter={() => router.prefetch('/dashboard/performance-reports')}
                          onClick={() => router.push('/dashboard/performance-reports')}
                        >
                          <BarChart3 className="h-4 w-4 mr-2 transition-transform duration-150 group-active:scale-95" />
                          Detaylı Raporlar
                        </Button>
                      </div>
                    </div>
                  )}
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
                  {loadingProjects && (
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  )}
                  {projectError && (
                    <p className="text-sm text-red-600">{projectError}</p>
                  )}
                  {!loadingProjects && !projectError && projectStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz proje yok.</p>
                  )}
                  {!loadingProjects && !projectError && (
                    <div className="flex flex-col">
                      {projectStats.map((p, index) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={() => onDragStartGeneric('project', index)}
                          onDragOver={(e) => onDragOverGeneric(e, 'project', index)}
                          onDrop={() => onDropGeneric('project', index)}
                          className={dragType === 'project' && dragOverIndex === index ? 'outline outline-2 outline-primary/60 rounded-sm' : ''}
                        >
                          <ProjectRow
                            project={p}
                            counts={{
                              todo: taskStats.filter(t => t.project_id === p.id && (t.status === 'todo' || t.status === null)).length,
                              in_progress: taskStats.filter(t => t.project_id === p.id && t.status === 'in_progress').length,
                              review: taskStats.filter(t => t.project_id === p.id && t.status === 'review').length,
                              completed: taskStats.filter(t => t.project_id === p.id && t.status === 'completed').length,
                            }}
                            onSelect={(id) => router.push(`/dashboard/projects/${id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : isTasksActive ? (
                <div className="p-4 min-h-0">
                  {loadingTasks && (
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  )}
                  {taskError && (
                    <p className="text-sm text-red-600">{taskError}</p>
                  )}
                  {!loadingTasks && !taskError && (
                    <>
                      {/* Kompakt filtre toolbar */}
                      {(() => {
                        const activeCount = [
                          taskStatusFilter !== 'all',
                          taskDueFilter !== 'all',
                          taskPriorityFilter !== 'all',
                          taskSortBy !== 'smart',
                        ].filter(Boolean).length
                        return (
                          <div className="mb-2 flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8" data-tour="filter">
                                  <Filter className="h-4 w-4 mr-2" />
                                  Filtre
                                  {activeCount > 0 && (
                                    <span className="ml-2 rounded bg-primary/10 px-1.5 text-xs">
                                      {activeCount}
                                    </span>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56">
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">Durum</div>
                                <DropdownMenuItem onClick={() => setTaskStatusFilter('all')} inset>
                                  Tüm Durumlar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskStatusFilter('open')} inset>
                                  Açık
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskStatusFilter('completed')} inset>
                                  Biten
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">Tarih</div>
                                <DropdownMenuItem onClick={() => setTaskDueFilter('all')} inset>
                                  Tümü
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskDueFilter('overdue')} inset>
                                  Gecikmiş
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskDueFilter('today')} inset>
                                  Bugün
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskDueFilter('week')} inset>
                                  7 Gün
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">Öncelik</div>
                                <DropdownMenuItem onClick={() => setTaskPriorityFilter('all')} inset>
                                  Tümü
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskPriorityFilter('urgent')} inset>
                                  Acil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskPriorityFilter('high')} inset>
                                  Yüksek
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskPriorityFilter('medium')} inset>
                                  Orta
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskPriorityFilter('low')} inset>
                                  Düşük
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">Sırala</div>
                                <DropdownMenuItem onClick={() => setTaskSortBy('smart')} inset>
                                  Öncelik+Durum
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskSortBy('due')} inset>
                                  Bitiş Tarihi
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTaskSortBy('priority')} inset>
                                  Öncelik
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setMyTasksOpen(true)}>
                              Görevlerim
                            </Button>
                          </div>
                        )
                      })()}

                      {/* Filtrelenmiş liste */}
                      {(() => {
                        const filtered = taskStats.filter(t => {
                          // Durum filtresi
                          if (taskStatusFilter === 'open' && t.status === 'completed') return false
                          if (taskStatusFilter === 'completed' && t.status !== 'completed') return false
                          // Tarih filtresi
                          if (taskDueFilter === 'overdue' && !(t.days_remaining !== null && t.days_remaining < 0)) return false
                          if (taskDueFilter === 'today' && !(t.days_remaining === 0)) return false
                          if (taskDueFilter === 'week' && !(t.days_remaining !== null && t.days_remaining >= 0 && t.days_remaining <= 7)) return false
                          // Öncelik filtresi
                          if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false
                          return true
                        })

                        // Sıralama
                        const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
                        if (taskSortBy === 'due') {
                          filtered.sort((a, b) => {
                            const ad = a.days_remaining ?? Number.POSITIVE_INFINITY
                            const bd = b.days_remaining ?? Number.POSITIVE_INFINITY
                            return ad - bd
                          })
                        } else if (taskSortBy === 'priority') {
                          filtered.sort((a, b) => (priorityOrder[b.priority] - priorityOrder[a.priority]))
                        } else {
                          // smart: önce tamamlanmamış, sonra öncelik, sonra gün
                          filtered.sort((a, b) => {
                            if (a.status === 'completed' && b.status !== 'completed') return 1
                            if (a.status !== 'completed' && b.status === 'completed') return -1
                            const pr = priorityOrder[b.priority] - priorityOrder[a.priority]
                            if (pr !== 0) return pr
                            const ad = a.days_remaining ?? Number.POSITIVE_INFINITY
                            const bd = b.days_remaining ?? Number.POSITIVE_INFINITY
                            return ad - bd
                          })
                        }

                        if (filtered.length === 0) {
                          return <p className="text-sm text-muted-foreground">Filtrelere uygun görev yok.</p>
                        }

               return (
                          <div className="flex flex-col">
                    {filtered.slice(0, 12).map((task) => {
                      const isCurrent = selectedTaskId === task.id || currentPath === `/dashboard/tasks/${task.id}`
                      return (
                          <TaskRow
                                key={task.id}
                                task={task}
                        isCurrent={isCurrent}
                        onSelect={() => { setSelectedTaskId(task.id); router.push(`/dashboard/tasks/${task.id}`) }}
                            onStatusChange={async (taskId, status) => {
                              try {
                                await updateTask({ id: taskId, status })
                                await qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() })
                              } catch (e) {
                                console.error('Durum güncellenemedi', e)
                              }
                            }}
                              />
                      )
                    })}
                            {filtered.length > 12 && (
                              <div className="text-center p-2 text-xs text-muted-foreground">+{filtered.length - 12} görev daha...</div>
                            )}
                          </div>
                        )
                      })()}
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Henüz bildirim yok</p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {/* No profile footer here to avoid duplication */}
      </Sidebar>
      {/* Takım detayı sayfasına yönlendiriliyor */}
      {/* Create Team Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Takım</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <NewTeamForm onCreated={() => { setCreateOpen(false); fetchTeamStats() }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Proje</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <NewProjectForm onCreated={async () => { setCreateProjectOpen(false); await qc.invalidateQueries({ queryKey: projectKeys.all() }) }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Project Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {teamProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu takıma ait proje bulunamadı.</p>
            ) : (
              <div className="grid gap-2">
                {teamProjects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="assign-project"
                      value={p.id}
                      checked={assignProjectId === p.id}
                      onChange={() => setAssignProjectId(p.id)}
                    />
                    <span>{p.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Vazgeç</Button>
            <Button disabled={!assignProjectId || !selectedTeamId} onClick={async () => {
              if (!selectedTeamId || !assignProjectId) return
              await setTeamPrimaryProject({ team_id: selectedTeamId, project_id: assignProjectId })
              setAssignOpen(false)
              fetchTeamStats()
            }}>Ata</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Team Modal */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takım adını değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={renameValue} onChange={(e: ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Vazgeç</Button>
            <Button disabled={saving || !renameValue.trim()} onClick={async () => {
              if (!selectedTeamId) return
              try {
                setSaving(true)
                await updateTeamName({ team_id: selectedTeamId, name: renameValue.trim() })
                setRenameOpen(false)
                fetchTeamStats()
              } finally {
                setSaving(false)
              }
            }}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal (two-step) */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{taskProjectId ? 'Yeni Görev Oluştur' : 'Proje Seçin'}</DialogTitle>
          </DialogHeader>
          {!taskProjectId ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Görev oluşturmak için önce bir proje seçmelisiniz.
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Proje Seçin</Label>
                <Select value={taskProjectId ?? ''} onValueChange={(v) => setTaskProjectId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStats.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Henüz proje yok
                      </div>
                    ) : (
                      projectStats.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <span>{p.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ({p.status === 'active' ? 'Aktif' : p.status === 'completed' ? 'Tamamlandı' : 'Arşivlenmiş'})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Vazgeç</Button>
                <Button 
                  disabled={!taskProjectId} 
                  onClick={() => taskProjectId && setTaskProjectId(taskProjectId)}
                >
                  Devam Et
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="pt-2">
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">Seçilen Proje:</div>
                <div className="text-sm text-muted-foreground">
                  {projectStats.find(p => p.id === taskProjectId)?.title}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTaskProjectId(null)}
                  className="mt-2 h-6 px-2 text-xs"
                >
                  Değiştir
                </Button>
              </div>
              <NewTaskForm 
                projectId={taskProjectId}
                onCreated={async () => { 
                  setCreateTaskOpen(false); 
                  setTaskProjectId(null); 
                  if (isTasksActive) await qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() }) 
                }}
                onCancel={() => { setCreateTaskOpen(false); setTaskProjectId(null) }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Görevlerim Dialog */}
      <Dialog open={myTasksOpen} onOpenChange={setMyTasksOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Görevlerim</DialogTitle>
          </DialogHeader>
          {(() => {
            const filtered = taskStats.filter(t => {
              if (taskStatusFilter === 'open' && t.status === 'completed') return false
              if (taskStatusFilter === 'completed' && t.status !== 'completed') return false
              if (taskDueFilter === 'overdue' && !(t.days_remaining !== null && t.days_remaining < 0)) return false
              if (taskDueFilter === 'today' && !(t.days_remaining === 0)) return false
              if (taskDueFilter === 'week' && !(t.days_remaining !== null && t.days_remaining >= 0 && t.days_remaining <= 7)) return false
              if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false
              return true
            })
            if (filtered.length === 0) return <p className="text-sm text-muted-foreground">Görev yok.</p>
            return (
              <div className="space-y-2">
                        {filtered.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onSelect={(id) => router.push(`/dashboard/tasks/${id}`)}
                    onStatusChange={async (taskId, status) => {
                      try {
                        await updateTask({ id: taskId, status })
                        await qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() })
                      } catch (e) {
                        console.error('Durum güncellenemedi', e)
                      }
                    }}
                  />
                ))}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takıma üye ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="member-email">E-posta adresi</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="ornek@email.com"
                value={memberEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddMemberOpen(false)
              setMemberEmail("")
            }}>Vazgeç</Button>
            <Button disabled={!memberEmail.trim() || saving} onClick={async () => {
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
                alert("Üye eklenirken bir hata oluştu. Lütfen tekrar deneyin.")
              } finally {
                setSaving(false)
              }
            }}>{saving ? "Ekleniyor..." : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

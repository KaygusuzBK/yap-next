"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Folder, ListTodo, Users, Plus, MoreVertical, Calendar, CheckCircle, Filter } from "lucide-react"
import Logo from "@/components/Logo"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import Input from "@/components/ui/input"
import NewTeamForm from "@/features/teams/components/NewTeamForm"
import NewProjectForm from "@/features/projects/components/NewProjectForm"
import NewTaskForm from "@/features/tasks/components/NewTaskForm"
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
import type { ChangeEvent } from "react"
import { updateTeamName, deleteTeam, setTeamPrimaryProject, inviteToTeam } from "@/features/teams/api"
import { updateTask } from "@/features/tasks/api"
import { fetchProjects } from "@/features/projects/api"
import { fetchTasksByProject } from "@/features/tasks/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Switch } from "@/components/ui/switch"

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
  status: 'todo' | 'in_progress' | 'review' | 'completed'
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
  onSelect,
}: {
  project: ProjectStat
  onSelect: (projectId: string) => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Calendar className="h-3 w-3 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'archived':
        return <Folder className="h-3 w-3 text-gray-500" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'completed':
        return 'Tamamlandı'
      case 'archived':
        return 'Arşivlenmiş'
      default:
        return status
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
      </button>
    </div>
  )
})

const TaskRow = React.memo(function TaskRow({
  task,
  onSelect,
  onStatusChange,
}: {
  task: TaskStat
  onSelect: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStat['status']) => void
}) {
  const [dragX, setDragX] = React.useState(0)
  const startXRef = React.useRef<number | null>(null)

  const getPriorityColor = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-blue-600'
      case 'high':
        return 'text-orange-600'
      case 'urgent':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityText = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low':
        return 'Düşük'
      case 'medium':
        return 'Orta'
      case 'high':
        return 'Yüksek'
      case 'urgent':
        return 'Acil'
      default:
        return priority
    }
  }

  const getDaysRemainingText = (days: number | null) => {
    if (days === null) return 'Tarih yok'
    if (days < 0) return `${Math.abs(days)} gün gecikmiş`
    if (days === 0) return 'Bugün'
    if (days === 1) return '1 gün kaldı'
    return `${days} gün kaldı`
  }

  const getDaysRemainingColor = (days: number | null) => {
    if (days === null) return 'text-gray-500'
    if (days < 0) return 'text-red-600'
    if (days <= 1) return 'text-orange-600'
    if (days <= 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  const statusColor = React.useMemo(() => {
    switch (task.status) {
      case 'in_progress':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'review':  
        return 'bg-yellow-500'
      default:
        return 'bg-transparent'
    }
  }, [task.status])

  const onMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    // Only allow left swipe for stage progression
    setDragX(Math.min(0, dx))
  }
  const onMouseUp = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      if (dx < -80 && nextStatus) {
        onStatusChange(task.id, nextStatus)
      }
    }
    startXRef.current = null
    setDragX(0)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return
    const dx = e.touches[0].clientX - startXRef.current
    setDragX(Math.min(0, dx))
  }
  const onTouchEnd = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      if (dx < -80 && nextStatus) {
        onStatusChange(task.id, nextStatus)
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
        {/* Status indicator */}
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded ${statusColor}`} />

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
        <div className={`relative z-10 ${Math.abs(dragX) > 20 ? 'opacity-60' : ''}`}>
          <div className={`font-medium line-clamp-1 ${
            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              task.status === 'in_progress' ? 'text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800' :
              task.status === 'completed' ? 'text-green-700 border-green-200 dark:text-green-300 dark:border-green-800' :
              task.status === 'review' ? 'text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800' :
              'text-muted-foreground border-border'
            }`}>
              {task.status === 'in_progress' ? 'Devam ediyor' : task.status === 'completed' ? 'Tamamlandı' : task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
            </span>
            <span className={`text-xs ${
              task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
            }`}>
              Proje: {task.project_title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${getPriorityColor(task.priority)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getPriorityText(task.priority)}
            </span>
            <span className={`text-xs ${getDaysRemainingColor(task.days_remaining)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getDaysRemainingText(task.days_remaining)}
            </span>
          </div>
        </div>
        {/* Labels on top */}
        {dragX < -40 && getNextStatus(task.status) && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 text-xs font-semibold drop-shadow-sm ${
            getNextStatus(task.status) === 'in_progress' ? 'text-blue-700' :
            getNextStatus(task.status) === 'review' ? 'text-yellow-700' :
            'text-green-700'
          }`}>
            {getNextStatus(task.status) === 'in_progress' ? 'Devam ediyor' : getNextStatus(task.status) === 'review' ? 'İncelemede' : 'Tamamlandı'}
          </span>
        )}
        {dragX > 40 && getPrevStatus(task.status) && (
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
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Görevlerim",
      url: "/dashboard#tasks",
      icon: ListTodo,
      isActive: true,
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
  ],
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: "Bob Johnson",
      email: "bobjohnson@example.com",
      subject: "Weekend Plans",
      date: "2 days ago",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: "Emily Davis",
      email: "emilydavis@example.com",
      subject: "Re: Question about Budget",
      date: "2 days ago",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: "Michael Wilson",
      email: "michaelwilson@example.com",
      subject: "Important Announcement",
      date: "1 week ago",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: "Sarah Brown",
      email: "sarahbrown@example.com",
      subject: "Re: Feedback on Proposal",
      date: "1 week ago",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: "David Lee",
      email: "davidlee@example.com",
      subject: "New Project Idea",
      date: "1 week ago",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: "Olivia Wilson",
      email: "oliviawilson@example.com",
      subject: "Vacation Plans",
      date: "1 week ago",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: "James Martin",
      email: "jamesmartin@example.com",
      subject: "Re: Conference Registration",
      date: "1 week ago",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: "Sophia White",
      email: "sophiawhite@example.com",
      subject: "Team Dinner",
      date: "1 week ago",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const [mails, setMails] = React.useState(data.mails)
  const { setOpen } = useSidebar()
  const router = useRouter()
  const [teamStats, setTeamStats] = React.useState<TeamStat[]>([])
  const [loadingTeams, setLoadingTeams] = React.useState(false)
  const [teamError, setTeamError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  
  const [projectStats, setProjectStats] = React.useState<ProjectStat[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(false)
  const [projectError, setProjectError] = React.useState<string | null>(null)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [taskStats, setTaskStats] = React.useState<TaskStat[]>([])
  const [loadingTasks, setLoadingTasks] = React.useState(false)
  const [taskError, setTaskError] = React.useState<string | null>(null)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const found = data.navMain.find((i) => i.url.endsWith(hash))
    if (found) setActiveItem(found)
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
      const [{ data: projects }, { data: members }] = await Promise.all([
        supabase
          .from("projects")
          .select("id,title,team_id")
          .in("team_id", teamIds),
        supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", teamIds),
      ])
      const teamIdToProjectTitle = new Map<string, string>()
      ;(projects ?? []).forEach((p) => {
        if (!teamIdToProjectTitle.has(p.team_id)) {
          teamIdToProjectTitle.set(p.team_id, p.title)
        }
      })
      const teamIdToCount = new Map<string, number>()
      ;(members ?? []).forEach((m) => {
        teamIdToCount.set(m.team_id, (teamIdToCount.get(m.team_id) ?? 0) + 1)
      })
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

  const fetchProjectStats = React.useCallback(async () => {
    try {
      setLoadingProjects(true)
      setProjectError(null)
      const projects = await fetchProjects()
      
      // Takım isimlerini al
      const supabase = getSupabase()
      const teamIds = projects.filter(p => p.team_id).map(p => p.team_id!)
      const teamNames = new Map<string, string>()
      
      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from("teams")
          .select("id,name")
          .in("id", teamIds)
        
        teams?.forEach(team => {
          teamNames.set(team.id, team.name)
        })
      }
      
      let stats = projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        teamName: p.team_id ? teamNames.get(p.team_id) || null : null,
        createdAt: p.created_at,
      }))
      
      stats = applySavedOrder('projects', stats)
      setProjectStats(stats)
    } catch (e) {
      setProjectError(e instanceof Error ? e.message : "Proje verileri alınamadı")
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const fetchTaskStats = React.useCallback(async () => {
    try {
      setLoadingTasks(true)
      setTaskError(null)
      
      // Önce projeleri al
      const projects = await fetchProjects()
      // Mevcut kullanıcıyı al
      const supabase = getSupabase()
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth?.user?.id || null
      
      // Her proje için görevleri al
      const allTasks: TaskStat[] = []
      
      for (const project of projects) {
        try {
          const tasks = await fetchTasksByProject(project.id)
          
          const projectTasks = tasks
            .filter(task => {
              // Sadece bana atanmış görevler
              if (!currentUserId) return false
              return task.assigned_to === currentUserId
            })
            .map(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null
            const now = new Date()
            const daysRemaining = dueDate 
              ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null
            
            return {
              id: task.id,
              title: task.title,
              priority: task.priority,
              status: task.status,
              due_date: task.due_date,
              project_title: project.title,
              project_id: project.id,
              days_remaining: daysRemaining,
            }
          })
          
          allTasks.push(...projectTasks)
        } catch (error) {
          console.error(`Proje ${project.id} için görevler alınamadı:`, error)
        }
      }
      
      // Önce tamamlanmamış görevleri üste, tamamlanmış görevleri alta taşı
      // Sonra önceliğe ve kalan güne göre sırala
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      allTasks.sort((a, b) => {
        // Önce tamamlanma durumuna göre sırala
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1
        
        // Sonra önceliğe göre sırala
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        // Son olarak kalan güne göre sırala (null değerler en sona)
        if (a.days_remaining === null && b.days_remaining === null) return 0
        if (a.days_remaining === null) return 1
        if (b.days_remaining === null) return -1
        
        return a.days_remaining - b.days_remaining
      })
      
      setTaskStats(applySavedOrder('tasks', allTasks))
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : "Görev verileri alınamadı")
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeItem?.title === "Takımlar") {
      fetchTeamStats()
    } else if (activeItem?.title === "Projeler") {
      fetchProjectStats()
    } else if (activeItem?.title === "Görevlerim") {
      fetchTaskStats()
    }
  }, [activeItem, fetchTeamStats, fetchProjectStats, fetchTaskStats])

  const isTasksActive = activeItem?.title === "Görevlerim"
  const isTeamsActive = activeItem?.title === "Takımlar"
  const isProjectsActive = activeItem?.title === "Projeler"

  const handleNavClick = React.useCallback(
    (item: (typeof data.navMain)[number]) => {
      setActiveItem(item)
      const shuffled = [...data.mails].sort(() => Math.random() - 0.5)
      setMails(shuffled.slice(0, Math.max(5, Math.floor(Math.random() * 10) + 1)))
      // URL'yi değiştirmiyoruz, sadece sidebar içeriğini değiştiriyoruz
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
      setProjectStats(updated)
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
      setTaskStats(updated)
      saveOrder('tasks', updated.map(t => t.id))
    }
    setDragType(null)
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragType, dragIndex, teamStats, projectStats, taskStats, taskStatusFilter, taskDueFilter, taskPriorityFilter])

  // Drag & Drop state and helpers
  // duplicate state removed
  // duplicate state removed

  // duplicate helper removed

  function saveOrder(key: 'teams' | 'projects' | 'tasks', ids: string[]) {
    try { window.localStorage.setItem(`sidebar-order-${key}`, JSON.stringify(ids)) } catch {}
  }

  function loadOrder(key: 'teams' | 'projects' | 'tasks'): string[] | null {
    try {
      const raw = window.localStorage.getItem(`sidebar-order-${key}`)
      return raw ? (JSON.parse(raw) as string[]) : null
    } catch { return null }
  }

  function applySavedOrder<T extends { id: string }>(key: 'teams' | 'projects' | 'tasks', list: T[]): T[] {
    const order = typeof window !== 'undefined' ? loadOrder(key) : null
    if (!order) return list
    const idToItem = new Map(list.map(i => [i.id, i]))
    const ordered: T[] = []
    order.forEach(id => { const it = idToItem.get(id); if (it) ordered.push(it) })
    list.forEach(it => { if (!order.includes(it.id)) ordered.push(it) })
    return ordered
  }

  const onAssignProject = React.useCallback(async (teamId: string) => {
    setSelectedTeamId(teamId)
    setAssignProjectId(null)
    const supabase = getSupabase()
    const { data } = await supabase
      .from("projects")
      .select("id,title")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
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
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                    <Logo size={16} className="scale-180" withLink={false} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">YAP</span>
                    <span className="truncate text-xs">Proje Yönetimi</span>
                  </div>
                </a>
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
          <NavUser user={data.user} />
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
            {isTasksActive && (
              <Label className="flex items-center gap-2 text-sm">
                <span>Bitenler</span>
                <Switch className="shadow-none" />
              </Label>
            )}
            {isTeamsActive && (
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => setCreateOpen(true)}
                className="h-8 w-8 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
              >
                <Plus className="size-4" />
                <span className="sr-only">Takım oluştur</span>
              </Button>
            )}
            {isProjectsActive && (
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => setCreateProjectOpen(true)}
                className="h-8 w-8 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
              >
                <Plus className="size-4" />
                <span className="sr-only">Proje oluştur</span>
              </Button>
            )}
            {(isTasksActive || isProjectsActive) && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => { setTaskProjectId(null); setCreateTaskOpen(true) }}
                className="h-8 w-8 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
              >
                <Plus className="size-4" />
                <span className="sr-only">Görev oluştur</span>
              </Button>
            )}
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isTeamsActive ? (
                <div className="p-4">
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
                    </div>
                  )}
                </div>
              ) : isProjectsActive ? (
                <div className="p-4">
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
                            onSelect={(id) => router.push(`/dashboard/projects/${id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : isTasksActive ? (
                <div className="p-4">
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
                                <Button size="sm" variant="outline" className="h-8">
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
                            {filtered.slice(0, 12).map((task) => (
                          <TaskRow
                                key={task.id}
                                task={task}
                            onSelect={() => router.push(`/dashboard/tasks/${task.id}`)}
                            onStatusChange={async (taskId, status) => {
                              try {
                                await updateTask({ id: taskId, status })
                                fetchTaskStats()
                              } catch (e) {
                                console.error('Durum güncellenemedi', e)
                              }
                            }}
                              />
                            ))}
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
                mails.map((mail) => (
                  <a
                    href="#"
                    key={mail.email}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span>{mail.name}</span>{" "}
                      <span className="ml-auto text-xs">{mail.date}</span>
                    </div>
                    <span className="font-medium">{mail.subject}</span>
                    <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                      {mail.teaser}
                    </span>
                  </a>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
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
            <NewProjectForm onCreated={() => { setCreateProjectOpen(false); fetchProjectStats() }} />
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
            <DialogTitle>{taskProjectId ? 'Yeni Görev' : 'Proje Seçin'}</DialogTitle>
          </DialogHeader>
          {!taskProjectId ? (
            <div className="space-y-3">
              <Label className="text-sm">Proje</Label>
              <Select value={taskProjectId ?? ''} onValueChange={(v) => setTaskProjectId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Bir proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projectStats.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Vazgeç</Button>
                <Button disabled={!taskProjectId} onClick={() => taskProjectId && setTaskProjectId(taskProjectId)}>Devam</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="pt-2">
              <NewTaskForm 
                projectId={taskProjectId}
                onCreated={() => { setCreateTaskOpen(false); setTaskProjectId(null); if (isTasksActive) fetchTaskStats() }}
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
                  <TaskRow key={task.id} task={task} onSelect={(id) => router.push(`/dashboard/tasks/${id}`)} onStatusChange={() => {}} />
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

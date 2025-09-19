export type TeamStat = {
  id: string
  name: string
  memberCount: number | null
  projectTitle: string | null
}

export type ProjectStat = {
  id: string
  title: string
  status: string
  teamName: string | null
  createdAt: string
}

export type TaskStat = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  due_date: string | null
  project_title: string
  project_id: string
  days_remaining: number | null
}

export type PerformanceData = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  teamStats: Array<{ name: string; completed: number; total: number; rate: number }>
  projectStats: Array<{ name: string; completed: number; total: number; rate: number }>
}

export type PendingInvite = {
  id: string
  token: string
  email: string
  role: string
  created_at: string
  expires_at: string
  teams?: { id: string; name?: string }
}

export type NavItem = {
  title: string
  url: string
  icon: any
  isActive: boolean
}

export type TaskCounts = {
  todo: number
  in_progress: number
  review: number
  completed: number
}
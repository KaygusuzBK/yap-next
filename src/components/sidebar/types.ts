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

export type DragState = {
  dragType: null | 'team' | 'project' | 'task'
  dragIndex: number | null
  dragOverIndex: number | null
}

export type TaskFilters = {
  statusFilter: 'all' | 'open' | 'completed'
  dueFilter: 'all' | 'overdue' | 'today' | 'week'
  priorityFilter: 'all' | 'urgent' | 'high' | 'medium' | 'low'
  sortBy: 'smart' | 'due' | 'priority'
}

export type PendingInvitation = {
  id: string
  token: string
  email: string
  role: string
  created_at: string
  expires_at: string
  teams?: { id: string; name?: string }
}

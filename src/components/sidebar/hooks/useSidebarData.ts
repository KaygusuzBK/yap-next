"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getSupabase } from "@/lib/supabase"
import { applySavedOrder } from "@/lib/sidebarOrder"
import { useProjects } from "@/features/projects/queries"
import { useMyTasks, keys as taskQueryKeys } from "@/features/tasks/queries"
import { getPendingInvitations, getTeamMembers } from "@/features/teams/api"
import type { TeamStat, ProjectStat, TaskStat, PendingInvitation } from "../types"

export function useSidebarData() {
  const qc = useQueryClient()
  const { data: hookProjects = [], isLoading: hookLoadingProjects, error: hookProjectsError } = useProjects()
  const { data: hookMyTasks = [], isLoading: hookLoadingMyTasks, error: hookTasksError } = useMyTasks()

  // Team stats state
  const [teamStats, setTeamStats] = React.useState<TeamStat[]>([])
  const [loadingTeams, setLoadingTeams] = React.useState(false)
  const [teamError, setTeamError] = React.useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvitation[]>([])

  // Derived states
  const loadingProjects = hookLoadingProjects
  const projectError = hookProjectsError ? (hookProjectsError as Error).message : null
  const loadingTasks = hookLoadingMyTasks
  const taskError = hookTasksError ? (hookTasksError as Error).message : null

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

  const fetchPendingInvites = React.useCallback(async () => {
    try {
      const list = await getPendingInvitations()
      setPendingInvites(list as PendingInvitation[])
    } catch { 
      setPendingInvites([]) 
    }
  }, [])

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

  // Realtime subscription for tasks
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('sidebar-task-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        qc.invalidateQueries({ queryKey: taskQueryKeys.tasks() }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])

  return {
    // Team data
    teamStats,
    setTeamStats,
    loadingTeams,
    teamError,
    fetchTeamStats,
    pendingInvites,
    setPendingInvites,
    fetchPendingInvites,
    
    // Project data
    projectStats,
    loadingProjects,
    projectError,
    
    // Task data
    taskStats,
    loadingTasks,
    taskError,
  }
}

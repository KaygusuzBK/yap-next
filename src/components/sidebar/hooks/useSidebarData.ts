"use client"

import React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useProjects, projectKeys } from "@/features/projects/queries"
import { useMyTasks, keys as taskQueryKeys } from "@/features/tasks/queries"
import { applySavedOrder } from "@/lib/sidebarOrder"
import type { TeamStat, ProjectStat, TaskStat } from "../types"

export function useSidebarData() {
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

  return {
    projectStats,
    taskStats,
    nearestTask,
    loadingProjects,
    projectError,
    loadingTasks,
    taskError,
    qc
  }
}
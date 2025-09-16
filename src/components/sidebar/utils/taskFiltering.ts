import type { TaskStat, TaskFilters } from "../types"

export function filterTasks(tasks: TaskStat[], filters: TaskFilters): TaskStat[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.statusFilter === 'open' && task.status === 'completed') return false
    if (filters.statusFilter === 'completed' && task.status !== 'completed') return false
    
    // Due date filter
    if (filters.dueFilter === 'overdue' && !(task.days_remaining !== null && task.days_remaining < 0)) return false
    if (filters.dueFilter === 'today' && !(task.days_remaining === 0)) return false
    if (filters.dueFilter === 'week' && !(task.days_remaining !== null && task.days_remaining >= 0 && task.days_remaining <= 7)) return false
    
    // Priority filter
    if (filters.priorityFilter !== 'all' && task.priority !== filters.priorityFilter) return false
    
    return true
  })
}

export function sortTasks(tasks: TaskStat[], sortBy: TaskFilters['sortBy']): TaskStat[] {
  const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
  
  return [...tasks].sort((a, b) => {
    if (sortBy === 'due') {
      const ad = a.days_remaining ?? Number.POSITIVE_INFINITY
      const bd = b.days_remaining ?? Number.POSITIVE_INFINITY
      return ad - bd
    } else if (sortBy === 'priority') {
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    } else {
      // smart: completed last, then priority, then due date
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      const pr = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (pr !== 0) return pr
      const ad = a.days_remaining ?? Number.POSITIVE_INFINITY
      const bd = b.days_remaining ?? Number.POSITIVE_INFINITY
      return ad - bd
    }
  })
}

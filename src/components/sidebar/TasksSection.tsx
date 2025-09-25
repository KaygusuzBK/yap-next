"use client"

import React from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskRow } from "./TaskRow"
import type { TaskStat } from "./types"

interface TasksSectionProps {
  taskStats: TaskStat[]
  loadingTasks: boolean
  taskError: string | null
  selectedTaskId: string | null
  currentPath: string
  onSelect: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStat['status']) => void
  onMyTasksOpen: () => void
  taskStatusFilter: 'all' | 'open' | 'completed'
  taskDueFilter: 'all' | 'overdue' | 'today' | 'week'
  taskPriorityFilter: 'all' | 'urgent' | 'high' | 'medium' | 'low'
  taskSortBy: 'smart' | 'due' | 'priority'
  onStatusFilterChange: (filter: 'all' | 'open' | 'completed') => void
  onDueFilterChange: (filter: 'all' | 'overdue' | 'today' | 'week') => void
  onPriorityFilterChange: (filter: 'all' | 'urgent' | 'high' | 'medium' | 'low') => void
  onSortByChange: (sort: 'smart' | 'due' | 'priority') => void
}

export function TasksSection({
  taskStats,
  loadingTasks,
  taskError,
  selectedTaskId,
  currentPath,
  onSelect,
  onStatusChange,
  onMyTasksOpen,
  taskStatusFilter,
  taskDueFilter,
  taskPriorityFilter,
  taskSortBy,
  onStatusFilterChange,
  onDueFilterChange,
  onPriorityFilterChange,
  onSortByChange
}: TasksSectionProps) {
  if (loadingTasks) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  if (taskError) {
    // Şema henüz uygulanmamış olabilir veya kullanıcıda veri yok olabilir
    // Ham hata yerine sade boş durum göster
    return <p className="text-sm text-muted-foreground">Şu an bir göreviniz yok.</p>
  }

  const activeCount = [
    taskStatusFilter !== 'all',
    taskDueFilter !== 'all',
    taskPriorityFilter !== 'all',
    taskSortBy !== 'smart',
  ].filter(Boolean).length

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

  return (
    <>
      {/* Kompakt filtre toolbar */}
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
            <DropdownMenuItem onClick={() => onStatusFilterChange('all')} inset>
              Tüm Durumlar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange('open')} inset>
              Açık
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange('completed')} inset>
              Biten
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Tarih</div>
            <DropdownMenuItem onClick={() => onDueFilterChange('all')} inset>
              Tümü
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDueFilterChange('overdue')} inset>
              Gecikmiş
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDueFilterChange('today')} inset>
              Bugün
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDueFilterChange('week')} inset>
              7 Gün
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Öncelik</div>
            <DropdownMenuItem onClick={() => onPriorityFilterChange('all')} inset>
              Tümü
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityFilterChange('urgent')} inset>
              Acil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityFilterChange('high')} inset>
              Yüksek
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityFilterChange('medium')} inset>
              Orta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityFilterChange('low')} inset>
              Düşük
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Sırala</div>
            <DropdownMenuItem onClick={() => onSortByChange('smart')} inset>
              Öncelik+Durum
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange('due')} inset>
              Bitiş Tarihi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange('priority')} inset>
              Öncelik
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="outline" className="h-8" onClick={onMyTasksOpen}>
          Görevlerim
        </Button>
      </div>

      {/* Filtrelenmiş liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Filtrelere uygun görev yok.</p>
      ) : (
        <div className="flex flex-col">
          {filtered.slice(0, 12).map((task) => {
            const isCurrent = selectedTaskId === task.id || currentPath === `/dashboard/tasks/${task.id}`
            return (
              <TaskRow
                key={task.id}
                task={task}
                isCurrent={isCurrent}
                onSelect={() => onSelect(task.id)}
                onStatusChange={onStatusChange}
              />
            )
          })}
          {filtered.length > 12 && (
            <div className="text-center p-2 text-xs text-muted-foreground">+{filtered.length - 12} görev daha...</div>
          )}
        </div>
      )}
    </>
  )
}

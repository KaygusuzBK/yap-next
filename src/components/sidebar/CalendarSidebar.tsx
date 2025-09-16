"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { format, isSameDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyTasks, keys as taskKeys } from '@/features/tasks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import type { Task } from '@/features/tasks/api'

type CalendarTask = Task & { due: Date | null }

interface CalendarSidebarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  view: 'month' | 'week' | 'day'
  onViewChange: (view: 'month' | 'week' | 'day') => void
}

export default function CalendarSidebar({ currentDate, onDateChange, view, onViewChange }: CalendarSidebarProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: tasks = [], isLoading } = useMyTasks()

  const tasksWithDue = React.useMemo<CalendarTask[]>(() => {
    return tasks.map(t => {
      const parsed = t.due_date ? new Date(t.due_date) : null
      const due = parsed && !isNaN(parsed.getTime()) ? parsed : null
      return { ...t, due }
    })
  }, [tasks])

  const today = React.useMemo(() => new Date(), [])
  const monthLabel = format(currentDate, 'LLLL yyyy', { locale: tr })

  // Bugünün görevleri
  const todayTasks = React.useMemo(() => {
    return tasksWithDue.filter(task => task.due && isSameDay(task.due, today))
  }, [tasksWithDue, today])

  // Bu haftanın görevleri
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekTasks = React.useMemo(() => {
    return tasksWithDue.filter(task => 
      task.due && task.due >= weekStart && task.due <= weekEnd
    )
  }, [tasksWithDue, weekStart, weekEnd])

  // Bu ayın görevleri
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthTasks = React.useMemo(() => {
    return tasksWithDue.filter(task => 
      task.due && task.due >= monthStart && task.due <= monthEnd
    )
  }, [tasksWithDue, monthStart, monthEnd])

  // Gecikmiş görevler
  const overdueTasks = React.useMemo(() => {
    return tasksWithDue.filter(task => 
      task.due && task.due < today && task.status !== 'completed'
    )
  }, [tasksWithDue, today])

  // Yaklaşan görevler (gelecek 7 gün)
  const upcomingTasks = React.useMemo(() => {
    const nextWeek = addDays(today, 7)
    return tasksWithDue.filter(task => 
      task.due && task.due > today && task.due <= nextWeek && task.status !== 'completed'
    )
  }, [tasksWithDue, today])

  // En yakın görevi bul
  const nearestTask = React.useMemo(() => {
    const incompleteTasks = tasksWithDue.filter(task => 
      task.status !== 'completed' && task.due
    )
    
    if (incompleteTasks.length === 0) return null
    
    // Önce bugünün görevleri, sonra gelecekteki görevler, son olarak geçmişteki görevler
    const todayTasks = incompleteTasks.filter(task => task.due && isSameDay(task.due, today))
    if (todayTasks.length > 0) {
      return todayTasks.sort((a, b) => {
        if (!a.due || !b.due) return 0
        return a.due.getTime() - b.due.getTime()
      })[0]
    }
    
    const futureTasks = incompleteTasks.filter(task => task.due && task.due > today)
    if (futureTasks.length > 0) {
      return futureTasks.sort((a, b) => {
        if (!a.due || !b.due) return 0
        return a.due.getTime() - b.due.getTime()
      })[0]
    }
    
    const pastTasks = incompleteTasks.filter(task => task.due && task.due < today)
    if (pastTasks.length > 0) {
      return pastTasks.sort((a, b) => {
        if (!a.due || !b.due) return 0
        return b.due.getTime() - a.due.getTime() // En yakın geçmiş görev
      })[0]
    }
    
    return null
  }, [tasksWithDue, today])

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'in_progress': return <Clock className="h-3 w-3 text-blue-600" />
      case 'review': return <AlertCircle className="h-3 w-3 text-yellow-600" />
      default: return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`)
  }


  // Realtime subscription for tasks
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('calendar-sidebar-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        console.log('Project tasks changed, refreshing calendar sidebar...')
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('Tasks changed, refreshing calendar sidebar...')
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])

  const renderTaskList = (tasks: CalendarTask[], title: string, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      )
    }

    if (tasks.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">{emptyMessage}</div>
      )
    }

    return (
      <div className="space-y-2">
        {tasks.slice(0, 5).map(task => (
          <div
            key={task.id}
            className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => handleTaskClick(task.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(task.status)}
                  <span className={`text-xs font-medium ${task.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority === 'urgent' ? 'Acil' : 
                     task.priority === 'high' ? 'Yüksek' :
                     task.priority === 'medium' ? 'Orta' : 'Düşük'}
                  </Badge>
                  {task.due && (
                    <span className="text-xs text-muted-foreground">
                      {format(task.due, 'dd MMM', { locale: tr })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {tasks.length > 5 && (
          <div className="text-xs text-muted-foreground text-center">
            +{tasks.length - 5} görev daha...
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Takvim Kontrolleri */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Takvim Kontrolleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Görünüm Seçimi */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={view === 'month' ? 'default' : 'outline'}
              onClick={() => onViewChange('month')}
              className="flex-1"
            >
              Ay
            </Button>
            <Button
              size="sm"
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => onViewChange('week')}
              className="flex-1"
            >
              Hafta
            </Button>
            <Button
              size="sm"
              variant={view === 'day' ? 'default' : 'outline'}
              onClick={() => onViewChange('day')}
              className="flex-1"
            >
              Gün
            </Button>
          </div>

          {/* Tarih Navigasyonu */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (view === 'month') onDateChange(subDays(currentDate, 30))
                else if (view === 'week') onDateChange(subDays(currentDate, 7))
                else onDateChange(subDays(currentDate, 1))
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-sm font-medium">
                {view === 'month' ? monthLabel : format(currentDate, 'dd MMM yyyy', { locale: tr })}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (view === 'month') onDateChange(addDays(currentDate, 30))
                else if (view === 'week') onDateChange(addDays(currentDate, 7))
                else onDateChange(addDays(currentDate, 1))
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDateChange(today)}
              className="w-full"
            >
              Bugüne Git
            </Button>
            
            {nearestTask && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleTaskClick(nearestTask.id)}
                className="w-full"
              >
                <Target className="h-3 w-3 mr-2" />
                En Yakın Göreve Git
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bugünün Görevleri */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Bugün ({todayTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTaskList(todayTasks, 'Bugün', 'Bugün için görev yok')}
        </CardContent>
      </Card>

      {/* Gecikmiş Görevler */}
      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Gecikmiş ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderTaskList(overdueTasks, 'Gecikmiş', 'Gecikmiş görev yok')}
          </CardContent>
        </Card>
      )}

      {/* Yaklaşan Görevler */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-600">
              <Clock className="h-4 w-4" />
              Yaklaşan ({upcomingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderTaskList(upcomingTasks, 'Yaklaşan', 'Yaklaşan görev yok')}
          </CardContent>
        </Card>
      )}

      {/* İstatistikler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">İstatistikler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bu Hafta:</span>
            <span className="font-medium">{weekTasks.length} görev</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Bu Ay:</span>
            <span className="font-medium">{monthTasks.length} görev</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tamamlanan:</span>
            <span className="font-medium text-green-600">
              {tasksWithDue.filter(t => t.status === 'completed').length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

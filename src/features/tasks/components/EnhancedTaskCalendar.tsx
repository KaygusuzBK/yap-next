"use client";

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  addDays, addMonths, addWeeks,
  endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, 
  subDays, subMonths, subWeeks, 
  format, isSameMonth, isToday, isValid, parseISO, 
  isSameDay, isSameHour, 
  setHours
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarDays, ChevronLeft, ChevronRight, Clock, 
  Filter, Eye, EyeOff, BarChart3, 
  CheckCircle, AlertCircle, Target
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useMyTasks, keys as taskKeys } from '@/features/tasks/queries'
import { updateTask } from '@/features/tasks/api'
import { useQueryClient } from '@tanstack/react-query'
import { useProjects } from '@/features/projects/queries'
import { getSupabase } from '@/lib/supabase'
import type { Task } from '@/features/tasks/api'

type CalendarTask = Task & { due: Date | null }

interface EnhancedTaskCalendarProps {
  initialView?: 'month' | 'week' | 'day' | 'timeline'
  initialDate?: Date
}

export default function EnhancedTaskCalendar({ 
  initialView = 'month', 
  initialDate = new Date() 
}: EnhancedTaskCalendarProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: tasks = [], isLoading, isError } = useMyTasks()
  const { data: projects = [] } = useProjects()
  
  const [view, setView] = useState<'month' | 'week' | 'day' | 'timeline'>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)
  const [showStats, setShowStats] = useState(false)
  
  // Filtreler
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const monthLabel = useMemo(() => format(currentDate, 'LLLL yyyy', { locale: tr }), [currentDate])

  const monthRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [currentDate])

  const weekRange = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const days: Date[] = []
    for (let i = 0; i < 7; i++) days.push(addDays(start, i))
    return days
  }, [currentDate])

  const timelineRange = useMemo(() => {
    const start = startOfDay(currentDate)
    const hours: Date[] = []
    for (let i = 0; i < 24; i++) {
      hours.push(setHours(start, i))
    }
    return hours
  }, [currentDate])

  const tasksWithDue = useMemo<CalendarTask[]>(() => {
    return tasks.map(t => {
      const parsed = t.due_date ? parseISO(t.due_date) : null
      const due = parsed && isValid(parsed) ? parsed : null
      return { ...t, due }
    })
  }, [tasks])

  // Filtrelenmiş görevler
  const filteredTasks = useMemo(() => {
    return tasksWithDue.filter(task => {
      // Tamamlanan görevleri filtrele
      if (!showCompleted && task.status === 'completed') return false
      
      // Proje filtresi
      if (projectFilter !== 'all' && task.project_id !== projectFilter) return false
      
      // Öncelik filtresi
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      
      // Durum filtresi
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      
      return true
    })
  }, [tasksWithDue, showCompleted, projectFilter, priorityFilter, statusFilter])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of filteredTasks) {
      if (!t.due || !isValid(t.due)) continue
      const key = format(t.due, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [filteredTasks])

  const tasksByHour = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of filteredTasks) {
      if (!t.due || !isValid(t.due)) continue
      const key = format(t.due, 'yyyy-MM-dd-HH')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [filteredTasks])

  const undatedTasks = useMemo(() => filteredTasks.filter(t => !t.due), [filteredTasks])

  // En yakın görevi bul
  const nearestTask = useMemo(() => {
    const incompleteTasks = filteredTasks.filter(task => 
      task.status !== 'completed' && task.due
    )
    
    if (incompleteTasks.length === 0) return null
    
    const today = new Date()
    
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
  }, [filteredTasks])

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.status === 'completed').length
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length
    const overdue = filteredTasks.filter(t => t.due && t.due < new Date() && t.status !== 'completed').length
    
    return { total, completed, inProgress, overdue }
  }, [filteredTasks])


  // Realtime subscription for tasks
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('calendar-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        console.log('Project tasks changed, refreshing calendar...')
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('Tasks changed, refreshing calendar...')
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])

  async function onDropTaskToDay(taskId: string, day: Date) {
    const dueLocal = startOfDay(day)
    const iso = new Date(dueLocal.getFullYear(), dueLocal.getMonth(), dueLocal.getDate(), 12, 0, 0).toISOString()
    try {
      await updateTask({ id: taskId, due_date: iso })
      await qc.invalidateQueries({ queryKey: taskKeys.tasks() })
    } catch {}
  }

  async function onDropTaskToHour(taskId: string, hour: Date) {
    const iso = hour.toISOString()
    try {
      await updateTask({ id: taskId, due_date: iso })
      await qc.invalidateQueries({ queryKey: taskKeys.tasks() })
    } catch {}
  }

  function getPriorityBadge(priority: Task['priority']) {
    switch (priority) {
      case 'low':
        return <Badge variant="secondary" className="text-xs">Düşük</Badge>
      case 'medium':
        return <Badge variant="default" className="text-xs">Orta</Badge>
      case 'high':
        return <Badge variant="destructive" className="text-xs">Yüksek</Badge>
      case 'urgent':
        return <Badge variant="destructive" className="bg-red-600 text-xs">Acil</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>
    }
  }

  function getStatusIcon(status: Task['status']) {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'in_progress': return <Clock className="h-3 w-3 text-blue-600" />
      case 'review': return <AlertCircle className="h-3 w-3 text-yellow-600" />
      default: return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  function renderMonthGrid() {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-xs text-muted-foreground font-medium">
          {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
            <div key={d} className="px-2 py-1 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
          {monthRange.map((day, idx) => {
            const inMonth = isSameMonth(day, currentDate)
            const dayKey = format(day, 'yyyy-MM-dd')
            const items = tasksByDay.get(dayKey) ?? []
            const today = isToday(day)
            const isDragOver = dragOverKey === dayKey
            
            return (
              <div
                key={idx}
                className={`min-h-32 bg-background p-2 ${inMonth ? '' : 'bg-muted/30'} ${isDragOver ? 'ring-2 ring-primary/60' : ''} hover:bg-muted/50 transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(dayKey) }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToDay(id, day); setDragOverKey(null) }}
              >
                <div className={`flex items-center justify-between text-sm mb-2 ${today ? 'font-bold text-blue-700' : 'text-muted-foreground'}`}>
                  <span>{format(day, 'd', { locale: tr })}</span>
                  {today && <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs">Bugün</span>}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 4).map(task => (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                      className={`w-full text-left rounded px-2 py-1 text-xs border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      title={task.title}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          {getStatusIcon(task.status)}
                          <span className="truncate">{task.title}</span>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>
                    </button>
                  ))}
                  {items.length > 4 && (
                    <div className="text-[10px] text-muted-foreground text-center">+{items.length - 4} daha</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderWeekGrid() {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-xs text-muted-foreground font-medium">
          {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
            <div key={d} className="px-2 py-1 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
          {weekRange.map((day, idx) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const items = tasksByDay.get(dayKey) ?? []
            const today = isToday(day)
            const isDragOver = dragOverKey === dayKey
            
            return (
              <div
                key={idx}
                className={`min-h-40 bg-background p-3 ${isDragOver ? 'ring-2 ring-primary/60' : ''} hover:bg-muted/50 transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(dayKey) }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToDay(id, day); setDragOverKey(null) }}
              >
                <div className={`flex items-center justify-between text-sm mb-3 ${today ? 'font-bold text-blue-700' : 'text-muted-foreground'}`}>
                  <span>{format(day, 'd MMM', { locale: tr })}</span>
                  {today && <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs">Bugün</span>}
                </div>
                <div className="space-y-2">
                  {items.map(task => (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                      className={`w-full text-left rounded px-2 py-2 text-sm border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(task.status)}
                          <span className="truncate font-medium">{task.title}</span>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.due && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(task.due, 'HH:mm', { locale: tr })}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderDayView() {
    const dayKey = format(currentDate, 'yyyy-MM-dd')
    const items = tasksByDay.get(dayKey) ?? []
    const isDragOver = dragOverKey === dayKey
    
    return (
      <div
        className={`rounded-lg border p-4 ${isDragOver ? 'ring-2 ring-primary/60' : ''} hover:bg-muted/50 transition-colors`}
        onDragOver={(e) => { e.preventDefault(); setDragOverKey(dayKey) }}
        onDragLeave={() => setDragOverKey(null)}
        onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToDay(id, currentDate); setDragOverKey(null) }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {format(currentDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
          </div>
          {isToday(currentDate) && (
            <Badge className="bg-blue-100 text-blue-700">Bugün</Badge>
          )}
        </div>
        
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Bu gün için görev yok
            </div>
          ) : (
            items.map(task => (
              <button
                key={task.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                className={`w-full text-left rounded-lg px-4 py-3 border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(task.status)}
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.due && (
                        <div className="text-sm text-muted-foreground">
                          {format(task.due, 'HH:mm', { locale: tr })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    <Badge variant="outline" className="text-xs">
                      {task.status === 'completed' ? 'Tamamlandı' :
                       task.status === 'in_progress' ? 'Devam ediyor' :
                       task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
                    </Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  function renderTimelineView() {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-25 text-xs text-muted-foreground font-medium">
          {timelineRange.map((hour, idx) => (
            <div key={idx} className="px-2 py-1 text-center border-r">
              {format(hour, 'HH:mm')}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-25 gap-px rounded-lg overflow-hidden border bg-border">
          {timelineRange.map((hour, idx) => {
            const hourKey = format(hour, 'yyyy-MM-dd-HH')
            const items = tasksByHour.get(hourKey) ?? []
            const isDragOver = dragOverKey === hourKey
            const isCurrentHour = isSameHour(hour, new Date())
            
            return (
              <div
                key={idx}
                className={`min-h-16 bg-background p-1 ${isDragOver ? 'ring-2 ring-primary/60' : ''} ${isCurrentHour ? 'bg-blue-50 border-blue-200' : ''} hover:bg-muted/50 transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(hourKey) }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToHour(id, hour); setDragOverKey(null) }}
              >
                <div className="space-y-1">
                  {items.map(task => (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                      className={`w-full text-left rounded px-1 py-1 text-xs border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      title={task.title}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <div>Görevler yükleniyor...</div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-96 flex items-center justify-center text-red-600">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <div>Görevler yüklenemedi</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              <CardTitle className="text-xl">Gelişmiş Takvim</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {/* İstatistik Toggle */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? 'İstatistikleri Gizle' : 'İstatistikleri Göster'}
              </Button>
              
              {/* Tamamlanan Görevleri Göster/Gizle */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showCompleted ? 'Tamamlananları Gizle' : 'Tamamlananları Göster'}
              </Button>
              
              {/* Bugüne Git */}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentDate(new Date())}
              >
                Bugün
              </Button>
              
              {/* En Yakın Göreve Git */}
              {nearestTask && (
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => router.push(`/dashboard/tasks/${nearestTask.id}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Target className="h-4 w-4 mr-2" />
                  En Yakın Göreve Git
                </Button>
              )}
            </div>
          </div>

          {/* Navigasyon ve Görünüm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
                  else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
                  else if (view === 'day') setCurrentDate(subDays(currentDate, 1))
                  else setCurrentDate(subDays(currentDate, 1))
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold w-48 text-center">
                {view === 'month' ? monthLabel : 
                 view === 'week' ? format(currentDate, 'dd MMM yyyy', { locale: tr }) :
                 view === 'day' ? format(currentDate, 'dd MMMM yyyy', { locale: tr }) :
                 format(currentDate, 'dd MMM yyyy', { locale: tr })}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
                  else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
                  else if (view === 'day') setCurrentDate(addDays(currentDate, 1))
                  else setCurrentDate(addDays(currentDate, 1))
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day' | 'timeline')}>
              <TabsList>
                <TabsTrigger value="month">Ay</TabsTrigger>
                <TabsTrigger value="week">Hafta</TabsTrigger>
                <TabsTrigger value="day">Gün</TabsTrigger>
                <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filtreler */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtreler:</span>
            </div>
            
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Proje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Projeler</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="todo">Yapılacak</SelectItem>
                <SelectItem value="in_progress">Devam ediyor</SelectItem>
                <SelectItem value="review">İncelemede</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* İstatistikler */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">İstatistikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Toplam Görev</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Tamamlandı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">Devam Ediyor</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-sm text-muted-foreground">Gecikmiş</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Takvim İçeriği */}
      <Card>
        <CardContent className="p-6">
          {view === 'month' && renderMonthGrid()}
          {view === 'week' && renderWeekGrid()}
          {view === 'day' && renderDayView()}
          {view === 'timeline' && renderTimelineView()}
        </CardContent>
      </Card>

      {/* Tarihi olmayan görevler */}
      {undatedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tarihi Olmayan Görevler ({undatedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {undatedTasks.map(task => (
                <button
                  key={task.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                  className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Durum: {task.status === 'completed' ? 'Tamamlandı' :
                            task.status === 'in_progress' ? 'Devam ediyor' :
                            task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

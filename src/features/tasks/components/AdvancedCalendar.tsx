"use client";

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  addDays, addMonths, addWeeks, 
  endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, 
  subMonths, subWeeks, 
  format, isSameMonth, isValid, parseISO, 
  isSameDay
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, ChevronRight, Clock, 
  Filter, Eye, EyeOff, BarChart3, 
  AlertCircle, Target,
  Calendar as CalendarIcon
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

interface AdvancedCalendarProps {
  initialView?: 'month' | 'week' | 'agenda'
  initialDate?: Date
}

export default function AdvancedCalendar({ 
  initialView = 'week', 
  initialDate = new Date() 
}: AdvancedCalendarProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: tasks = [], isLoading, isError } = useMyTasks()
  const { data: projects = [] } = useProjects()
  
  const [view, setView] = useState<'month' | 'week' | 'agenda'>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)
  const [showStats, setShowStats] = useState(true)
  
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
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
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
      if (!showCompleted && task.status === 'completed') {
        return false
      }
      if (projectFilter !== 'all' && task.project_id !== projectFilter) {
        return false
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false
      }
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [tasksWithDue, showCompleted, projectFilter, priorityFilter, statusFilter])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of filteredTasks) {
      if (!t.due || !isValid(t.due)) {
        continue
      }
      const key = format(t.due, 'yyyy-MM-dd')
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(t)
    }
    return map
  }, [filteredTasks])

  const undatedTasks = useMemo(() => filteredTasks.filter(t => !t.due), [filteredTasks])

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.status === 'completed').length
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length
    const overdue = filteredTasks.filter(t => t.due && t.due < new Date() && t.status !== 'completed').length
    
    return { total, completed, inProgress, overdue }
  }, [filteredTasks])

  // En yakın görevi bul
  const nearestTask = useMemo(() => {
    const incompleteTasks = filteredTasks.filter(task => 
      task.status !== 'completed' && task.due
    )
    
    if (incompleteTasks.length === 0) return null
    
    const today = new Date()
    
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
    
    return null
  }, [filteredTasks])


  async function onDropTaskToDay(taskId: string, day: Date) {
    const dueLocal = startOfDay(day)
    const iso = new Date(dueLocal.getFullYear(), dueLocal.getMonth(), dueLocal.getDate(), 12, 0, 0).toISOString()
    try {
      await updateTask({ id: taskId, due_date: iso })
      await qc.invalidateQueries({ queryKey: taskKeys.tasks() })
    } catch {}
  }

  function getPriorityColor(priority: Task['priority']) {
    switch (priority) {
      case 'urgent': {
        return 'bg-red-500 text-white'
      }
      case 'high': {
        return 'bg-orange-500 text-white'
      }
      case 'medium': {
        return 'bg-blue-500 text-white'
      }
      case 'low': {
        return 'bg-green-500 text-white'
      }
      default: {
        return 'bg-gray-500 text-white'
      }
    }
  }

  function getStatusColor(status: Task['status']) {
    switch (status) {
      case 'completed': {
        return 'bg-green-100 text-green-800 border-green-200'
      }
      case 'in_progress': {
        return 'bg-blue-100 text-blue-800 border-blue-200'
      }
      case 'review': {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
      default: {
        return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

  function getPriorityIcon(priority: Task['priority']) {
    switch (priority) {
      case 'urgent': {
        return '🔴'
      }
      case 'high': {
        return '🟠'
      }
      case 'medium': {
        return '🔵'
      }
      case 'low': {
        return '🟢'
      }
      default: {
        return '⚪'
      }
    }
  }

  function renderWeekView() {
    return (
      <div className="space-y-4">
        {/* Hafta başlığı */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {weekRange[0] && weekRange[6] ? `${format(weekRange[0], 'dd MMM', { locale: tr })} - ${format(weekRange[6], 'dd MMM yyyy', { locale: tr })}` : ''}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Haftalık takvim grid */}
        <div className="grid grid-cols-7 gap-1 rounded-lg border bg-muted/20 p-2">
          {/* Gün başlıkları */}
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Günler */}
          {weekRange.map((day, index) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const tasks = tasksByDay.get(dayKey) ?? []
            const isToday = isSameDay(day, new Date())
            const isDragOver = dragOverKey === dayKey
            
            return (
              <div
                key={index}
                className={`min-h-32 rounded-lg border-2 p-2 transition-all ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-transparent hover:border-muted-foreground/20'
                } ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
                onDragOver={(e) => { 
                  e.preventDefault(); 
                  setDragOverKey(dayKey) 
                }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  const id = e.dataTransfer.getData('text/task-id'); 
                  if (id) {
                    onDropTaskToDay(id, day)
                  }
                  setDragOverKey(null) 
                }}
              >
                {/* Gün numarası */}
                <div className={`mb-2 text-sm font-medium ${
                  isToday ? 'text-blue-600' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                  {isToday && (
                    <span className="ml-1 text-xs">Bugün</span>
                  )}
                </div>
                
                {/* Görevler */}
                <div className="space-y-1">
                  {tasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => { 
                        e.dataTransfer.setData('text/task-id', task.id) 
                      }}
                      className={`cursor-pointer rounded-md border p-1.5 text-xs transition-all hover:shadow-sm ${
                        task.status === 'completed' ? 'opacity-60 line-through' : ''
                      } ${getStatusColor(task.status)}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{getPriorityIcon(task.priority)}</span>
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                      {task.due && (
                        <div className="text-xs opacity-70">
                          {format(task.due, 'HH:mm', { locale: tr })}
                        </div>
                      )}
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{tasks.length - 3} daha
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderMonthView() {
    return (
      <div className="space-y-4">
        {/* Ay başlığı */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{monthLabel}</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aylık takvim grid */}
        <div className="grid grid-cols-7 gap-1 rounded-lg border bg-muted/20 p-2">
          {/* Gün başlıkları */}
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Günler */}
          {monthRange.map((day, index) => {
            const inMonth = isSameMonth(day, currentDate)
            const dayKey = format(day, 'yyyy-MM-dd')
            const tasks = tasksByDay.get(dayKey) ?? []
            const isToday = isSameDay(day, new Date())
            const isDragOver = dragOverKey === dayKey
            
            return (
              <div
                key={index}
                className={`min-h-24 rounded-lg border p-1.5 transition-all ${
                  inMonth ? 'bg-background' : 'bg-muted/30'
                } ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-transparent hover:border-muted-foreground/20'
                } ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
                onDragOver={(e) => { 
                  e.preventDefault(); 
                  setDragOverKey(dayKey) 
                }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  const id = e.dataTransfer.getData('text/task-id'); 
                  if (id) {
                    onDropTaskToDay(id, day)
                  }
                  setDragOverKey(null) 
                }}
              >
                <div className={`text-sm font-medium ${
                  isToday ? 'text-blue-600' : inMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="mt-1 space-y-0.5">
                  {tasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => { 
                        e.dataTransfer.setData('text/task-id', task.id) 
                      }}
                      className={`cursor-pointer rounded px-1 py-0.5 text-xs transition-all hover:shadow-sm ${
                        task.status === 'completed' ? 'opacity-60 line-through' : ''
                      } ${getStatusColor(task.status)}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{getPriorityIcon(task.priority)}</span>
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                  {tasks.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{tasks.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderAgendaView() {
    const upcomingTasks = filteredTasks
      .filter(task => task.due && task.due >= new Date())
      .sort((a, b) => {
        if (!a.due || !b.due) return 0
        return a.due.getTime() - b.due.getTime()
      })

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Yaklaşan Görevler</h3>
        <div className="space-y-2">
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Yaklaşan görev yok
            </div>
          ) : (
            upcomingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
              >
                <div className={`h-3 w-3 rounded-full ${getPriorityColor(task.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.due && format(task.due, 'dd MMM yyyy, HH:mm', { locale: tr })}
                  </div>
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {task.status === 'completed' ? 'Tamamlandı' :
                   task.status === 'in_progress' ? 'Devam ediyor' :
                   task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Realtime subscription for tasks
  React.useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('advanced-calendar-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        qc.invalidateQueries({ queryKey: taskKeys.tasks() }).catch(() => {})
      })
      .subscribe()

    return () => {
      try { 
        supabase.removeChannel(channel) 
      } catch {}
    }
  }, [qc])

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
              <CalendarIcon className="h-6 w-6" />
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
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold w-48 text-center">
                {view === 'month' ? monthLabel : 
                 view === 'week' ? format(currentDate, 'dd MMM yyyy', { locale: tr }) :
                 'Gündem'}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
                  else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'agenda')}>
              <TabsList>
                <TabsTrigger value="month">Ay</TabsTrigger>
                <TabsTrigger value="week">Hafta</TabsTrigger>
                <TabsTrigger value="agenda">Gündem</TabsTrigger>
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
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'agenda' && renderAgendaView()}
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
                      <span className="text-xs">{getPriorityIcon(task.priority)}</span>
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status === 'completed' ? 'Tamamlandı' :
                       task.status === 'in_progress' ? 'Devam ediyor' :
                       task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
                    </Badge>
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

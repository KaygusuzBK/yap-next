"use client";

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, isToday, isValid, parseISO, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyTasks, keys as taskKeys } from '@/features/tasks/queries'
import { updateTask } from '@/features/tasks/api'
import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '@/features/tasks/api'

type CalendarTask = Task & { due: Date | null }

function getPriorityBadge(priority: Task['priority']) {
  switch (priority) {
    case 'low':
      return <Badge variant="secondary">Düşük</Badge>
    case 'medium':
      return <Badge variant="default">Orta</Badge>
    case 'high':
      return <Badge variant="destructive">Yüksek</Badge>
    case 'urgent':
      return <Badge variant="destructive" className="bg-red-600">Acil</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

export default function TaskCalendar() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: tasks = [], isLoading, isError } = useMyTasks()
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState<Date>(startOfMonth(new Date()))
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

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

  const tasksWithDue = useMemo<CalendarTask[]>(() => {
    return tasks.map(t => {
      const parsed = t.due_date ? parseISO(t.due_date) : null
      const due = parsed && isValid(parsed) ? parsed : null
      return { ...t, due }
    })
  }, [tasks])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of tasksWithDue) {
      if (!t.due || !isValid(t.due)) continue
      const key = format(t.due, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasksWithDue])

  const undatedTasks = useMemo(() => tasksWithDue.filter(t => !t.due), [tasksWithDue])

  async function onDropTaskToDay(taskId: string, day: Date) {
    const dueLocal = startOfDay(day)
    const iso = new Date(dueLocal.getFullYear(), dueLocal.getMonth(), dueLocal.getDate(), 12, 0, 0).toISOString()
    try {
      await updateTask({ id: taskId, due_date: iso })
      await qc.invalidateQueries({ queryKey: taskKeys.tasks() })
    } catch {}
  }

  function renderGrid(days: Date[]) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-xs text-muted-foreground">
          {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
            <div key={d} className="px-2 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
          {days.map((day, idx) => {
            const inMonth = isSameMonth(day, currentDate)
            const dayKey = format(day, 'yyyy-MM-dd')
            const items = tasksByDay.get(dayKey) ?? []
            const today = isToday(day)
            const isDragOver = dragOverKey === dayKey
            return (
              <div
                key={idx}
                className={`min-h-28 bg-background p-1 sm:p-2 ${inMonth ? '' : 'bg-muted/30'} ${isDragOver ? 'ring-2 ring-primary/60' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(dayKey) }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToDay(id, day); setDragOverKey(null) }}
              >
                <div className={`flex items-center justify-between text-xs mb-1 ${today ? 'font-semibold text-blue-700' : 'text-muted-foreground'}`}>
                  <span>{format(day, 'd', { locale: tr })}</span>
                  {today && <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5">Bugün</span>}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                      className={`w-full text-left rounded px-1 py-0.5 text-xs border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      title={task.title}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{task.title}</span>
                        <span>{getPriorityBadge(task.priority)}</span>
                      </div>
                    </button>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">+{items.length - 3} daha</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <CardTitle>Takvim</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(startOfDay(new Date())) }}>Bugün</Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
                  else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
                  else setCurrentDate(subDays(currentDate, 1))
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium w-40 text-center">
                {view === 'month' ? monthLabel : format(currentDate, 'd LLLL yyyy', { locale: tr })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
                  else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
                  else setCurrentDate(addDays(currentDate, 1))
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day')}>
            <TabsList>
              <TabsTrigger value="month">Ay</TabsTrigger>
              <TabsTrigger value="week">Hafta</TabsTrigger>
              <TabsTrigger value="day">Gün</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
          ) : isError ? (
            <div className="h-40 flex items-center justify-center text-red-600">Görevler yüklenemedi</div>
          ) : (
            <div className="space-y-2">
              {view === 'month' && renderGrid(monthRange)}
              {view === 'week' && renderGrid(weekRange)}
              {view === 'day' && (
                <div
                  className={`rounded-lg border p-3 ${dragOverKey ? 'ring-2 ring-primary/60' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverKey(format(currentDate, 'yyyy-MM-dd')) }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/task-id'); if (id) onDropTaskToDay(id, currentDate); setDragOverKey(null) }}
                >
                  <div className="text-sm text-muted-foreground mb-2">{format(currentDate, 'dd-MM-yyyy')}</div>
                  <div className="space-y-1">
                    {(tasksByDay.get(format(currentDate, 'yyyy-MM-dd')) ?? []).map(task => (
                      <button
                        key={task.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/task-id', task.id) }}
                        className={`w-full text-left rounded px-2 py-1 text-sm border hover:bg-muted transition ${task.status === 'completed' ? 'opacity-70 line-through' : ''}`}
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{task.title}</span>
                          <span>{getPriorityBadge(task.priority)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarihi olmayan görevler */}
      {undatedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarihi olmayan görevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {undatedTasks.map(t => (
                <button
                  key={t.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/task-id', t.id) }}
                  onClick={() => router.push(`/dashboard/tasks/${t.id}`)}
                  className="text-left p-2 border rounded hover:bg-muted transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-medium">{t.title}</div>
                    {getPriorityBadge(t.priority)}
                  </div>
                  <div className="text-xs text-muted-foreground">Durum: {t.status}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



"use client";

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMyTasks } from '@/features/tasks/queries'
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
  const { data: tasks = [], isLoading, isError } = useMyTasks()
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))

  const monthLabel = useMemo(() => format(currentMonth, 'LLLL yyyy', { locale: tr }), [currentMonth])

  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    }
    return days
  }, [currentMonth])

  const tasksWithDue = useMemo<CalendarTask[]>(() => {
    return tasks.map(t => ({ ...t, due: t.due_date ? parseISO(t.due_date) : null }))
  }, [tasks])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of tasksWithDue) {
      if (!t.due) continue
      const key = format(t.due, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasksWithDue])

  const undatedTasks = useMemo(() => tasksWithDue.filter(t => !t.due), [tasksWithDue])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Takvim</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Bugün</Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium w-40 text-center">{monthLabel}</div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
          ) : isError ? (
            <div className="h-40 flex items-center justify-center text-red-600">Görevler yüklenemedi</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-xs text-muted-foreground">
                {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
                  <div key={d} className="px-2 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
                {range.map((day, idx) => {
                  const inMonth = isSameMonth(day, currentMonth)
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const items = tasksByDay.get(dayKey) ?? []
                  const today = isToday(day)
                  return (
                    <div key={idx} className={`min-h-28 bg-background p-1 sm:p-2 ${inMonth ? '' : 'bg-muted/30'}`}>
                      <div className={`flex items-center justify-between text-xs mb-1 ${today ? 'font-semibold text-blue-700' : 'text-muted-foreground'}`}>
                        <span>{format(day, 'd', { locale: tr })}</span>
                        {today && <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5">Bugün</span>}
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map(task => (
                          <button
                            key={task.id}
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



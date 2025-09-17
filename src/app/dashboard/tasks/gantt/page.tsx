"use client";

import * as React from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import GanttView from '@/features/tasks/components/GanttView'
import { fetchMyTasks, type Task } from '@/features/tasks/api'

export default function TasksGanttPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const t = await fetchMyTasks()
        setTasks(t)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const ganttTasks = React.useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      start_date: t.created_at,
      due_date: t.due_date,
    }))
  }, [tasks])

  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <DashboardHeader title="Gantt" backHref="/dashboard/tasks" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Görevler', href: '/dashboard/tasks' }, { label: 'Gantt' }]} />
      <div className="mt-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        ) : (
          <GanttView tasks={ganttTasks as any} />
        )}
      </div>
    </div>
  )
}



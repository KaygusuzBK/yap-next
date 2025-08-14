"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMyTasks } from "@/features/tasks/queries"
import { AlertCircle, Calendar, CheckCircle, Clock, ListTodo } from "lucide-react"

export default function TasksMobilePage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { user } = useAuth()
  const { data: tasks, isLoading, error } = useMyTasks()

  React.useEffect(() => {
    if (!isMobile) {
      router.replace("/dashboard")
    }
  }, [isMobile, router])

  if (!isMobile) return null

  if (!user) {
    return (
      <main className="px-3 py-3">
        <p className="text-sm text-muted-foreground">Görevleri görmek için giriş yapın.</p>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="px-3 py-3">
        <Card>
          <CardContent className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="px-3 py-3">
        <Card>
          <CardContent className="p-6 text-red-600 text-sm">Hata: {(error as Error).message}</CardContent>
        </Card>
      </main>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-3.5 w-3.5 text-gray-500" />
      case 'in_progress':
        return <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
      case 'review':
        return <Clock className="h-3.5 w-3.5 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      default:
        return <ListTodo className="h-3.5 w-3.5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <main className="px-3 py-3">
      <div className="mb-3">
        <h1 className="text-base font-semibold">Görevlerim</h1>
        <p className="text-sm text-muted-foreground">Size atanmış ve oluşturduğunuz görevler</p>
      </div>

      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Henüz görev yok</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard#new-task')} variant="outline">İlk görevi oluştur</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors" role="button" onClick={() => router.push(`/dashboard/tasks/${task.id}`)}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                <div>
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    {task.project_title && <span>{task.project_title}</span>}
                    {task.due_date && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(task.due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}



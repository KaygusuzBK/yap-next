"use client"

import { useEffect, useState } from "react"
import { fetchProjects, type Project } from "@/features/projects/api"
import { fetchTeams, type Team } from "@/features/teams/api"
import { fetchMyTasks, updateTask, type Task } from "@/features/tasks/api"
import { getSupabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/I18nProvider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Folder, Users, Calendar, TrendingUp } from "lucide-react"

export default function Page() {
  const { t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [showCompletedBoard, setShowCompletedBoard] = useState(false)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<"todo" | "in_progress" | "review" | "completed" | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingProjects(true)
        setLoadingTeams(true)
        const [projectsData, teamsData] = await Promise.all([
          fetchProjects(),
          fetchTeams()
        ])
        if (mounted) {
          setProjects(projectsData)
          setTeams(teamsData)
        }
      } catch (e) {
        if (mounted) {
          console.error("Veri yükleme hatası:", e)
        }
      } finally {
        if (mounted) {
          setLoadingProjects(false)
          setLoadingTeams(false)
        }
      }
    })()
    ;(async () => {
      try {
        setLoadingTasks(true)
        const tasks = await fetchMyTasks()
        if (mounted) setMyTasks(tasks)
      } catch (e) {
        if (mounted) console.error("Görevler yüklenemedi:", e)
      } finally {
        if (mounted) setLoadingTasks(false)
      }
    })()
    const supabase = getSupabase()
    const channel = supabase
      .channel('board_project_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        fetchMyTasks().then(setMyTasks).catch(() => {})
      })
      .subscribe()
    return () => {
      mounted = false
      channel.unsubscribe()
    }
  }, [])

  return (
    <main className="flex flex-1 flex-col p-2 gap-4">
      <div className="w-full space-y-4">
        <section>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">{t('dashboard.breadcrumb.home')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('dashboard.breadcrumb.dashboard')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>
                    <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dashboard.overview.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalProjects')}</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingProjects ? t('common.loading') : t('dashboard.overview.totalProjectsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalTeams')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingTeams ? "..." : teams.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingTeams ? t('common.loading') : t('dashboard.overview.totalTeamsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.activeProjects')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.overview.activeProjectsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.overview.thisMonth')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingProjects ? "..." : projects.filter(p => {
                    const created = new Date(p.created_at)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear()
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.overview.thisMonthDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Teams and Projects sections removed as requested */}

        {/* Board & Backlog using shadcn Tabs */}
        <Tabs defaultValue="board" className="space-y-4">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="backlog">Backlog</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <Label htmlFor="showCompletedBoard" className="text-sm">Bitenleri göster</Label>
              <Switch id="showCompletedBoard" checked={showCompletedBoard} onCheckedChange={setShowCompletedBoard} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {([
                { key: 'todo', title: 'Yapılacak' },
                { key: 'in_progress', title: 'Devam Ediyor' },
                { key: 'review', title: 'İncelemede' },
                { key: 'completed', title: 'Tamamlandı' },
              ] as const).map((col) => {
                const columnTasks = myTasks.filter(t => t.status === col.key && (showCompletedBoard || t.status !== 'completed'))
                return (
                  <Card
                    key={col.key}
                    onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.key) }}
                    onDragLeave={() => setDragOverStatus(prev => (prev === col.key ? null : prev))}
                    onDrop={async () => {
                      if (!dragTaskId) return
                      const task = myTasks.find(t => t.id === dragTaskId)
                      if (!task || task.status === col.key) { setDragOverStatus(null); setDragTaskId(null); return }
                      const prevStatus = task.status
                      // optimistic
                      setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: col.key } : t))
                      setDragOverStatus(null)
                      setDragTaskId(null)
                      try {
                        await updateTask({ id: task.id, status: col.key })
                      } catch {
                        // revert
                        setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: prevStatus } : t))
                      }
                    }}
                    className={dragOverStatus === col.key ? 'ring-2 ring-primary' : undefined}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{col.title}</CardTitle>
                      <Badge variant={col.key === 'completed' ? 'secondary' : 'outline'}>{loadingTasks ? '...' : columnTasks.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {loadingTasks ? (
                        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                      ) : columnTasks.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Kayıt yok</div>
                      ) : (
                        <div className="space-y-2">
                          {columnTasks.slice(0, 50).map(task => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDragTaskId(task.id)}
                              className="rounded-md border p-2 hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
                              onClick={() => { if (!dragTaskId) window.location.href = `/dashboard/tasks/${task.id}` }}
                            >
                                <div className="text-sm font-medium truncate">{task.title}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  {task.project_title && <span className="truncate">{task.project_title}</span>}
                                  <span className="inline-flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-border" />
                                    {task.priority}
                                  </span>
                                </div>
                            </div>
                          ))}
                          {columnTasks.length > 5 && (
                            <div className="text-xs text-muted-foreground">+{columnTasks.length - 5} daha</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="backlog">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yapılacaklar</CardTitle>
                <Badge variant="outline">{loadingTasks ? '...' : myTasks.filter(t => t.status === 'todo').length}</Badge>
              </CardHeader>
              <CardContent>
                {loadingTasks ? (
                  <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                ) : (
                  <div className="space-y-2">
                    {myTasks
                      .filter(t => t.status === 'todo')
                      .sort((a, b) => {
                        const prioRank = { urgent: 4, high: 3, medium: 2, low: 1 } as const
                        const diff = prioRank[b.priority] - prioRank[a.priority]
                        if (diff !== 0) return diff
                        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity
                        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity
                        return ad - bd
                      })
                      .slice(0, 10)
                      .map(task => (
                        <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="block">
                          <div className="rounded-md border p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{task.title}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  {task.project_title && <span className="truncate">{task.project_title}</span>}
                                  {task.due_date && <span>{new Date(task.due_date).toLocaleDateString('tr-TR')}</span>}
                                </div>
                              </div>
                              <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                            </div>
                          </div>
                        </Link>
                    ))}
                    {myTasks.filter(t => t.status === 'todo').length === 0 && (
                      <div className="text-sm text-muted-foreground">Backlog boş</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

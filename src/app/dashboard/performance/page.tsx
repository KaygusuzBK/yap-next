"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardHeader from "@/components/layout/DashboardHeader"
import { fetchProjects, type Project } from "@/features/projects/api"

type StatusChange = { at: string; from?: string | null; to?: string | null }

export default function PerformancePage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7)
  const [rows, setRows] = useState<Array<{
    task_id: string
    task_title: string
    project_id: string
    project_title?: string | null
    completed_at?: string | null
    durations: Record<string, number>
  }>>([])
  const [summary, setSummary] = useState<Record<string, { completed: number }>>({})

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        // load projects for filter
        const projs = await fetchProjects()
        setProjects(projs)

        const supabase = getSupabase()
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id
        if (!uid) { setRows([]); setSummary({}); return }
        const sinceIso = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString()

        // Fetch status change activities in range
        const { data: acts } = await supabase
          .from('task_activities')
          .select('task_id, user_id, action, details, created_at')
          .gte('created_at', sinceIso)
        type Act = { task_id: string; user_id: string; action: string; details: { status?: { old?: string | null; new?: string | null } } | null; created_at: string }
        const activities: Act[] = (acts as Act[] | null) ?? []

        // Optional project filter requires fetching tasks meta
        const taskIds = Array.from(new Set(activities.map(a => a.task_id)))
        let tasksMeta: Array<{ id: string; title: string; project_id: string; project_title?: string | null }> = []
        if (taskIds.length > 0) {
          const q = supabase
            .from('project_tasks')
            .select('id, title, project_id, projects(title)')
            .in('id', taskIds)
          const { data: tdata } = await q
          tasksMeta = ((tdata as Array<{ id: string; title: string; project_id: string; projects?: { title?: string | null } }> | null) ?? []).map(r => ({ id: r.id, title: r.title, project_id: r.project_id, project_title: r.projects?.title ?? null }))
        }

        const projectFilterId = projectFilter === 'all' ? null : projectFilter
        const allowedTaskIds = new Set(tasksMeta.filter(m => !projectFilterId || m.project_id === projectFilterId).map(m => m.id))

        // Group by task and compute durations between status changes (clipped to range start only by first change)
        const byTask: Record<string, { changes: StatusChange[]; lastCompleted?: string | null }> = {}
        for (const a of activities) {
          if (!allowedTaskIds.has(a.task_id)) continue
          const st = a.details?.status
          if (!byTask[a.task_id]) byTask[a.task_id] = { changes: [] }
          if (a.action === 'task_updated' && st && (st.old !== st.new)) {
            byTask[a.task_id].changes.push({ at: a.created_at, from: st.old ?? undefined, to: st.new ?? undefined })
            if (st.new === 'completed') byTask[a.task_id].lastCompleted = a.created_at
          }
        }

        const resultRows: typeof rows = []
        const projectSummary: typeof summary = {}
        for (const taskId of Object.keys(byTask)) {
          const meta = tasksMeta.find(m => m.id === taskId)
          if (!meta) continue
          const sorted = byTask[taskId].changes.sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime())
          const durations: Record<string, number> = {}
          for (let i = 0; i < sorted.length; i++) {
            const cur = sorted[i]
            const nxt = sorted[i+1]
            const key = (cur.to || 'unknown') as string
            const start = new Date(cur.at).getTime()
            const end = nxt ? new Date(nxt.at).getTime() : Date.now()
            const delta = Math.max(0, Math.floor((end - start) / 1000))
            durations[key] = (durations[key] || 0) + delta
          }
          resultRows.push({
            task_id: taskId,
            task_title: meta.title,
            project_id: meta.project_id,
            project_title: meta.project_title,
            completed_at: byTask[taskId].lastCompleted ?? null,
            durations,
          })
          if (!projectSummary[meta.project_id]) projectSummary[meta.project_id] = { completed: 0 }
          if (byTask[taskId].lastCompleted) projectSummary[meta.project_id].completed += 1
        }

        setRows(resultRows)
        setSummary(projectSummary)
      } finally {
        setLoading(false)
      }
    })()
  }, [rangeDays, projectFilter])

  const totalCompleted = useMemo(() => rows.filter(r => !!r.completed_at).length, [rows])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}sa ${m}dk`
    return `${m}dk`
  }

  return (
    <main className="flex flex-1 flex-col w-full px-4 py-3 md:px-6 md:py-4 space-y-6">
      <DashboardHeader
        title="Performans"
        breadcrumb={[{ label: t('dashboard.breadcrumb.dashboard'), href: '/dashboard' }, { label: 'Performans' }]}
      />

      <section className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border p-1">
          {[7,14,30].map((d) => (
            <Button key={d} size="sm" variant={rangeDays === d ? 'default' : 'ghost'} onClick={() => setRangeDays(d as 7|14|30)}>
              Son {d} Gün
            </Button>
          ))}
        </div>
        <div className="min-w-[200px]">
          <select
            className="border rounded px-2 py-1 text-sm h-9 bg-background"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">Tüm Projeler</option>
            {projects.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
          </select>
        </div>
        <Badge variant="outline">Tamamlanan: {loading ? '—' : totalCompleted}</Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_,i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-6 w-24" /><Skeleton className="h-8 w-16 mt-2" /></CardContent></Card>
          ))
        ) : (
          Object.entries(summary).map(([pid, s]) => (
            <Card key={pid}><CardHeader className="pb-2"><CardTitle className="text-sm">{projects.find(p => p.id === pid)?.title || 'Proje'}</CardTitle></CardHeader><CardContent>
              <div className="text-sm text-muted-foreground">Tamamlanan Görev</div>
              <div className="text-2xl font-bold">{s.completed}</div>
            </CardContent></Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Görev Bazında Detay</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Görev</th>
                <th className="text-left p-2">Proje</th>
                <th className="text-left p-2">Bitiş</th>
                <th className="text-left p-2">Aşama Süreleri</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={4}><Skeleton className="h-6 w-full" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="p-3 text-muted-foreground" colSpan={4}>Kayıt yok</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.task_id} className="border-t">
                    <td className="p-2 whitespace-nowrap max-w-[280px] truncate" title={r.task_title}>{r.task_title}</td>
                    <td className="p-2 whitespace-nowrap max-w-[220px] truncate">{r.project_title || r.project_id}</td>
                    <td className="p-2 whitespace-nowrap">{r.completed_at ? new Date(r.completed_at).toLocaleString('tr-TR') : '—'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(r.durations).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs">
                            <span className="font-medium">{k}</span>
                            <span className="text-muted-foreground">{formatDuration(v)}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}



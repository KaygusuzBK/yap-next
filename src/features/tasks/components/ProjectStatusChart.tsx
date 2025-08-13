"use client";

import React, { useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

type Row = { project_id: string; project_title: string; status: string; avg_seconds: number; sample_count: number }

export default function ProjectStatusChart({ projectId }: { projectId: string }) {
  const { data = [] } = useQuery<Row[]>({
    queryKey: ['project-status-avg-seconds', projectId],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('project_status_avg_seconds')
        .select('*')
        .eq('project_id', projectId)
      if (error) throw error
      return (data as Row[]) || []
    },
    enabled: Boolean(projectId),
    staleTime: 60_000,
  })

  const bars = useMemo(() => {
    const max = Math.max(...data.map((r) => r.avg_seconds || 0), 1)
    return data.map((r) => ({ label: r.status, width: Math.round((r.avg_seconds / max) * 100), value: r.avg_seconds }))
  }, [data])

  if (data.length === 0) return <div className="text-sm text-muted-foreground">Veri bulunamadı</div>
  return (
    <div className="space-y-2">
      {bars.map((b) => (
        <div key={b.label} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{b.label}</span>
            <span>{Math.round(b.value / 3600)}s</span>
          </div>
          <div className="h-2 rounded bg-muted">
            <div className="h-2 rounded bg-primary" style={{ width: `${b.width}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}



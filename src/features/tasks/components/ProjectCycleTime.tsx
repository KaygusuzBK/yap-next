"use client";

import React from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

type Row = { project_id: string; project_title: string; avg_cycle_seconds: number; completed_count: number }

export default function ProjectCycleTime({ projectId }: { projectId: string }) {
  const { data } = useQuery<Row | null>({
    queryKey: ['project-cycle-avg', projectId],
    queryFn: async () => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('project_cycle_time_avg')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()
      if (error) throw error
      return (data as Row) || null
    },
    enabled: Boolean(projectId),
    staleTime: 60_000,
  })
  if (!data) return <div className="text-sm text-muted-foreground">Veri bulunamadı</div>
  const hours = Math.round((data.avg_cycle_seconds || 0) / 3600)
  return (
    <div className="text-sm">
      Ortalama çevrim süresi: <span className="font-medium">{hours} saat</span> ({data.completed_count} tamamlanan görev)
    </div>
  )
}



"use client";

import React from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

type Row = { task_id: string; title: string; project_id: string; project_title: string; assigned_to: string | null; full_name: string | null; email: string | null; last_review_at: string; seconds_in_review: number }

export default function ReviewSlaAlerts({ projectId }: { projectId?: string }) {
  const { data = [] } = useQuery<Row[]>({
    queryKey: ['review-sla-breaches', projectId || 'all'],
    queryFn: async () => {
      const supabase = getSupabase()
      let q = supabase.from('review_sla_breaches').select('*')
      if (projectId) q = q.eq('project_id', projectId)
      const { data, error } = await q
      if (error) throw error
      return (data as Row[]) || []
    },
    staleTime: 60_000,
  })
  if (data.length === 0) return null
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="text-sm font-medium">SLA Uyarıları (Review {'>'} 2 gün)</div>
      {data.map((r) => (
        <div key={r.task_id} className="text-xs text-muted-foreground">
          <span className="font-medium">{r.title}</span> — {r.project_title}
          {r.full_name ? ` • ${r.full_name}` : r.email ? ` • ${r.email}` : ''}
        </div>
      ))}
    </div>
  )
}



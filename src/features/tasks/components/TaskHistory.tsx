"use client";

import React from 'react'
import { useTaskStatusTimeline, type TaskStatusInterval } from '@/features/tasks/queries'

function fmtDuration(totalSeconds: number) {
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (d > 0) return `${d}g ${h}s ${m}d`
  if (h > 0) return `${h}s ${m}d`
  return `${m}d`
}

export default function TaskHistory({ taskId }: { taskId: string }) {
  const { data = [], isLoading } = useTaskStatusTimeline(taskId)
  if (isLoading) return <div className="text-sm text-muted-foreground">Geçmiş yükleniyor…</div>
  if (data.length === 0) return <div className="text-sm text-muted-foreground">Henüz geçmiş yok.</div>
  return (
    <div className="space-y-3">
      {data.map((it: TaskStatusInterval, idx: number) => (
        <div key={`${it.status}-${idx}`} className="rounded-md border p-3">
          <div className="text-sm font-medium">Durum: {it.status}</div>
          <div className="text-xs text-muted-foreground">
            Başlangıç: {new Date(it.started_at).toLocaleString('tr-TR')}
            {it.ended_at && <> • Bitiş: {new Date(it.ended_at).toLocaleString('tr-TR')}</>}
            • Süre: {fmtDuration(it.seconds_in_status)}
          </div>
        </div>
      ))}
    </div>
  )
}



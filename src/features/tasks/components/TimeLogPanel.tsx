"use client";

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addTimeLog, deleteTimeLog, listTimeLogs, type TaskTimeLog } from '@/features/tasks/api'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

export default function TimeLogPanel({ taskId }: { taskId: string }) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery<TaskTimeLog[]>({
    queryKey: ['time-logs', taskId],
    queryFn: () => listTimeLogs(taskId),
    enabled: Boolean(taskId),
    staleTime: 60_000,
  })
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [desc, setDesc] = useState('')
  const [openStart, setOpenStart] = useState(false)
  const [openEnd, setOpenEnd] = useState(false)

  const create = useMutation({
    mutationFn: () => addTimeLog({ task_id: taskId, start_time: start, end_time: end || null, description: desc || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-logs', taskId] })
      setStart(''); setEnd(''); setDesc('')
    }
  })
  const del = useMutation({
    mutationFn: (id: string) => deleteTimeLog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-logs', taskId] })
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <Button type="button" variant="outline" className="w-full" onClick={() => setOpenStart(v=>!v)}>Başlangıç</Button>
          <div className="text-xs text-muted-foreground mt-1">{start ? new Date(start).toLocaleString('tr-TR') : '—'}</div>
          {openStart && (
            <div className="p-2 border rounded mt-2">
              <Calendar
                mode="single"
                selected={start ? new Date(start) : undefined}
                onSelect={(d) => { if (d) setStart(new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16)); setOpenStart(false) }}
              />
            </div>
          )}
        </div>
        <div>
          <Button type="button" variant="outline" className="w-full" onClick={() => setOpenEnd(v=>!v)}>Bitiş</Button>
          <div className="text-xs text-muted-foreground mt-1">{end ? new Date(end).toLocaleString('tr-TR') : '—'}</div>
          {openEnd && (
            <div className="p-2 border rounded mt-2">
              <Calendar
                mode="single"
                selected={end ? new Date(end) : undefined}
                onSelect={(d) => { if (d) setEnd(new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16)); setOpenEnd(false) }}
              />
            </div>
          )}
        </div>
        <input placeholder="Açıklama (opsiyonel)" value={desc} onChange={(e) => setDesc(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <Button size="sm" onClick={() => create.mutate()} disabled={!start || create.status === 'pending'}>
          Kaydet
        </Button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor…</div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground">Henüz zaman kaydı yok.</div>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="flex items-center justify-between border rounded p-2 text-sm">
              <span>
                {new Date(r.start_time).toLocaleString('tr-TR')} 
                {r.end_time ? ` → ${new Date(r.end_time).toLocaleString('tr-TR')}` : ''}
                {r.description ? ` • ${r.description}` : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={() => del.mutate(r.id)}>Sil</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}



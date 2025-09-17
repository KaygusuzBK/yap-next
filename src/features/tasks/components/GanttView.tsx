"use client";

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type GanttTask = {
  id: string
  title: string
  start_date?: string | null
  due_date?: string | null
  depends_on?: string[]
}

export default function GanttView({ tasks = [] as GanttTask[] }: { tasks?: GanttTask[] }) {
  const today = new Date()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt (Önizleme)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-3">
          Bağımlılık çizgileri ve tarih şeridi daha sonra eklenecek. Şimdilik basit bir liste gösterilir.
        </div>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Görev bulunamadı.</div>
          ) : (
            tasks.map((t) => {
              const start = t.start_date ? new Date(t.start_date) : null
              const end = t.due_date ? new Date(t.due_date) : null
              return (
                <div key={t.id} className="p-3 border rounded">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {start ? start.toLocaleDateString('tr-TR') : '—'} → {end ? end.toLocaleDateString('tr-TR') : '—'}
                    {end && end < today && <span className="ml-2 text-red-600">(geçmiş)</span>}
                  </div>
                  {t.depends_on?.length ? (
                    <div className="text-xs text-muted-foreground mt-1">Bağımlılıklar: {t.depends_on.join(', ')}</div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}



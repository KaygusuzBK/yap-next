"use client";

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Task = { id: string; title: string; status?: string | null; assignee_name?: string | null }

export default function Swimlanes({ tasks = [] as Task[], mode = 'status' as 'status' | 'assignee' }) {
  const lanes = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    const keyOf = (t: Task) => (mode === 'status' ? (t.status || 'Belirsiz') : (t.assignee_name || 'Atanmamış'))
    for (const t of tasks) {
      const k = keyOf(t)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(t)
    }
    return Array.from(map.entries())
  }, [tasks, mode])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swimlanes (Önizleme)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lanes.map(([name, items]) => (
            <div key={name} className="border rounded">
              <div className="px-3 py-2 border-b font-medium text-sm">{name}</div>
              <div className="p-3 space-y-2 text-sm">
                {items.map((t) => (
                  <div key={t.id} className="p-2 rounded border bg-background">{t.title}</div>
                ))}
                {items.length === 0 && <div className="text-muted-foreground">—</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



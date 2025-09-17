"use client";

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SprintPlanner() {
  const [start, setStart] = React.useState<string>('')
  const [end, setEnd] = React.useState<string>('')
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Planlama (Önizleme)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">Sprint tarihlerini seçin ve görevleri sürükleyip bırakın (yakında).</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="border rounded px-2 h-9" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="border rounded px-2 h-9" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <Button disabled>Kaydet (yakında)</Button>
        </div>
      </CardContent>
    </Card>
  )
}



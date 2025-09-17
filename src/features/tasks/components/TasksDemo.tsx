"use client";

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import GanttView from './GanttView'
import Swimlanes from './Swimlanes'
import SprintPlanner from './SprintPlanner'

const demoTasks = [
  { id: 't1', title: 'Analiz', status: 'todo', assignee_name: 'Ayşe', start_date: '2025-09-15T08:00:00.000Z', due_date: '2025-09-17T18:00:00.000Z' },
  { id: 't2', title: 'Tasarım', status: 'in_progress', assignee_name: 'Mehmet', start_date: '2025-09-16T08:00:00.000Z', due_date: '2025-09-19T18:00:00.000Z', depends_on: ['t1'] },
  { id: 't3', title: 'Geliştirme', status: 'review', assignee_name: 'Zeynep', start_date: '2025-09-20T08:00:00.000Z', due_date: '2025-09-27T18:00:00.000Z', depends_on: ['t2'] },
  { id: 't4', title: 'Test', status: 'completed', assignee_name: 'Ali', start_date: '2025-09-22T08:00:00.000Z', due_date: '2025-09-25T18:00:00.000Z', depends_on: ['t3'] },
]

export default function TasksDemo() {
  const [mode, setMode] = React.useState<'status' | 'assignee'>('status')
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gantt Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <GanttView tasks={demoTasks as any} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Swimlanes Demo</CardTitle>
            <div className="text-xs flex items-center gap-2">
              <button className={`px-2 py-1 rounded border ${mode==='status'?'bg-primary text-primary-foreground':''}`} onClick={() => setMode('status')}>Status</button>
              <button className={`px-2 py-1 rounded border ${mode==='assignee'?'bg-primary text-primary-foreground':''}`} onClick={() => setMode('assignee')}>Assignee</button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Swimlanes tasks={demoTasks as any} mode={mode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sprint Planlama Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <SprintPlanner />
        </CardContent>
      </Card>
    </div>
  )
}



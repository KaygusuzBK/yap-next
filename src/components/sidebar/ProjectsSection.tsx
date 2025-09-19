"use client"

import React from "react"
import { ProjectRow } from "./ProjectRow"
import type { ProjectStat, TaskStat, TaskCounts } from "./types"

interface ProjectsSectionProps {
  projectStats: ProjectStat[]
  taskStats: TaskStat[]
  loadingProjects: boolean
  projectError: string | null
  onSelect: (projectId: string) => void
  onDragStart: (type: 'project', index: number) => void
  onDragOver: (e: React.DragEvent, type: 'project', index: number) => void
  onDrop: (type: 'project', index: number) => void
  dragType: 'team' | 'project' | 'task' | null
  dragOverIndex: number | null
}

export function ProjectsSection({
  projectStats,
  taskStats,
  loadingProjects,
  projectError,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  dragType,
  dragOverIndex
}: ProjectsSectionProps) {
  if (loadingProjects) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  if (projectError) {
    return <p className="text-sm text-red-600">{projectError}</p>
  }

  if (projectStats.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz proje yok.</p>
  }

  return (
    <div className="flex flex-col">
      {projectStats.map((p, index) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => onDragStart('project', index)}
          onDragOver={(e) => onDragOver(e, 'project', index)}
          onDrop={() => onDrop('project', index)}
          className={dragType === 'project' && dragOverIndex === index ? 'outline outline-2 outline-primary/60 rounded-sm' : ''}
        >
          <ProjectRow
            project={p}
            counts={{
              todo: taskStats.filter(t => t.project_id === p.id && (t.status === 'todo' || t.status === null)).length,
              in_progress: taskStats.filter(t => t.project_id === p.id && t.status === 'in_progress').length,
              review: taskStats.filter(t => t.project_id === p.id && t.status === 'review').length,
              completed: taskStats.filter(t => t.project_id === p.id && t.status === 'completed').length,
            }}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}

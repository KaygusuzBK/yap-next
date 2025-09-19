"use client"

import React from "react"
import { Calendar, CheckCircle, Folder } from "lucide-react"
import type { ProjectStat, TaskCounts } from "./types"

interface ProjectRowProps {
  project: ProjectStat
  counts?: TaskCounts
  onSelect: (projectId: string) => void
}

export const ProjectRow = React.memo(function ProjectRow({
  project,
  counts,
  onSelect,
}: ProjectRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': {
        return <Calendar className="h-3 w-3 text-blue-500" />
      }
      case 'completed': {
        return <CheckCircle className="h-3 w-3 text-green-500" />
      }
      case 'archived': {
        return <Folder className="h-3 w-3 text-gray-500" />
      }
      default: {
        return <Calendar className="h-3 w-3" />
      }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': {
        return 'Aktif'
      }
      case 'completed': {
        return 'Tamamlandı'
      }
      case 'archived': {
        return 'Arşivlenmiş'
      }
      default: {
        return status
      }
    }
  }

  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm"
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(project.id)
      }}
    >
      <button type="button" onClick={() => onSelect(project.id)} className="text-left">
        <div className="font-medium">{project.title}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {getStatusIcon(project.status)}
          {getStatusText(project.status)}
        </div>
        <div className="text-xs text-muted-foreground">
          {project.teamName ? `Takım: ${project.teamName}` : 'Kişisel Proje'}
        </div>
        {counts && (
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" />Y:{counts.todo}</span>
            <span className="inline-flex items-center gap-1 text-blue-600"><span className="h-2 w-2 rounded-full bg-blue-500" />D:{counts.in_progress}</span>
            <span className="inline-flex items-center gap-1 text-yellow-600"><span className="h-2 w-2 rounded-full bg-yellow-500" />İ:{counts.review}</span>
            <span className="inline-flex items-center gap-1 text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" />T:{counts.completed}</span>
          </div>
        )}
      </button>
    </div>
  )
})

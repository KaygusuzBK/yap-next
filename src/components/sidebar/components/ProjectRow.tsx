"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, Folder } from "lucide-react"
import type { ProjectStat } from "../types"

type ProjectRowProps = {
  project: ProjectStat
  onSelect: (projectId: string) => void
}

export const ProjectRow = React.memo(function ProjectRow({
  project,
  onSelect,
}: ProjectRowProps) {
  const router = useRouter()
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Calendar className="h-3 w-3 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'archived':
        return <Folder className="h-3 w-3 text-gray-500" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'completed':
        return 'Tamamlandı'
      case 'archived':
        return 'Arşivlenmiş'
      default:
        return status
    }
  }

  return (
    <div
      className="group hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100"
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onMouseEnter={() => router.prefetch(`/dashboard/projects/${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(project.id)
      }}
    >
      <button type="button" onClick={() => onSelect(project.id)} className="text-left group-active:opacity-90 transition-opacity">
        <div className="font-medium">{project.title}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {getStatusIcon(project.status)}
          {getStatusText(project.status)}
        </div>
        <div className="text-xs text-muted-foreground">
          {project.teamName ? `Takım: ${project.teamName}` : 'Kişisel Proje'}
        </div>
      </button>
    </div>
  )
})

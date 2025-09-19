"use client"

import React from "react"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TeamStat } from "./types"

interface TeamRowProps {
  team: TeamStat
  onOpenRename: (teamId: string, currentName: string) => void
  onDelete: (teamId: string) => void
  onAssignProject: (teamId: string) => void
  onAddMember: (teamId: string) => void
  onSelect: (teamId: string) => void
}

export const TeamRow = React.memo(function TeamRow({
  team,
  onOpenRename,
  onDelete,
  onAssignProject,
  onAddMember,
  onSelect,
}: TeamRowProps) {
  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm"
      onClick={() => onSelect(team.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(team.id)
      }}
    >
      <button type="button" onClick={() => onSelect(team.id)} className="text-left">
        <div className="font-medium">{team.name}</div>
        <div className="text-xs text-muted-foreground mt-1">Üye sayısı: {team.memberCount ?? "—"}</div>
        <div className="text-xs text-muted-foreground">Proje: {team.projectTitle ?? "—"}</div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="shrink-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAddMember(team.id)}>Üye Ekle</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAssignProject(team.id)}>Proje Ata</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onOpenRename(team.id, team.name)}>İsmi Değiştir</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(team.id)}>Sil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

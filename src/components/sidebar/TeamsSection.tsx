"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { acceptTeamInvitation, declineTeamInvitation } from "@/features/teams/api"
import { TeamRow } from "./TeamRow"
import type { TeamStat, PendingInvite } from "./types"

interface TeamsSectionProps {
  teamStats: TeamStat[]
  loadingTeams: boolean
  teamError: string | null
  pendingInvites: PendingInvite[]
  onOpenRename: (teamId: string, currentName: string) => void
  onDelete: (teamId: string) => void
  onAssignProject: (teamId: string) => void
  onAddMember: (teamId: string) => void
  onSelect: (teamId: string) => void
  onDragStart: (type: 'team', index: number) => void
  onDragOver: (e: React.DragEvent, type: 'team', index: number) => void
  onDrop: (type: 'team', index: number) => void
  dragType: 'team' | 'project' | 'task' | null
  dragOverIndex: number | null
}

export function TeamsSection({
  teamStats,
  loadingTeams,
  teamError,
  pendingInvites,
  onOpenRename,
  onDelete,
  onAssignProject,
  onAddMember,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  dragType,
  dragOverIndex
}: TeamsSectionProps) {
  const handleAcceptInvitation = async (token: string, inviteId: string) => {
    try {
      await acceptTeamInvitation(token)
      toast.success('Kabul edildi')
    } catch (error) {
      console.error('Invitation accept error:', error)
      toast.error('Kabul edilemedi')
    }
  }

  const handleDeclineInvitation = async (token: string, inviteId: string) => {
    try {
      await declineTeamInvitation(token)
      toast.success('Reddedildi')
    } catch (error) {
      console.error('Invitation decline error:', error)
      toast.error('Reddedilemedi')
    }
  }

  if (loadingTeams) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  if (teamError) {
    return <p className="text-sm text-red-600">{teamError}</p>
  }

  if (teamStats.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz takım yok.</p>
  }

  return (
    <div className="flex flex-col">
      {teamStats.map((t, index) => (
        <div
          key={t.id}
          draggable
          onDragStart={() => onDragStart('team', index)}
          onDragOver={(e) => onDragOver(e, 'team', index)}
          onDrop={() => onDrop('team', index)}
          className={dragType === 'team' && dragOverIndex === index ? 'outline outline-2 outline-primary/60 rounded-sm' : ''}
        >
          <TeamRow
            team={t}
            onOpenRename={onOpenRename}
            onDelete={onDelete}
            onAssignProject={onAssignProject}
            onAddMember={onAddMember}
            onSelect={onSelect}
          />
        </div>
      ))}
      
      {/* Pending invitations under teams */}
      {pendingInvites.length > 0 && (
        <div className="mt-3 rounded-md border p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium">Davetler ({pendingInvites.length})</div>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-medium truncate">{inv.teams?.name ?? 'Takım'}</div>
                  <div className="text-muted-foreground">{inv.email}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptInvitation(inv.token, inv.id)}
                  >
                    Kabul
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeclineInvitation(inv.token, inv.id)}
                  >
                    Reddet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTeamMembersForInvited } from "@/features/teams/api"
import { useInvitesStore } from "@/lib/store/invites"
import { Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

type PendingInvitation = ReturnType<typeof useInvitesStore.getState>['invitations'][number]

export default function PendingInvitations() {
  const { invitations, loading, fetchInvites, accept, decline } = useInvitesStore()
  const [processing, setProcessing] = useState<string | null>(null)
  const [notified, setNotified] = useState(false)
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Array<{ id: string; name: string | null; email: string | null; role: string }>>>({})

  useEffect(() => {
    fetchInvites().catch(() => {})
  }, [fetchInvites])

  useEffect(() => {
    // ekip üyelerini getir
    const grouped: Record<string, PendingInvitation[]> = {}
    for (const inv of invitations) {
      const teamId = inv.teams?.id
      if (!teamId) continue
      if (!grouped[teamId]) grouped[teamId] = []
      grouped[teamId].push(inv as PendingInvitation)
    }
    const run = async () => {
      const entries = Object.keys(grouped)
      const membersPairs = await Promise.all(entries.map(async (teamId) => {
        try {
          const members = await getTeamMembersForInvited(teamId)
          return [teamId, members.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role }))] as const
        } catch {
          return [teamId, []] as const
        }
      }))
      setMembersByTeam(Object.fromEntries(membersPairs))
      if (!notified && (invitations?.length ?? 0) > 0) {
        toast.info(`${invitations.length} bekleyen takım davetiniz var`)
        setNotified(true)
      }
    }
    run().catch(() => {})
  }, [invitations, notified])

  const handleAccept = async (token: string) => {
    try {
      setProcessing(token)
      await accept(token)
      toast.success('Takıma başarıyla katıldınız!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu'
      toast.error(message)
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (token: string) => {
    try {
      setProcessing(token)
      await decline(token)
      toast.success('Davet reddedildi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu'
      toast.error(message)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Süresi dolmuş'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} gün kaldı`
    if (hours > 0) return `${hours} saat kaldı`
    return '1 saatten az kaldı'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bekleyen Davetler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Davet yoksa bileşeni hiç gösterme
  if (invitations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bekleyen Davetler
          <Badge variant="secondary">{invitations.length}</Badge>
        </CardTitle>
        <CardDescription>
          Katılmak istediğiniz takım davetleri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{invitation.teams?.name ?? 'Takım'}</h4>
                <p className="text-sm text-muted-foreground">
                  {invitation.role === 'member' ? 'Üye' : invitation.role} olarak davet edildiniz
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Davet edildi: {formatDate(invitation.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTimeLeft(invitation.expires_at)}
                </p>
                {invitation.teams?.id && (membersByTeam[invitation.teams.id]?.length ?? 0) > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground text-xs mb-1">Takımdaki Üyeler</div>
                    <div className="flex flex-wrap gap-1">
                      {membersByTeam[invitation.teams.id]!.map(m => (
                        <span key={m.id} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">
                          {(m.name ?? m.email ?? '—')}{m.role ? ` • ${m.role}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {invitation.role}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation.token)}
                disabled={processing === invitation.token}
                className="flex-1"
              >
                {processing === invitation.token ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Kabul Et
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(invitation.token)}
                disabled={processing === invitation.token}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "../../../../lib/supabase"
import { Button } from "../../../../components/ui/button"
import { getTeamInvitations, revokeTeamInvitation, resendTeamInvitation, getTeamMembers } from "../../../../features/teams/api"
// import InvitePreview from "@/features/teams/components/InvitePreview"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useI18n } from "@/i18n/I18nProvider"
import DashboardHeader from "@/components/layout/DashboardHeader"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, FolderKanban, MailPlus } from "lucide-react"

type TeamRecord = {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
  primary_project_id?: string | null
}

type ProjectRecord = {
  id: string
  title: string
  description: string | null
  team_id: string | null
  created_at: string
}

type InvitationRecord = {
  id: string
  team_id: string
  email: string
  role: string
  token: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export default function TeamDetailPage() {
  const { t } = useI18n()
  const params = useParams() as { id?: string }
  const teamId = params?.id ?? ""

  const [team, setTeam] = useState<TeamRecord | null>(null)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [invitations, setInvitations] = useState<InvitationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const [inviteEmail, setInviteEmail] = useState("")
  // const [inviteRole, setInviteRole] = useState<'member' | 'admin'>("member")
  const [members, setMembers] = useState<Array<{ id: string; name: string | null; email: string | null; role: string; joined_at: string }>>([])
  // const [inviting, setInviting] = useState(false)
  // const [preview, setPreview] = useState<{ open: boolean; to: string; url: string } | null>(null)
  // const inviteSectionRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<string>("members")

  useEffect(() => {
    if (!teamId) return
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const supabase = getSupabase()
        const [{ data: t, error: tErr }, { data: p, error: pErr }] = await Promise.all([
          supabase.from("teams").select("*").eq("id", teamId).single(),
          supabase
            .from("projects")
            .select("id,title,description,team_id,created_at")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false }),
        ])
        if (tErr) throw tErr
        if (pErr) throw pErr
        
        // Davetleri ayrı yükle (sadece takım sahibi için)
        let teamInvitations: InvitationRecord[] = []
        if (mounted && t) {
          try {
            teamInvitations = await getTeamInvitations(teamId)
          } catch (inviteError) {
            console.warn('Davetler yüklenirken hata:', inviteError)
          }
        }
        
        if (mounted) {
          setTeam(t as TeamRecord)
          setProjects((p ?? []) as ProjectRecord[])
          setInvitations(teamInvitations)
          try { setMembers(await getTeamMembers(teamId)) } catch {}
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu")
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [teamId])

  const counts = useMemo(() => ({ members: members.length, projects: projects.length, invites: invitations.length }), [members.length, projects.length, invitations.length])

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        title={team ? team.name : t('team.detail')}
        backHref="/dashboard#teams"
        breadcrumb={[
          { label: t('dashboard.breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('team.detail') },
        ]}
        actions={team ? (
          <div className="flex items-center gap-2">
            <Link href="/dashboard#projects"><Button size="sm">Yeni proje</Button></Link>
          </div>
        ) : null}
      />

      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-64" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-6 text-sm text-red-600">{error}</CardContent></Card>
      ) : !team ? (
        <EmptyState title={t('team.notFound')} description="Takım bulunamadı veya erişim yok." />
      ) : (
        <>
          {/* Özet kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Takım Özeti</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">Ana proje: {team.primary_project_id ? 'Seçili' : 'Yok'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Üye: {counts.members}</Badge>
                <Badge className="bg-muted/50" variant="secondary">Proje: {counts.projects}</Badge>
                {counts.invites > 0 && <Badge variant="outline">Davet: {counts.invites}</Badge>}
              </div>
            </CardHeader>
          </Card>

          {/* Sekmeler */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" /> Üyeler ({counts.members})</TabsTrigger>
              <TabsTrigger value="projects"><FolderKanban className="h-4 w-4 mr-2" /> Projeler ({counts.projects})</TabsTrigger>
              <TabsTrigger value="invites"><MailPlus className="h-4 w-4 mr-2" /> Davetler ({counts.invites})</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {members.length === 0 ? (
                <EmptyState
                  title={t('team.members.empty')}
                  description="Takımda henüz üye bulunmuyor."
                />
              ) : (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Toplam üye: {counts.members}</div>
                    <Button size="sm" variant="outline" onClick={() => toast.info('Üye davet akışı daha sonra eklenecek')}>Üye ekle</Button>
                  </div>
                  {members.map((m) => {
                    const display = m.name || m.email || '—'
                    const initials = display.slice(0, 2).toUpperCase()
                    const roleLabel = m.role === 'owner' ? 'Sahip' : m.role === 'admin' ? 'Admin' : 'Üye'
                    return (
                      <Card key={m.id} className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
                            <div>
                              <div className="font-medium leading-none">{display}</div>
                              <div className="text-xs text-muted-foreground">Katıldı: {new Date(m.joined_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs " + (m.role === 'owner'
                            ? 'border-amber-500/30 text-amber-700 bg-amber-100/50'
                            : m.role === 'admin'
                              ? 'border-blue-500/30 text-blue-700 bg-blue-100/50'
                              : 'border-zinc-400/30 text-zinc-700 bg-zinc-100/50')}>{roleLabel}</span>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              {projects.length === 0 ? (
                <EmptyState
                  title={t('team.projects.empty')}
                  actionLabel={t('team.projects.createCta')}
                  onAction={() => window.location.assign('/dashboard#projects')}
                />
              ) : (
                <div className="grid gap-2">
                  {projects.map((p) => (
                    <Card key={p.id} className="transition-colors hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{p.title}</div>
                            {p.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">{p.description}</div>
                            )}
                            <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                          </div>
                          <Link href={`/dashboard/projects/${p.id}`}>
                            <Button size="sm" variant="outline">Aç</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invites" className="mt-4">
              {invitations.length === 0 ? (
                <EmptyState
                  title={t('team.invited.title')}
                  description="Aktif davet bulunmuyor."
                />
              ) : (
                <div className="grid gap-2">
                  {invitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-xs text-muted-foreground">Rol: {invitation.role === 'member' ? 'Üye' : invitation.role}</div>
                          <div className="text-xs text-muted-foreground">{t('team.invited.invitedAt')} {new Date(invitation.created_at).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {invitation.accepted_at ? (
                              <span className="text-green-600">{t('team.invited.accepted')}</span>
                            ) : new Date(invitation.expires_at) < new Date() ? (
                              <span className="text-red-600">{t('team.invited.expired')}</span>
                            ) : (
                              <span className="text-yellow-600">{t('team.invited.pending')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!invitation.accepted_at && (
                            <>
                              <Button size="sm" variant="outline" onClick={async () => {
                                try { await resendTeamInvitation(invitation.id); toast.success('Davet linki yenilendi'); } catch { toast.error('Yeniden gönderilemedi') }
                              }}>Yeniden Gönder</Button>
                              <Button size="sm" variant="ghost" onClick={async () => {
                                if (!confirm('Davet iptal edilsin mi?')) return
                                try { await revokeTeamInvitation(invitation.id); setInvitations(prev => prev.filter(i => i.id !== invitation.id)) } catch { toast.error('İşlem başarısız') }
                              }}>İptal</Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Üye davet formu kaldırıldı */}
        </>
      )}
    </div>
  )
}



"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "../../../../lib/supabase"
import { Button } from "../../../../components/ui/button"
import { getTeamInvitations, inviteToTeam, revokeTeamInvitation, resendTeamInvitation, getTeamMembers } from "../../../../features/teams/api"
import InvitePreview from "@/features/teams/components/InvitePreview"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useI18n } from "@/i18n/I18nProvider"
import DashboardHeader from "@/components/layout/DashboardHeader"
import Link from "next/link"

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
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>("member")
  const [members, setMembers] = useState<Array<{ id: string; name: string | null; email: string | null; role: string; joined_at: string }>>([])
  const [inviting, setInviting] = useState(false)
  const [preview, setPreview] = useState<{ open: boolean; to: string; url: string } | null>(null)
  const inviteSectionRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        title={team ? team.name : t('team.detail')}
        backHref="/dashboard#teams"
        breadcrumb={[
          { label: t('dashboard.breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('team.detail') },
        ]}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('team.loading')}</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !team ? (
        <p className="text-sm text-muted-foreground">{t('team.notFound')}</p>
      ) : (
        <>
          <section className="space-y-1">
            <h1 className="text-xl font-semibold">{team.name}</h1>
            <div className="text-sm text-muted-foreground">
              {t('team.mainProject.label')} {team.primary_project_id ? t('team.mainProject.selected') : t('team.mainProject.none')}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t('team.projects.title')}</h2>
            {projects.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center justify-between gap-2 border rounded-md p-3">
                <span>{t('team.projects.empty')}</span>
                <Link href="/dashboard#projects" className="text-sm">
                  <Button size="sm">{t('team.projects.createCta')}</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-2">
                {projects.map((p) => (
                  <div key={p.id} className="border rounded-md p-3">
                    <div className="font-medium">{p.title}</div>
                    {p.description && (
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Members */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Üyeler</h2>
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center justify-between gap-2 border rounded-md p-3">
                <span>{t('team.members.empty')}</span>
                <Button size="sm" variant="outline" onClick={() => inviteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  {t('team.members.inviteCta')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {members.map((m) => {
                  const roleLabel = m.role === 'owner' ? 'Sahip' : m.role === 'admin' ? 'Admin' : 'Üye'
                  return (
                    <div key={m.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name ?? m.email ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{new Date(m.joined_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{roleLabel}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {invitations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">{t('team.invited.title')}</h2>
              <div className="grid gap-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('team.invited.role')} {invitation.role === 'member' ? 'Üye' : invitation.role}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('team.invited.invitedAt')} {new Date(invitation.created_at).toLocaleString()}
                        </div>
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
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invite form */}
          <section ref={inviteSectionRef} className="space-y-3">
            <h2 className="text-base font-semibold">Üye Davet Et</h2>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1 md:col-span-3">
                <Label>E-posta</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ornek@email.com" />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label>Rol</Label>
                <Select value={inviteRole} onValueChange={(v: 'member' | 'admin') => setInviteRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Üye</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button disabled={!inviteEmail.trim() || inviting} onClick={async () => {
                  try {
                    setInviting(true)
                    const res = await inviteToTeam({ team_id: teamId, email: inviteEmail.trim(), role: inviteRole })
                    setInviteEmail("")
                    toast.success('Davet oluşturuldu')
                    setInvitations(await getTeamInvitations(teamId))
                    setPreview({ open: true, to: inviteEmail.trim(), url: res.inviteUrl })
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Davet gönderilemedi')
                  } finally {
                    setInviting(false)
                  }
                }} className="w-full md:w-auto">Gönder</Button>
              </div>
            </div>
          </section>

          {preview?.open && (
            <InvitePreview open={preview.open} onOpenChange={(v) => setPreview(prev => prev ? { ...prev, open: v } : null)} to={preview.to} teamName={team?.name} inviteUrl={preview.url} />
          )}
        </>
      )}
    </div>
  )
}



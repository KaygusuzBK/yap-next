"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { getTeamInvitations } from "@/features/teams/api"

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
  const params = useParams() as { id?: string }
  const router = useRouter()
  const teamId = params?.id ?? ""

  const [team, setTeam] = useState<TeamRecord | null>(null)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [invitations, setInvitations] = useState<InvitationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.push("/dashboard#teams")}>← Geri</Button>
        <span className="text-sm text-muted-foreground">Takım Detayı</span>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !team ? (
        <p className="text-sm text-muted-foreground">Takım bulunamadı.</p>
      ) : (
        <>
          <section className="space-y-1">
            <h1 className="text-xl font-semibold">{team.name}</h1>
            <div className="text-sm text-muted-foreground">
              Ana proje: {team.primary_project_id ? "Seçili" : "—"}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">Projeler</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu takıma ait proje yok.</p>
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

          {invitations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Davet Edilenler</h2>
              <div className="grid gap-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Rol: {invitation.role === 'member' ? 'Üye' : invitation.role}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Davet edildi: {new Date(invitation.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invitation.accepted_at ? (
                            <span className="text-green-600">Kabul edildi</span>
                          ) : new Date(invitation.expires_at) < new Date() ? (
                            <span className="text-red-600">Süresi dolmuş</span>
                          ) : (
                            <span className="text-yellow-600">Beklemede</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}



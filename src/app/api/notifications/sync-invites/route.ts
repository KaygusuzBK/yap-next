export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type TeamEmbed = { name: string } | null

type InviteRow = {
  id: string
  team_id: string
  role: string | null
  accepted_at: string | null
  expires_at: string
  teams?: TeamEmbed | TeamEmbed[] | null
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json().catch(() => ({ userId: undefined, email: undefined }))
    if (!userId || !email) {
      return NextResponse.json({ ok: false, error: 'missing_user' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const nowIso = new Date().toISOString()

    // Fetch pending invitations by email
    const { data: invites, error: invErr } = await admin
      .from('team_invitations')
      .select('id, team_id, role, accepted_at, expires_at, teams(name)')
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', nowIso)

    if (invErr) {
      return NextResponse.json({ ok: false, error: 'invite_query_failed' }, { status: 500 })
    }

    const invList: InviteRow[] = (invites ?? []) as InviteRow[]
    const rows = invList.map((inv) => {
      const t = inv.teams
      const teamName = Array.isArray(t) ? (t[0]?.name ?? null) : (t?.name ?? null)
      return {
        user_id: userId,
        type: 'team_invite',
        payload: {
          invitation_id: inv.id,
          team_id: inv.team_id,
          team_name: teamName,
          role: inv.role ?? 'member',
        },
      }
    })

    if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

    const { error: insErr } = await admin.from('notifications').insert(rows)
    if (insErr) {
      return NextResponse.json({ ok: false, error: 'notifications_insert_failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, inserted: rows.length })
  } catch {
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 500 })
  }
}

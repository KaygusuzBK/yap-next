import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Basit, kullanıcı bazlı rate limit (10 e-posta/saat)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 10
const emailRateBucket = new Map<string, { count: number; resetAt: number }>()

// POST /api/email/team-invite
// body: { to: string; teamName?: string; inviteUrl: string }
export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
    if (!accessToken) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Validate payload
    const BodySchema = z.object({
      to: z.string().email(),
      teamName: z.string().min(1).max(120).optional(),
      inviteUrl: z.string().url().refine((u) => /\/invite\//.test(u), 'inviteUrl must include /invite/<token>')
    })
    const body = BodySchema.parse(await req.json())

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
    }
    const supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })

    // Get current user
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user || null
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Rate limit per user
    const now = Date.now()
    const bucket = emailRateBucket.get(user.id) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    if (now > bucket.resetAt) {
      bucket.count = 0
      bucket.resetAt = now + RATE_LIMIT_WINDOW_MS
    }
    if (bucket.count >= RATE_LIMIT_MAX) {
      const retry = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000))
      return NextResponse.json({ error: 'rate_limited', retryAfterSeconds: retry }, { status: 429 })
    }

    // Extract invitation token from URL
    const token = (() => {
      try {
        const u = new URL(body.inviteUrl)
        const parts = u.pathname.split('/').filter(Boolean)
        const idx = parts.indexOf('invite')
        return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : ''
      } catch {
        return ''
      }
    })()
    if (!token) {
      return NextResponse.json({ error: 'invalid_invite_url' }, { status: 400 })
    }

    // Authorization via RLS: owner of team (or invited email) can read the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('id, team_id, email, expires_at')
      .eq('token', token)
      .single()
    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'forbidden_or_not_found' }, { status: 403 })
    }

    // Optionally: fetch team name server-side to avoid trusting client value
    let teamName = body.teamName
    if (!teamName) {
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', invitation.team_id)
        .single()
      teamName = team?.name || undefined
    }

    // SMTP config check
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || 'no-reply@yap.app'
    if (!host || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP config missing' }, { status: 500 })
    }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: smtpUser, pass: smtpPass } })

    const html = renderInviteEmail({ teamName, inviteUrl: body.inviteUrl })
    await transporter.sendMail({ to: body.to, from, subject: `YAP | ${teamName ?? 'Takım'} daveti`, html })

    // commit rate bucket
    bucket.count += 1
    emailRateBucket.set(user.id, bucket)

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_payload', details: e.flatten() }, { status: 400 })
    }
    console.error('invite email error', e)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
}

function renderInviteEmail({ teamName, inviteUrl }: { teamName?: string; inviteUrl: string }) {
  const safeTeam = teamName || 'Takımınız'
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px">
      <tr>
        <td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden">
            <tr>
              <td style="padding:24px 24px 0 24px">
                <h1 style="margin:0;font-size:20px;color:#111827">${safeTeam} sizi davet ediyor</h1>
                <p style="margin:8px 0 0 0;color:#6b7280;font-size:14px">Aşağıdaki butona tıklayarak daveti kabul edebilirsiniz.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px" align="center">
                <a href="${inviteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Daveti kabul et</a>
                <p style="margin-top:12px;color:#9ca3af;font-size:12px">Link çalışmazsa: <br/><a href="${inviteUrl}">${inviteUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;color:#9ca3af;font-size:12px">Bu e-postayı beklemiyorsanız yok sayabilirsiniz.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}



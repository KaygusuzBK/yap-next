import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// POST /api/email/team-invite
// body: { to: string; teamName: string; inviteUrl: string }
export async function POST(req: NextRequest) {
  try {
    const { to, teamName, inviteUrl } = await req.json()
    if (!to || !inviteUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || 'no-reply@yap.app'
    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP config missing' }, { status: 500 })
    }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })

    const html = renderInviteEmail({ teamName, inviteUrl })
    await transporter.sendMail({ to, from, subject: `YAP | ${teamName ?? 'Takım'} daveti`, html })
    return NextResponse.json({ ok: true })
  } catch (e) {
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



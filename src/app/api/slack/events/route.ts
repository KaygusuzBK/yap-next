import { NextRequest } from 'next/server'
import { verifySlackSignature } from '@/lib/slack'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function readRawBody(req: Request): Promise<string> {
  const buf = await req.arrayBuffer()
  return Buffer.from(buf).toString('utf8')
}

export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET || ''
  if (!signingSecret) return new Response('Signing secret missing', { status: 500 })
  const raw = await readRawBody(req as unknown as Request)
  const timestamp = req.headers.get('x-slack-request-timestamp')
  const signature = req.headers.get('x-slack-signature')
  if (!verifySlackSignature({ signingSecret, timestamp, signature, rawBody: raw })) {
    return new Response('Signature verification failed', { status: 401 })
  }

  const body = JSON.parse(raw)
  // URL Verification
  if (body.type === 'url_verification') {
    return Response.json({ challenge: body.challenge })
  }

  // Message events
  if (body.type === 'event_callback' && body.event?.type === 'message' && !body.event.bot_id) {
    const text: string = body.event.text || ''
    // Simple pattern: [PROJE:<id>] Başlık ...
    const match = text.match(/\[PROJE:([a-f0-9\-]{36})\]\s+(.{3,})/i)
    if (match) {
      const project_id = match[1]
      const title = match[2].trim().slice(0, 200)
      const supabase = getSupabaseAdmin()
      const automationUserId = process.env.SUPABASE_AUTOMATION_USER_ID || ''
      await supabase.from('project_tasks').insert({ project_id, title, status: 'todo', priority: 'medium', created_by: automationUserId })
    }
  }

  return Response.json({ ok: true })
}



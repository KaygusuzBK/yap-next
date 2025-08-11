import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySlackSignature } from '@/lib/slack'

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

  const text = new URLSearchParams(raw).get('text') || ''
  const responseUrl = new URLSearchParams(raw).get('response_url') || ''

  // Parse command (robust): Proje ID olarak metin içindeki ilk UUID'i bul
  // Örnek metinler:
  //  - "yeni-görev slackten proje oluşturuldu 7440dd35-... | Başlık | ..."
  //  - "7440dd35-... | Başlık | ..."
  const uuidInText = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0] || ''
  const [, titlePartRaw, ...rest] = text.split('|').map((s) => s.trim())
  const project_id = uuidInText
  const title = (titlePartRaw || '').trim()
  if (!project_id || !title) {
    return Response.json({
      response_type: 'ephemeral',
      text: 'Kullanım: /yap yeni-görev <proje-id> | <başlık> | öncelik:high | bitiş:2025-01-01\nÖrnek: /yap yeni-görev 7440dd35-66be-46b9-ae76-61679b807b3b | Prod test görevi | öncelik:high | bitiş:2025-02-01'
    })
  }
  let priority: 'low'|'medium'|'high'|'urgent' = 'medium'
  let due_date: string | null = null
  for (const part of rest) {
    const p = part.toLowerCase()
    if (p.startsWith('öncelik:') || p.startsWith('oncelik:') || p.startsWith('priority:')) {
      const val = p.split(':')[1]?.trim()
      if (val === 'low' || val === 'medium' || val === 'high' || val === 'urgent') priority = val
    } else if (p.startsWith('bitiş:') || p.startsWith('bitis:') || p.startsWith('due:')) {
      const val = p.split(':')[1]?.trim()
      if (val) due_date = val
    }
  }

  // Create task using admin client (server-side)
  const supabase = getSupabaseAdmin()
  const automationUserId = process.env.SUPABASE_AUTOMATION_USER_ID || ''
  if (!automationUserId) {
    return Response.json({ response_type: 'ephemeral', text: 'Sunucu yapılandırma eksik: SUPABASE_AUTOMATION_USER_ID tanımlı değil.' })
  }
  const { data: task, error } = await supabase
    .from('project_tasks')
    .insert({ project_id, title, priority, status: 'todo', due_date, created_by: automationUserId })
    .select('id')
    .single()
  if (error) {
    return Response.json({ response_type: 'ephemeral', text: `Görev oluşturulamadı: ${error.message}` })
  }

  // Acknowledge in Slack (in_channel)
  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response_type: 'in_channel', text: `Yeni görev oluşturuldu: ${title} (ID: ${task.id})` })
  }).catch(() => {})

  return Response.json({ response_type: 'ephemeral', text: 'Görev oluşturuluyor...' })
}



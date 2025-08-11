import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { postSlackMessage } from '@/lib/slack'
import { getSupabaseAdmin } from '@/lib/supabase'

type UpdatePayload = {
  id: string
  title?: string
  status?: string
  priority?: 'low'|'medium'|'high'|'urgent'
  url?: string
  channel?: string
}

export async function POST(req: NextRequest) {
  let body: UpdatePayload
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })
  let channel = body.channel || process.env.SLACK_DEFAULT_CHANNEL || ''
  if (!body.channel && body.id) {
    try {
      const supabase = getSupabaseAdmin()
      const { data: task } = await supabase
        .from('project_tasks')
        .select('project_id')
        .eq('id', body.id)
        .single()
      if (task?.project_id) {
        const { data: proj } = await supabase
          .from('projects')
          .select('slack_channel_id')
          .eq('id', task.project_id)
          .single()
        if (proj?.slack_channel_id) channel = proj.slack_channel_id as string
      }
    } catch {}
  }
  if (!channel) return NextResponse.json({ ok: false, error: 'missing_channel' }, { status: 500 })
  const lines: string[] = []
  lines.push(`Görev güncellendi: *${body.title || body.id}*`)
  if (body.status) lines.push(`Durum: ${body.status}`)
  if (body.priority) lines.push(`Öncelik: ${body.priority}`)
  if (body.url) lines.push(`<${body.url}|Göreve git>`)  
  const text = lines.join('\n')
  const res = await postSlackMessage(channel, text)
  if (!res.ok) {
    console.error('Slack task-updated failed:', res)
  }
  return NextResponse.json({ ok: !!res.ok, response: res })
}



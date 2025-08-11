import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { postSlackMessage } from '@/lib/slack'

type TaskPayload = {
  id: string
  title: string
  project_id?: string
  project_title?: string | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'todo' | 'in_progress' | 'review' | 'completed'
  due_date?: string | null
  url?: string
}

export async function POST(req: NextRequest) {
  let body: { task?: TaskPayload; webhookUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const task = body.task
  if (!task?.id || !task?.title) {
    return NextResponse.json({ ok: false, error: 'missing_task' }, { status: 400 })
  }

  // If a webhook URL is explicitly provided, use legacy webhook path
  const candidateUrl = body.webhookUrl || ''
  if (candidateUrl) {
    if (!candidateUrl.startsWith('https://hooks.slack.com/services/')) {
      return NextResponse.json({ ok: false, error: 'invalid_webhook' }, { status: 400 })
    }
  }

  const formatPriority = (p?: TaskPayload['priority']) => {
    switch (p) {
      case 'urgent': return 'Acil'
      case 'high': return 'Yüksek'
      case 'medium': return 'Orta'
      case 'low': return 'Düşük'
      default: return undefined
    }
  }

  const formatStatus = (s?: TaskPayload['status']) => {
    switch (s) {
      case 'todo': return 'Yapılacak'
      case 'in_progress': return 'Devam ediyor'
      case 'review': return 'İncelemede'
      case 'completed': return 'Tamamlandı'
      default: return undefined
    }
  }

  const lines: string[] = []
  const titleLine = task.project_title
    ? `Yeni görev: *${task.title}* (${task.project_title})`
    : `Yeni görev: *${task.title}*`
  lines.push(titleLine)
  const pr = formatPriority(task.priority)
  const st = formatStatus(task.status)
  if (pr) lines.push(`Öncelik: ${pr}`)
  if (st) lines.push(`Durum: ${st}`)
  if (task.due_date) lines.push(`Bitiş: ${new Date(task.due_date).toLocaleString('tr-TR')}`)
  if (task.url) lines.push(`<${task.url}|Görevi aç>`)

  const text = lines.join('\n')

  // Webhook path
  if (candidateUrl) {
    const payload = { text }
    const res = await fetch(candidateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json({ ok: false, error: 'slack_error', status: res.status, body: errText }, { status: 200 })
    }
    return NextResponse.json({ ok: true })
  }

  // Channel-based path (preferred): use project's slack_channel_id or fallback channel
  let targetChannel = process.env.SLACK_DEFAULT_CHANNEL || ''
  try {
    if (task.project_id) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: project, error: projError } = await supabaseAdmin
        .from('projects')
        .select('slack_channel_id')
        .eq('id', task.project_id)
        .single()
      if (projError) console.error('Error fetching project for Slack channel (created):', projError)
      if (project?.slack_channel_id) targetChannel = project.slack_channel_id
    }
  } catch (e) {
    console.error('Supabase admin unavailable, using default channel for task-created:', e)
  }

  if (!targetChannel) {
    return NextResponse.json({ ok: false, error: 'no_slack_channel_configured' }, { status: 400 })
  }

  const result = await postSlackMessage(targetChannel, text)
  if (!result.ok) {
    console.error('Slack task-created failed:', result)
    return NextResponse.json({ ok: false, error: 'slack_error', response: result }, { status: 200 })
  }

  return NextResponse.json({ ok: true, response: result })
}



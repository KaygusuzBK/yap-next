import { NextRequest, NextResponse } from 'next/server'

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
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, reason: 'slack_not_configured' }, { status: 200 })
  }

  let body: { task?: TaskPayload }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const task = body.task
  if (!task?.id || !task?.title) {
    return NextResponse.json({ ok: false, error: 'missing_task' }, { status: 400 })
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

  const payload = {
    text,
  }

  const res = await fetch(webhookUrl, {
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



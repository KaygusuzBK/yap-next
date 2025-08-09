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

  const lines: string[] = []
  lines.push(`Yeni görev: *${task.title}*`)
  if (task.project_title) lines.push(`Proje: ${task.project_title}`)
  if (task.priority) lines.push(`Öncelik: ${task.priority}`)
  if (task.status) lines.push(`Durum: ${task.status}`)
  if (task.due_date) lines.push(`Bitiş: ${new Date(task.due_date).toLocaleString('tr-TR')}`)
  if (task.url) lines.push(`<${task.url}|Görevi aç> )`)

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



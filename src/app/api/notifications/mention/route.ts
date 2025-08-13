export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { postSlackMessage } from '@/lib/slack'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type MentionPayload = {
  task_id: string
  comment_id: string
  comment_text: string
  mentioned_user_ids: string[]
  task_url?: string
}

export async function POST(req: NextRequest) {
  // Auth: Bearer token required
  const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!accessToken) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // Validate payload
  const Schema = z.object({
    task_id: z.string().uuid(),
    comment_id: z.string().uuid().optional(),
    comment_text: z.string().min(1).max(5000),
    mentioned_user_ids: z.array(z.string().uuid()).min(1),
    task_url: z.string().url().optional()
  })
  let body: MentionPayload
  try {
    body = Schema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: 'invalid_payload', details: e.flatten() }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })

  // Identify user
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user || null
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // Authorization: ensure user can see the task
  const { data: taskRow, error: taskErr } = await supabase
    .from('project_tasks')
    .select('id, project_id')
    .eq('id', body.task_id)
    .single()
  if (taskErr || !taskRow) return NextResponse.json({ ok: false, error: 'forbidden_or_not_found' }, { status: 403 })

  const mentions = Array.from(new Set(body.mentioned_user_ids))
  const admin = getSupabaseAdmin()

  // Fetch profiles for DM mapping (email → slack user id would be better if available)
  type Profile = { id: string; email: string | null; full_name: string | null }
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', mentions)

  // Create in-app notifications
  const notifRows = mentions.map((uid) => ({
    user_id: uid,
    type: 'mention',
    payload: {
      task_id: body.task_id,
      comment_id: body.comment_id,
      text: body.comment_text,
      url: body.task_url || null,
    },
  }))
  try {
    await admin.from('notifications').insert(notifRows)
  } catch (e) {
    // log server-side only
    console.error('notifications insert failed', e)
  }

  // Optional: Slack DM ping by default channel fallback mentioning user email
  try {
    const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || ''
    if (defaultChannel) {
      const names = (profiles as Profile[] | null | undefined || [])
        .map((p) => p.full_name || p.email || p.id)
        .join(', ')
      const text = `Yeni mention: ${names}\n> ${body.comment_text}${body.task_url ? `\n<${body.task_url}|Görevi aç>` : ''}`
      await postSlackMessage(defaultChannel, text)
    }
  } catch (e) {
    console.error('slack mention ping failed', e)
  }

  return NextResponse.json({ ok: true })
}



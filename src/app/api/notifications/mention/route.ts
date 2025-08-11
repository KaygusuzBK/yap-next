export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { postSlackMessage } from '@/lib/slack'

type MentionPayload = {
  task_id: string
  comment_id: string
  comment_text: string
  mentioned_user_ids: string[]
  task_url?: string
}

export async function POST(req: NextRequest) {
  let body: MentionPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!body.task_id || !Array.isArray(body.mentioned_user_ids) || body.mentioned_user_ids.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const mentions = Array.from(new Set(body.mentioned_user_ids))

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



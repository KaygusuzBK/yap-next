import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { readRawBody, verifyGitHubSignature } from '@/lib/github'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || ''
  if (!webhookSecret) return new Response('Webhook secret missing', { status: 500 })

  const raw = await readRawBody(req as unknown as Request)
  const sig256 = req.headers.get('x-hub-signature-256')
  if (!verifyGitHubSignature(raw, sig256, webhookSecret)) {
    return new Response('Signature verification failed', { status: 401 })
  }

  const event = req.headers.get('x-github-event') || ''
  const deliveryId = req.headers.get('x-github-delivery') || ''
  const payload = JSON.parse(raw)

  // Optional: idempotency & audit log table (to be added via SQL migration)
  try {
    const supabase = getSupabaseAdmin()
    await supabase.from('github_events_log').insert({ delivery_id: deliveryId, event, payload })
  } catch {}

  switch (event) {
    case 'issues':
      await handleIssues(payload)
      break
    case 'issue_comment':
      await handleIssueComment(payload)
      break
    case 'pull_request':
      await handlePullRequest(payload)
      break
    default:
      break
  }

  return Response.json({ ok: true })
}

async function handleIssues(payload: any) {
  const action = payload.action
  const issue = payload.issue
  const repository = payload.repository
  if (!issue || !repository) return

  // TODO: project/task eşleşmesi repo ve issue_number üzerinden gerçekleştirilecek
}

async function handleIssueComment(payload: any) {
  // TODO: yorumları task_comments'e yansıtma
}

async function handlePullRequest(payload: any) {
  // TODO: PR olaylarından görevi güncelleme/bağlama
}



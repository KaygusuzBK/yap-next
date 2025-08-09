import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

function keyFor(projectId: string) {
  return `project:${projectId}:slack_webhook`
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'missing_projectId' }, { status: 400 })
  const enc = await kv.get<string>(keyFor(projectId))
  if (!enc) return NextResponse.json({ webhookUrl: null })
  try {
    const url = decryptSecret(enc)
    return NextResponse.json({ webhookUrl: url })
  } catch {
    return NextResponse.json({ webhookUrl: null })
  }
}

export async function PUT(req: NextRequest) {
  const { projectId, webhookUrl } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'missing_projectId' }, { status: 400 })
  if (typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
    return NextResponse.json({ error: 'invalid_webhook' }, { status: 400 })
  }
  const enc = encryptSecret(webhookUrl)
  await kv.set(keyFor(projectId), enc)
  return NextResponse.json({ ok: true })
}



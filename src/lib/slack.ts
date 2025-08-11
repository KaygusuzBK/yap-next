import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifySlackSignature(opts: {
  signingSecret: string
  timestamp: string | null
  signature: string | null
  rawBody: string
}): boolean {
  const { signingSecret, timestamp, signature, rawBody } = opts
  if (!timestamp || !signature) return false
  // prevent replay (5 minutes)
  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 5) return false
  const base = `v0:${timestamp}:${rawBody}`
  const hmac = createHmac('sha256', signingSecret).update(base).digest('hex')
  const expected = `v0=${hmac}`
  try {
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function postSlackMessage(channel: string, text: string) {
  const token = process.env.SLACK_BOT_TOKEN || ''
  if (!token) return { ok: false, error: 'missing_token' }
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text }),
  })
  const json = await res.json().catch(() => ({}))
  // If bot is not in channel, try to join (public channels only) and retry once
  if (!json.ok && json.error === 'not_in_channel') {
    try {
      await fetch('https://slack.com/api/conversations.join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channel }),
      })
      const retry = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channel, text }),
      })
      const retryJson = await retry.json().catch(() => ({}))
      return retryJson
    } catch {
      // fallthrough
    }
  }
  return json
}



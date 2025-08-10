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



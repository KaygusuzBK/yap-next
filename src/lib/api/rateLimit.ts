const buckets = new Map<string, { count: number; resetAt: number }>()

export type RateLimitOptions = {
  limit: number
  windowMs: number
}

export function rateLimit(key: string, opts: RateLimitOptions) {
  const now = Date.now()
  const bucket = buckets.get(key) || { count: 0, resetAt: now + opts.windowMs }
  if (now > bucket.resetAt) {
    bucket.count = 0
    bucket.resetAt = now + opts.windowMs
  }
  if (bucket.count >= opts.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return { ok: false as const, retryAfter }
  }
  bucket.count += 1
  buckets.set(key, bucket)
  return { ok: true as const }
}



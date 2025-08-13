export function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('origin') || ''
  const allowList = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  const defaults = ['http://localhost:3000', site].filter(Boolean)
  const allowed = [...new Set([...allowList, ...defaults])]
  if (origin && allowed.some((a) => a && origin.startsWith(a))) return origin
  return allowed[0] || '*'
}

export function corsHeaders(request: Request): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(request)
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function preflight(request: Request): Response {
  return new Response(null, { headers: corsHeaders(request) })
}



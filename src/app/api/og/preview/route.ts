export const runtime = 'nodejs'

function isValidHttpUrl(value: string | null): value is string {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function extractMeta(html: string, property: string): string | undefined {
  const ogRegex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = ogRegex.exec(html)
  return m?.[1]
}

function extractNameMeta(html: string, name: string): string | undefined {
  const nameRegex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = nameRegex.exec(html)
  return m?.[1]
}

function extractTitle(html: string): string | undefined {
  const m = /<title>([^<]+)<\/title>/i.exec(html)
  return m?.[1]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!isValidHttpUrl(url)) {
    return new Response(JSON.stringify({ error: 'invalid_url' }), { status: 400 })
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url!, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return Response.json({ url, contentType })
    }
    const html = (await res.text()).slice(0, 250_000)
    const title = extractMeta(html, 'og:title') || extractTitle(html)
    const description = extractMeta(html, 'og:description') || extractNameMeta(html, 'description')
    const image = extractMeta(html, 'og:image')
    const siteName = extractMeta(html, 'og:site_name')
    return Response.json({ url, title, description, image, siteName })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 200 })
  }
}



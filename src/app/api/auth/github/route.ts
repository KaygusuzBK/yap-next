import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID
  // Prefer explicit app URL, else derive from request (protocol + host)
  const inferredOrigin = `${req.nextUrl.protocol}//${req.headers.get('host')}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || inferredOrigin

  if (!clientId || !appUrl) {
    return NextResponse.json({ error: 'GitHub OAuth env vars missing', required: ['NEXT_PUBLIC_GITHUB_CLIENT_ID or GITHUB_CLIENT_ID', 'NEXT_PUBLIC_APP_URL (optional)'] }, { status: 500 })
  }

  const redirectUri = `${appUrl}/api/auth/github/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo user:email',
    state: 'github_oauth_state'
  })

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}



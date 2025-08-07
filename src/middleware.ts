import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Protect /dashboard on server edge by checking supabase cookie
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const hasAuth = Boolean(req.cookies.get('sb-access-token') || req.cookies.get('sb:token'))
  if (isDashboard && !hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}



export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// Supabase Auth ile GitHub OAuth URL oluştur
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = getSupabase()
    
    // Supabase Auth ile GitHub OAuth URL oluştur
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/integrations?success=github_connected`,
        scopes: 'repo user:email read:user read:org issues:read issues:write pull_requests:read pull_requests:write'
      }
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      return NextResponse.json({ error: 'OAuth configuration error' }, { status: 500 })
    }

    return NextResponse.json({ authUrl: data.url })
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// Supabase Auth ile Google Calendar OAuth URL oluştur
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = getSupabase()
    
    // Supabase Auth ile Google OAuth URL oluştur
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/integrations?success=google_calendar_connected`,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
      }
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      return NextResponse.json({ error: 'OAuth configuration error' }, { status: 500 })
    }

    return NextResponse.json({ authUrl: data.url })
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

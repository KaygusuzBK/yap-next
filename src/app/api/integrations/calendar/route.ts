export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Calendar entegrasyonlarını listele
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    
    const { data: integrations, error } = await admin
      .from('user_integrations')
      .select(`
        id,
        provider,
        provider_email,
        calendar_name,
        is_active,
        sync_enabled,
        last_sync_at,
        created_at
      `)
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .or('provider.eq.outlook_calendar')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Yeni calendar entegrasyonu ekle
export async function POST(req: NextRequest) {
  try {
    const { userId, provider, accessToken, refreshToken, tokenExpiresAt, providerUserId, providerEmail, calendarId, calendarName } = await req.json()
    
    if (!userId || !provider || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    
    const { data: integration, error } = await admin
      .from('user_integrations')
      .insert({
        user_id: userId,
        provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        provider_user_id: providerUserId,
        provider_email: providerEmail,
        calendar_id: calendarId,
        calendar_name: calendarName,
        is_active: true,
        sync_enabled: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
    }

    return NextResponse.json({ integration })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

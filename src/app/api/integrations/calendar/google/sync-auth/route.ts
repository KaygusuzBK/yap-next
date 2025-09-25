export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Supabase Auth ile Google Calendar entegrasyonunu senkronize et
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    
    // Kullanıcının Google provider bilgilerini al
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Google provider bilgilerini bul
    const googleProvider = userData.user.app_metadata?.providers?.google
    if (!googleProvider) {
      console.error('Google provider not found for user:', userId)
      return NextResponse.json({ error: 'Google provider not found. Please connect Google Calendar first.' }, { status: 404 })
    }

    // Google access token'ı al
    const accessToken = googleProvider.access_token
    if (!accessToken) {
      return NextResponse.json({ error: 'Google access token not found' }, { status: 404 })
    }

    // Google Calendar API ile calendar bilgilerini al
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    let calendarsData = []
    if (calendarsResponse.ok) {
      const calendars = await calendarsResponse.json()
      calendarsData = calendars.items?.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        timeZone: calendar.timeZone,
        accessRole: calendar.accessRole,
        primary: calendar.primary,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
      })) || []
    }

    // Veritabanına kaydet
    const { error: dbError } = await admin
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider: 'google_calendar',
        access_token: accessToken,
        provider_user_id: googleProvider.provider_user_id,
        provider_email: googleProvider.email,
        provider_username: googleProvider.user_name,
        provider_name: googleProvider.full_name,
        provider_avatar_url: googleProvider.avatar_url,
        provider_data: {
          calendars: calendarsData,
          total_calendars: calendarsData.length,
          primary_calendar: calendarsData.find((c: any) => c.primary)?.summary || 'Primary Calendar',
        },
        is_active: true,
        sync_enabled: true
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar integration synced successfully',
      calendars: calendarsData.length
    })

  } catch (error) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


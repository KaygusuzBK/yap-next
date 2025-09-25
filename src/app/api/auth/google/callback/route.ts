import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`)
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )

    // Authorization code'u access token'a çevir
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Kullanıcı bilgilerini al
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userData } = await oauth2.userinfo.get()

    // Supabase'de kullanıcıyı güncelle
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Google Calendar entegrasyonu bilgilerini kaydet
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          provider: 'google_calendar',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          provider_user_id: userData.id,
          provider_username: userData.email,
          provider_data: {
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
          },
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Google Calendar integration save error:', error)
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?google_connected=true`)

  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`)
  }
}



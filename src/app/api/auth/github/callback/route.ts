import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || state !== 'github_oauth_state') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`)
  }

  try {
    // GitHub'dan access token al
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'GitHub token exchange failed')
    }

    // GitHub kullanıcı bilgilerini al
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const userData = await userResponse.json()

    // Supabase'de kullanıcıyı güncelle
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // GitHub entegrasyonu bilgilerini kaydet
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          provider: 'github',
          access_token: tokenData.access_token,
          provider_user_id: userData.id.toString(),
          provider_username: userData.login,
          provider_data: {
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('GitHub integration save error:', error)
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_connected=true`)

  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`)
  }
}



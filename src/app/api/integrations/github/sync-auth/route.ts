export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Supabase Auth ile GitHub entegrasyonunu senkronize et
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    
    // Kullanıcının GitHub provider bilgilerini al
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // GitHub provider bilgilerini bul
    const githubProvider = userData.user.app_metadata?.providers?.github
    if (!githubProvider) {
      console.error('GitHub provider not found for user:', userId)
      return NextResponse.json({ error: 'GitHub provider not found. Please connect GitHub first.' }, { status: 404 })
    }

    // GitHub access token'ı al
    const accessToken = githubProvider.access_token
    if (!accessToken) {
      return NextResponse.json({ error: 'GitHub access token not found' }, { status: 404 })
    }

    // GitHub API ile repository bilgilerini al
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${githubProvider.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    let reposData = []
    if (reposResponse.ok) {
      const repos = await reposResponse.json()
      reposData = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
      }))
    }

    // Veritabanına kaydet
    const { error: dbError } = await admin
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider: 'github',
        access_token: githubProvider.access_token,
        provider_user_id: githubProvider.provider_user_id,
        provider_email: githubProvider.email,
        provider_username: githubProvider.user_name,
        provider_name: githubProvider.full_name,
        provider_avatar_url: githubProvider.avatar_url,
        provider_data: {
          repos: reposData,
          total_repos: reposData.length,
          public_repos: reposData.filter((r: any) => !r.private).length,
          private_repos: reposData.filter((r: any) => r.private).length,
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
      message: 'GitHub integration synced successfully',
      repos: reposData.length
    })

  } catch (error) {
    console.error('GitHub sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

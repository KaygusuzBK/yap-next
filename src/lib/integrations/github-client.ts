import { getSupabase } from '@/lib/supabase'

export async function getGitHubOAuthURL(userId: string): Promise<string> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/integrations?success=github_connected`,
      scopes: 'repo user:email read:user read:org issues:read issues:write pull_requests:read pull_requests:write'
    }
  })

  if (error) {
    throw new Error(`GitHub OAuth error: ${error.message}`)
  }

  return data.url
}

export async function getGoogleCalendarOAuthURL(userId: string): Promise<string> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/integrations?success=google_calendar_connected`,
      scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
    }
  })

  if (error) {
    throw new Error(`Google OAuth error: ${error.message}`)
  }

  return data.url
}


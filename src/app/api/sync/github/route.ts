import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { GitHubSyncService } from '@/lib/services/sync/github-sync'

export async function POST(request: NextRequest) {
  try {
    const { projectId, action } = await request.json()

    if (!projectId || !action) {
      return NextResponse.json(
        { error: 'projectId and action are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const syncService = new GitHubSyncService()

    let result
    switch (action) {
      case 'sync_issues_to_tasks':
        result = await syncService.syncIssuesToTasks(user.id, projectId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('GitHub sync error:', error)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


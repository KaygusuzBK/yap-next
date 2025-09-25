import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { GoogleCalendarSyncService } from '@/lib/services/sync/google-calendar-sync'

export async function POST(request: NextRequest) {
  try {
    const { projectId, action } = await request.json()

    const supabase = getSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const syncService = new GoogleCalendarSyncService()

    let result
    switch (action) {
      case 'sync_tasks_to_calendar':
        result = await syncService.syncTasksToCalendar(user.id, projectId)
        break
      case 'sync_events_to_tasks':
        result = await syncService.syncCalendarEventsToTasks(user.id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


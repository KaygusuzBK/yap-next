import { getSupabase } from '@/lib/supabase'
import { GoogleCalendarService, GoogleCalendarEvent } from '@/lib/integrations/google-calendar'

export interface SyncResult {
  success: boolean
  message: string
  syncedCount: number
  errors: string[]
}

export class GoogleCalendarSyncService {
  private supabase = getSupabase()

  async syncTasksToCalendar(userId: string, projectId?: string): Promise<SyncResult> {
    try {
      // Kullanıcının Google Calendar entegrasyonunu al
      const { data: integration, error: integrationError } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google_calendar')
        .single()

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'Google Calendar entegrasyonu bulunamadı',
          syncedCount: 0,
          errors: ['Google Calendar integration not found']
        }
      }

      const calendarService = new GoogleCalendarService(integration.access_token)

      // Görevleri al
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .eq('user_id', userId)
        .not('due_date', 'is', null)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: tasks, error: tasksError } = await query

      if (tasksError || !tasks) {
        return {
          success: false,
          message: 'Görevler alınamadı',
          syncedCount: 0,
          errors: ['Failed to fetch tasks']
        }
      }

      let syncedCount = 0
      const errors: string[] = []

      for (const task of tasks) {
        try {
          // Mevcut calendar event'ini kontrol et
          const { data: existingEvent } = await this.supabase
            .from('tasks')
            .select('external_data')
            .eq('id', task.id)
            .single()

          const externalData = existingEvent?.external_data as any
          const calendarEventId = externalData?.google_calendar?.id

          const eventData = {
            summary: task.title,
            description: `${task.description || ''}\n\nProje: ${task.projects.name}\nGörev ID: ${task.id}`,
            start: {
              dateTime: new Date(task.due_date).toISOString(),
              timeZone: 'Europe/Istanbul'
            },
            end: {
              dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString(), // 1 saat sonra
              timeZone: 'Europe/Istanbul'
            },
            location: task.projects.name
          }

          if (calendarEventId) {
            // Mevcut event'i güncelle
            await calendarService.updateEvent('primary', calendarEventId, eventData)
          } else {
            // Yeni event oluştur
            const event = await calendarService.createEvent('primary', eventData)
            
            // Görevi calendar event ile ilişkilendir
            await this.supabase
              .from('tasks')
              .update({
                external_data: {
                  ...externalData,
                  google_calendar: {
                    id: event.id,
                    htmlLink: event.htmlLink,
                    last_synced: new Date().toISOString()
                  }
                }
              })
              .eq('id', task.id)
          }

          syncedCount++
        } catch (error) {
          errors.push(`Calendar sync hatası: ${task.title} - ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        message: `${syncedCount} görev Google Calendar ile senkronize edildi`,
        syncedCount,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: 'Google Calendar sync hatası',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async syncCalendarEventsToTasks(userId: string): Promise<SyncResult> {
    try {
      // Kullanıcının Google Calendar entegrasyonunu al
      const { data: integration, error: integrationError } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google_calendar')
        .single()

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'Google Calendar entegrasyonu bulunamadı',
          syncedCount: 0,
          errors: ['Google Calendar integration not found']
        }
      }

      const calendarService = new GoogleCalendarService(integration.access_token)
      
      // Bugünden itibaren 30 günlük etkinlikleri al
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const events = await calendarService.getEvents('primary', timeMin, timeMax)

      let syncedCount = 0
      const errors: string[] = []

      for (const event of events) {
        try {
          // Etkinlik zaten görev olarak var mı kontrol et
          const { data: existingTask } = await this.supabase
            .from('tasks')
            .select('id')
            .eq('external_id', event.id)
            .eq('external_type', 'google_calendar_event')
            .single()

          if (existingTask) {
            // Mevcut görevi güncelle
            await this.supabase
              .from('tasks')
              .update({
                title: event.summary,
                description: event.description || '',
                due_date: event.start.dateTime || event.start.date,
                updated_at: new Date().toISOString(),
                external_data: {
                  google_calendar_event: event,
                  last_synced: new Date().toISOString()
                }
              })
              .eq('id', existingTask.id)
          } else {
            // Kullanıcının varsayılan projesini al
            const { data: defaultProject } = await this.supabase
              .from('projects')
              .select('id')
              .eq('user_id', userId)
              .eq('is_primary', true)
              .single()

            if (!defaultProject) {
              errors.push(`Varsayılan proje bulunamadı: ${event.summary}`)
              continue
            }

            // Yeni görev oluştur
            const { error: taskError } = await this.supabase
              .from('tasks')
              .insert({
                project_id: defaultProject.id,
                user_id: userId,
                title: event.summary,
                description: event.description || '',
                status: 'pending',
                priority: 'medium',
                due_date: event.start.dateTime || event.start.date,
                external_id: event.id,
                external_type: 'google_calendar_event',
                external_url: event.htmlLink,
                external_data: {
                  google_calendar_event: event,
                  last_synced: new Date().toISOString()
                },
                created_at: event.created,
                updated_at: event.updated
              })

            if (taskError) {
              errors.push(`Görev oluşturulamadı: ${event.summary} - ${taskError.message}`)
              continue
            }
          }

          syncedCount++
        } catch (error) {
          errors.push(`Event sync hatası: ${event.summary} - ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        message: `${syncedCount} Google Calendar etkinliği görev olarak senkronize edildi`,
        syncedCount,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: 'Google Calendar sync hatası',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async createTaskFromCalendarEvent(userId: string, event: GoogleCalendarEvent, projectId: string): Promise<SyncResult> {
    try {
      const { error: taskError } = await this.supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          user_id: userId,
          title: event.summary,
          description: event.description || '',
          status: 'pending',
          priority: 'medium',
          due_date: event.start.dateTime || event.start.date,
          external_id: event.id,
          external_type: 'google_calendar_event',
          external_url: event.htmlLink,
          external_data: {
            google_calendar_event: event,
            last_synced: new Date().toISOString()
          },
          created_at: event.created,
          updated_at: event.updated
        })

      if (taskError) {
        return {
          success: false,
          message: 'Görev oluşturulamadı',
          syncedCount: 0,
          errors: [taskError.message]
        }
      }

      return {
        success: true,
        message: 'Google Calendar etkinliği görev olarak oluşturuldu',
        syncedCount: 1,
        errors: []
      }

    } catch (error) {
      return {
        success: false,
        message: 'Görev oluşturma hatası',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

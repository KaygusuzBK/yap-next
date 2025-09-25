import { google } from 'googleapis'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  htmlLink: string
  created: string
  updated: string
}

export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  timeZone: string
  accessRole: string
  primary?: boolean
}

export class GoogleCalendarService {
  private auth: any
  private calendar: any

  constructor(accessToken: string) {
    this.auth = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )
    
    this.auth.setCredentials({
      access_token: accessToken,
    })
    
    this.calendar = google.calendar({ version: 'v3', auth: this.auth })
  }

  async getCalendars(): Promise<GoogleCalendar[]> {
    const { data } = await this.calendar.calendarList.list()
    return data.items || []
  }

  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    const { data } = await this.calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    })
    return data.items || []
  }

  async createEvent(calendarId: string = 'primary', event: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone?: string }
    end: { dateTime: string; timeZone?: string }
    location?: string
    attendees?: Array<{ email: string }>
  }): Promise<GoogleCalendarEvent> {
    const { data } = await this.calendar.events.insert({
      calendarId,
      resource: event,
    })
    return data as GoogleCalendarEvent
  }

  async updateEvent(calendarId: string, eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    const { data } = await this.calendar.events.update({
      calendarId,
      eventId,
      resource: event,
    })
    return data as GoogleCalendarEvent
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    })
  }

  async getUpcomingEvents(calendarId: string = 'primary', maxResults: number = 10): Promise<GoogleCalendarEvent[]> {
    const { data } = await this.calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })
    return data.items || []
  }
}

// Google OAuth URL oluşturma
export function getGoogleOAuthURL(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  
  if (!clientId) {
    throw new Error('Google Client ID not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}


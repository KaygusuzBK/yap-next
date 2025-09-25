'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar, Github, Settings, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

interface Integration {
  id: string
  provider: 'google_calendar' | 'outlook_calendar' | 'github'
  provider_email?: string
  provider_username?: string
  provider_name?: string
  calendar_name?: string
  is_active: boolean
  sync_enabled: boolean
  last_sync_at: string | null
  created_at: string
  provider_data?: any
}

export default function IntegrationsPage() {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [githubIntegrations, setGithubIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  
  // Basit çeviri fonksiyonu
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'integrations.title': 'Entegrasyonlar',
      'integrations.subtitle': 'Takvim ve diğer servislerle bağlantılarınızı yönetin',
      'integrations.calendar.title': 'Takvim Entegrasyonları',
      'integrations.calendar.google.title': 'Google Calendar',
      'integrations.calendar.google.description': 'Google Calendar\'ınızı YAP ile senkronize edin',
      'integrations.calendar.google.connect': 'Google Calendar Bağla',
      'integrations.calendar.outlook.title': 'Outlook Calendar',
      'integrations.calendar.outlook.description': 'Microsoft Outlook Calendar\'ınızı YAP ile senkronize edin',
      'integrations.calendar.outlook.comingSoon': 'Yakında Gelecek',
      'integrations.github.title': 'GitHub Entegrasyonu',
      'integrations.github.description': 'GitHub repository\'lerinizi ve issue\'larınızı YAP ile senkronize edin',
      'integrations.github.comingSoon': 'Yakında Gelecek',
      'integrations.status.active': 'Aktif',
      'integrations.status.inactive': 'Pasif',
      'integrations.status.syncEnabled': 'Senkronizasyon',
      'integrations.status.lastSync': 'Son senkronizasyon',
      'integrations.actions.confirmDisconnect': 'Bu entegrasyonu kaldırmak istediğinizden emin misiniz?',
      'integrations.messages.loadError': 'Entegrasyonlar yüklenemedi',
      'integrations.messages.connectionError': 'Bağlantı hatası',
      'integrations.messages.syncEnabled': 'Senkronizasyon etkinleştirildi',
      'integrations.messages.syncDisabled': 'Senkronizasyon devre dışı bırakıldı',
      'integrations.messages.syncCompleted': 'Senkronizasyon tamamlandı',
      'integrations.messages.syncFailed': 'Senkronizasyon başarısız',
      'integrations.messages.integrationRemoved': 'Entegrasyon kaldırıldı'
    }
    return translations[key] || key
  }

  const fetchIntegrations = useCallback(async () => {
    try {
      // Calendar integrations
      const calendarResponse = await fetch(`/api/integrations/calendar?userId=${user?.id}`)
      const calendarData = await calendarResponse.json()
      
      if (calendarResponse.ok) {
        setIntegrations(calendarData.integrations || [])
      }

      // GitHub integrations
      const githubResponse = await fetch(`/api/integrations/github?userId=${user?.id}`)
      const githubData = await githubResponse.json()
      
      if (githubResponse.ok) {
        setGithubIntegrations(githubData.integrations || [])
      }

      if (!calendarResponse.ok && !githubResponse.ok) {
        toast.error(t('integrations.messages.loadError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchIntegrations()
    }
  }, [user, fetchIntegrations])

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/integrations/calendar/google/oauth?userId=${user?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        window.location.href = data.authUrl
      } else {
        toast.error(t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const connectGitHub = async () => {
    try {
      const response = await fetch(`/api/integrations/github/oauth?userId=${user?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        window.location.href = data.authUrl
      } else {
        toast.error(t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const syncGitHubAuth = async () => {
    try {
      const response = await fetch(`/api/integrations/github/sync-auth?userId=${user?.id}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`GitHub entegrasyonu senkronize edildi! ${data.repos} repository bulundu.`)
        fetchIntegrations() // Listeyi yenile
      } else {
        toast.error(data.error || t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const syncGoogleCalendarAuth = async () => {
    try {
      const response = await fetch(`/api/integrations/calendar/google/sync-auth?userId=${user?.id}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Google Calendar entegrasyonu senkronize edildi! ${data.calendars} takvim bulundu.`)
        fetchIntegrations() // Listeyi yenile
      } else {
        toast.error(data.error || t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const toggleSync = async (integrationId: string, enabled: boolean) => {
    try {
      // Bu endpoint'i daha sonra oluşturacağız
      const response = await fetch(`/api/integrations/calendar/${integrationId}/sync`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_enabled: enabled })
      })

      if (response.ok) {
        setIntegrations(prev => 
          prev.map(integration => 
            integration.id === integrationId 
              ? { ...integration, sync_enabled: enabled }
              : integration
          )
        )
        toast.success(enabled ? t('integrations.messages.syncEnabled') : t('integrations.messages.syncDisabled'))
      } else {
        toast.error(t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const syncNow = async (integrationId: string, provider: string) => {
    setSyncing(integrationId)
    try {
      let response
      if (provider === 'github') {
        response = await fetch(`/api/integrations/github/sync?integrationId=${integrationId}`, {
          method: 'POST'
        })
      } else {
        // Calendar sync - bu endpoint'i daha sonra oluşturacağız
        response = await fetch(`/api/integrations/calendar/${integrationId}/sync-now`, {
          method: 'POST'
        })
      }

      if (response.ok) {
        const data = await response.json()
        if (provider === 'github' && data.syncedIssues && data.syncedPRs) {
          toast.success(`${data.syncedIssues} issue ve ${data.syncedPRs} PR senkronize edildi`)
        } else {
          toast.success(t('integrations.messages.syncCompleted'))
        }
        fetchIntegrations() // Listeyi yenile
      } else {
        toast.error(t('integrations.messages.syncFailed'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    } finally {
      setSyncing(null)
    }
  }

  const disconnectIntegration = async (integrationId: string) => {
    if (!confirm(t('integrations.actions.confirmDisconnect'))) {
      return
    }

    try {
      // Bu endpoint'i daha sonra oluşturacağız
      const response = await fetch(`/api/integrations/calendar/${integrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIntegrations(prev => prev.filter(integration => integration.id !== integrationId))
        toast.success(t('integrations.messages.integrationRemoved'))
      } else {
        toast.error(t('integrations.messages.connectionError'))
      }
    } catch (error) {
      toast.error(t('integrations.messages.connectionError'))
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_calendar':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'outlook_calendar':
        return <Calendar className="h-5 w-5 text-orange-500" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google_calendar':
        return 'Google Calendar'
      case 'outlook_calendar':
        return 'Outlook Calendar'
      default:
        return provider
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('integrations.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('integrations.subtitle')}
          </p>
        </div>
      </div>

      {/* Calendar Integrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('integrations.calendar.title')}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                {t('integrations.calendar.google.title')}
              </CardTitle>
              <CardDescription>
                {t('integrations.calendar.google.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrations.some(i => i.provider === 'google_calendar') ? (
                <div className="space-y-3">
                  {integrations
                    .filter(i => i.provider === 'google_calendar')
                    .map(integration => (
                      <div key={integration.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{integration.calendar_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {integration.provider_email}
                            </p>
                          </div>
                          <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                            {integration.is_active ? t('integrations.status.active') : t('integrations.status.inactive')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.sync_enabled}
                              onCheckedChange={(enabled) => toggleSync(integration.id, enabled)}
                            />
                            <span className="text-sm">{t('integrations.status.syncEnabled')}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncNow(integration.id, 'calendar')}
                              disabled={syncing === integration.id}
                            >
                              {syncing === integration.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => disconnectIntegration(integration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {integration.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            {t('integrations.status.lastSync')}: {new Date(integration.last_sync_at).toLocaleString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button onClick={connectGoogleCalendar} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('integrations.calendar.google.connect')}
                  </Button>
                  <Button 
                    onClick={syncGoogleCalendarAuth} 
                    variant="outline" 
                    className="w-full"
                    disabled={!user}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Google Calendar&apos;ı Senkronize Et
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outlook Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                {t('integrations.calendar.outlook.title')}
              </CardTitle>
              <CardDescription>
                {t('integrations.calendar.outlook.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('integrations.calendar.outlook.comingSoon')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GitHub Integration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Github className="h-5 w-5" />
          {t('integrations.github.title')}
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub
            </CardTitle>
            <CardDescription>
              {t('integrations.github.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {githubIntegrations.length > 0 ? (
              <div className="space-y-3">
                {githubIntegrations.map(integration => (
                  <div key={integration.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{integration.provider_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{integration.provider_username}
                        </p>
                        {integration.provider_data?.total_repos && (
                          <p className="text-xs text-muted-foreground">
                            {integration.provider_data.total_repos} repository
                          </p>
                        )}
                      </div>
                      <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                        {integration.is_active ? t('integrations.status.active') : t('integrations.status.inactive')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.sync_enabled}
                          onCheckedChange={(enabled) => toggleSync(integration.id, enabled)}
                        />
                        <span className="text-sm">{t('integrations.status.syncEnabled')}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncNow(integration.id, 'github')}
                          disabled={syncing === integration.id}
                        >
                          {syncing === integration.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {integration.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.status.lastSync')}: {new Date(integration.last_sync_at).toLocaleString('tr-TR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Button onClick={connectGitHub} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub Bağla
                </Button>
                <Button 
                  onClick={syncGitHubAuth} 
                  variant="outline" 
                  className="w-full"
                  disabled={!user}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  GitHub&apos;ı Senkronize Et
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
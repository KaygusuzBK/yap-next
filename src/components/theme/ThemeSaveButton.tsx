"use client"

import * as React from 'react'
import { saveUserTheme, getUserTheme, type UserTheme } from '@/lib/services/preferences/userTheme'
import { Button } from '@/components/ui/button'

export default function ThemeSaveButton() {
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [hasChanges, setHasChanges] = React.useState(false)
  const [light, setLight] = React.useState<UserTheme['light']>({})
  const [dark, setDark] = React.useState<UserTheme['dark']>({})
  const [transitionEnabled, setTransitionEnabled] = React.useState(true)
  const [transitionDuration, setTransitionDuration] = React.useState(200)
  const [transitionEasing, setTransitionEasing] = React.useState('ease-in-out')
  const [selectedFont] = React.useState('Inter')

  React.useEffect(() => {
    ;(async () => {
      const t = await getUserTheme().catch(() => null)
      setLight(t?.light || {})
      setDark(t?.dark || {})
      if (t?.transition) {
        setTransitionEnabled(Boolean(t.transition.enabled))
        setTransitionDuration(typeof t.transition.durationMs === 'number' ? t.transition.durationMs : 200)
        setTransitionEasing(t.transition.easing || 'ease-in-out')
      }
    })()
  }, [])

  // Live preview: apply current mode palette to CSS vars
  React.useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const pal = isDark ? dark : light
    if (pal?.background) root.style.setProperty('--background', pal.background)
    if (pal?.foreground) root.style.setProperty('--foreground', pal.foreground)
    if (pal?.primary) root.style.setProperty('--primary', pal.primary)
    if (pal?.primaryForeground) root.style.setProperty('--primary-foreground', pal.primaryForeground)
    if (pal?.accent) root.style.setProperty('--accent', pal.accent)
    if (pal?.accentForeground) root.style.setProperty('--accent-foreground', pal.accentForeground)
    if (pal?.ring) root.style.setProperty('--ring', pal.ring)
    // sidebar scoped tokens for instant preview
    if (pal?.sidebar) root.style.setProperty('--sidebar', pal.sidebar)
    if (pal?.sidebarForeground) root.style.setProperty('--sidebar-foreground', pal.sidebarForeground)
    if (pal?.sidebarPrimary) root.style.setProperty('--sidebar-primary', pal.sidebarPrimary)
    if (pal?.sidebarPrimaryForeground) root.style.setProperty('--sidebar-primary-foreground', pal.sidebarPrimaryForeground)
    if (pal?.sidebarAccent) root.style.setProperty('--sidebar-accent', pal.sidebarAccent)
    if (pal?.sidebarAccentForeground) root.style.setProperty('--sidebar-accent-foreground', pal.sidebarAccentForeground)
    if (pal?.sidebarBorder) root.style.setProperty('--sidebar-border', pal.sidebarBorder)
    if (pal?.sidebarRing) root.style.setProperty('--sidebar-ring', pal.sidebarRing)
  }, [light, dark])

  // Font değişikliklerini uygula
  React.useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--font-sans', `"${selectedFont}", "Helvetica Neue", Helvetica, Arial, sans-serif`)
    document.body.style.fontFamily = `"${selectedFont}", "Helvetica Neue", Helvetica, Arial, sans-serif`
  }, [selectedFont])

  // Global tema değişikliklerini dinle
  React.useEffect(() => {
    // CSS değişikliklerini dinle
    const observer = new MutationObserver(() => {
      setHasChanges(true)
      setMessage(null)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    return () => observer.disconnect()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveUserTheme({ light, dark, transition: { enabled: transitionEnabled, durationMs: transitionDuration, easing: transitionEasing } })
      setMessage('Tema güncellendi!')
      setHasChanges(false)
    } catch {
      setMessage('Tema güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={onSave} 
        disabled={saving || !hasChanges}
        variant={hasChanges ? "default" : "outline"}
        size="sm"
      >
        {saving ? 'Güncelleniyor...' : hasChanges ? 'Güncelle' : 'Güncellendi'}
      </Button>
      {message && (
        <span className={`text-sm ${message.includes('güncellendi') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </span>
      )}
    </div>
  )
}

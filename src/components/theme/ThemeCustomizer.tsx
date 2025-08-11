"use client"

import * as React from 'react'
import { saveUserTheme, getUserTheme, type UserTheme } from '@/lib/services/preferences/userTheme'
import { Button } from '@/components/ui/button'

function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const id = React.useId()
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-40 text-muted-foreground">{label}</span>
      <input id={id} type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer" />
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB"
        className="h-8 flex-1 rounded border px-2 text-xs" />
    </label>
  )
}

export default function ThemeCustomizer() {
  const [initial, setInitial] = React.useState<UserTheme | null>(null)
  const [light, setLight] = React.useState<UserTheme['light']>({})
  const [dark, setDark] = React.useState<UserTheme['dark']>({})
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      const t = await getUserTheme().catch(() => null)
      setInitial(t)
      setLight(t?.light || {})
      setDark(t?.dark || {})
    })()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveUserTheme({ light, dark })
      setMessage('Kaydedildi')
    } catch (e) {
      setMessage('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded border p-3">
          <div className="text-sm font-medium">Açık Tema</div>
          <ColorInput label="Primary" value={light?.primary} onChange={(v) => setLight((p) => ({ ...p, primary: v }))} />
          <ColorInput label="Primary Text" value={light?.primaryForeground} onChange={(v) => setLight((p) => ({ ...p, primaryForeground: v }))} />
          <ColorInput label="Accent" value={light?.accent} onChange={(v) => setLight((p) => ({ ...p, accent: v }))} />
          <ColorInput label="Accent Text" value={light?.accentForeground} onChange={(v) => setLight((p) => ({ ...p, accentForeground: v }))} />
          <ColorInput label="Ring" value={light?.ring} onChange={(v) => setLight((p) => ({ ...p, ring: v }))} />
        </div>
        <div className="space-y-3 rounded border p-3">
          <div className="text-sm font-medium">Koyu Tema</div>
          <ColorInput label="Primary" value={dark?.primary} onChange={(v) => setDark((p) => ({ ...p, primary: v }))} />
          <ColorInput label="Primary Text" value={dark?.primaryForeground} onChange={(v) => setDark((p) => ({ ...p, primaryForeground: v }))} />
          <ColorInput label="Accent" value={dark?.accent} onChange={(v) => setDark((p) => ({ ...p, accent: v }))} />
          <ColorInput label="Accent Text" value={dark?.accentForeground} onChange={(v) => setDark((p) => ({ ...p, accentForeground: v }))} />
          <ColorInput label="Ring" value={dark?.ring} onChange={(v) => setDark((p) => ({ ...p, ring: v }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
      {initial && (
        <div className="text-xs text-muted-foreground">Mevcut kayıtlı tema yüklendi.</div>
      )}
    </div>
  )
}



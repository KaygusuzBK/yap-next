"use client"

import * as React from 'react'
import { saveUserTheme, getUserTheme, type UserTheme } from '@/lib/services/preferences/userTheme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Folder, User } from 'lucide-react'

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
  const [transitionEnabled, setTransitionEnabled] = React.useState(true)
  const [transitionDuration, setTransitionDuration] = React.useState(200)
  const [transitionEasing, setTransitionEasing] = React.useState('ease-in-out')
  const [demoOn, setDemoOn] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const t = await getUserTheme().catch(() => null)
      setInitial(t)
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
  }, [light, dark])

  const suggestions: Array<{ name: string; light: NonNullable<UserTheme['light']>; dark: NonNullable<UserTheme['dark']> }> = [
    {
      name: 'Deniz',
      light: { primary: '#0ea5e9', primaryForeground: '#ffffff', accent: '#a5f3fc', accentForeground: '#0f172a', ring: '#38bdf8' },
      dark: { primary: '#38bdf8', primaryForeground: '#0b1220', accent: '#0ea5e9', accentForeground: '#0b1220', ring: '#7dd3fc' },
    },
    {
      name: 'Orman',
      light: { primary: '#16a34a', primaryForeground: '#ffffff', accent: '#bbf7d0', accentForeground: '#052e16', ring: '#22c55e' },
      dark: { primary: '#22c55e', primaryForeground: '#08180f', accent: '#16a34a', accentForeground: '#08180f', ring: '#86efac' },
    },
    {
      name: 'Günbatımı',
      light: { primary: '#f97316', primaryForeground: '#1a130b', accent: '#fed7aa', accentForeground: '#1a130b', ring: '#fb923c' },
      dark: { primary: '#fb923c', primaryForeground: '#140f0a', accent: '#f97316', accentForeground: '#140f0a', ring: '#fdba74' },
    },
    {
      name: 'Erguvan',
      light: { primary: '#8b5cf6', primaryForeground: '#0b0620', accent: '#ddd6fe', accentForeground: '#0b0620', ring: '#a78bfa' },
      dark: { primary: '#a78bfa', primaryForeground: '#0b0620', accent: '#8b5cf6', accentForeground: '#0b0620', ring: '#c4b5fd' },
    },
  ]

  const randomHex = () => `#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}`
  const generateRandom = () => {
    const lp = { primary: randomHex(), accent: randomHex(), ring: randomHex() }
    const dp = { primary: randomHex(), accent: randomHex(), ring: randomHex() }
    setLight((p) => ({ ...p, ...lp }))
    setDark((p) => ({ ...p, ...dp }))
    setMessage(null)
  }

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveUserTheme({ light, dark, transition: { enabled: transitionEnabled, durationMs: transitionDuration, easing: transitionEasing } })
      setMessage('Kaydedildi')
    } catch (e) {
      setMessage('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded border p-3">
        <div className="text-sm font-medium">Önerilen temalar</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-accent"
              onClick={() => { setLight(s.light); setDark(s.dark); setMessage(`Öneri uygulandı: ${s.name}`) }}
            >
              {s.name}
            </button>
          ))}
          <Button variant="outline" className="h-7 text-xs" onClick={generateRandom}>Rastgele üret</Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded border p-3">
          <div className="text-sm font-medium">Açık Tema</div>
          <ColorInput label="Background" value={light?.background} onChange={(v) => setLight((p) => ({ ...p, background: v }))} />
          <ColorInput label="Foreground" value={light?.foreground} onChange={(v) => setLight((p) => ({ ...p, foreground: v }))} />
          <ColorInput label="Secondary" value={light?.secondary} onChange={(v) => setLight((p) => ({ ...p, secondary: v }))} />
          <ColorInput label="Secondary Text" value={light?.secondaryForeground} onChange={(v) => setLight((p) => ({ ...p, secondaryForeground: v }))} />
          <ColorInput label="Muted" value={light?.muted} onChange={(v) => setLight((p) => ({ ...p, muted: v }))} />
          <ColorInput label="Muted Text" value={light?.mutedForeground} onChange={(v) => setLight((p) => ({ ...p, mutedForeground: v }))} />
          <ColorInput label="Primary" value={light?.primary} onChange={(v) => setLight((p) => ({ ...p, primary: v }))} />
          <ColorInput label="Primary Text" value={light?.primaryForeground} onChange={(v) => setLight((p) => ({ ...p, primaryForeground: v }))} />
          <ColorInput label="Accent" value={light?.accent} onChange={(v) => setLight((p) => ({ ...p, accent: v }))} />
          <ColorInput label="Accent Text" value={light?.accentForeground} onChange={(v) => setLight((p) => ({ ...p, accentForeground: v }))} />
          <ColorInput label="Destructive" value={light?.destructive} onChange={(v) => setLight((p) => ({ ...p, destructive: v }))} />
          <ColorInput label="Border" value={light?.border} onChange={(v) => setLight((p) => ({ ...p, border: v }))} />
          <ColorInput label="Input" value={light?.input} onChange={(v) => setLight((p) => ({ ...p, input: v }))} />
          <ColorInput label="Ring" value={light?.ring} onChange={(v) => setLight((p) => ({ ...p, ring: v }))} />
          <div className="text-sm font-medium mt-2">Sidebar</div>
          <ColorInput label="Sidebar" value={light?.sidebar} onChange={(v) => setLight((p) => ({ ...p, sidebar: v }))} />
          <ColorInput label="Sidebar Text" value={light?.sidebarForeground} onChange={(v) => setLight((p) => ({ ...p, sidebarForeground: v }))} />
          <ColorInput label="Sidebar Primary" value={light?.sidebarPrimary} onChange={(v) => setLight((p) => ({ ...p, sidebarPrimary: v }))} />
          <ColorInput label="Sidebar Primary Text" value={light?.sidebarPrimaryForeground} onChange={(v) => setLight((p) => ({ ...p, sidebarPrimaryForeground: v }))} />
          <ColorInput label="Sidebar Accent" value={light?.sidebarAccent} onChange={(v) => setLight((p) => ({ ...p, sidebarAccent: v }))} />
          <ColorInput label="Sidebar Accent Text" value={light?.sidebarAccentForeground} onChange={(v) => setLight((p) => ({ ...p, sidebarAccentForeground: v }))} />
          <ColorInput label="Sidebar Border" value={light?.sidebarBorder} onChange={(v) => setLight((p) => ({ ...p, sidebarBorder: v }))} />
          <ColorInput label="Sidebar Ring" value={light?.sidebarRing} onChange={(v) => setLight((p) => ({ ...p, sidebarRing: v }))} />
        </div>
        <div className="space-y-3 rounded border p-3">
          <div className="text-sm font-medium">Koyu Tema</div>
          <ColorInput label="Background" value={dark?.background} onChange={(v) => setDark((p) => ({ ...p, background: v }))} />
          <ColorInput label="Foreground" value={dark?.foreground} onChange={(v) => setDark((p) => ({ ...p, foreground: v }))} />
          <ColorInput label="Secondary" value={dark?.secondary} onChange={(v) => setDark((p) => ({ ...p, secondary: v }))} />
          <ColorInput label="Secondary Text" value={dark?.secondaryForeground} onChange={(v) => setDark((p) => ({ ...p, secondaryForeground: v }))} />
          <ColorInput label="Muted" value={dark?.muted} onChange={(v) => setDark((p) => ({ ...p, muted: v }))} />
          <ColorInput label="Muted Text" value={dark?.mutedForeground} onChange={(v) => setDark((p) => ({ ...p, mutedForeground: v }))} />
          <ColorInput label="Primary" value={dark?.primary} onChange={(v) => setDark((p) => ({ ...p, primary: v }))} />
          <ColorInput label="Primary Text" value={dark?.primaryForeground} onChange={(v) => setDark((p) => ({ ...p, primaryForeground: v }))} />
          <ColorInput label="Accent" value={dark?.accent} onChange={(v) => setDark((p) => ({ ...p, accent: v }))} />
          <ColorInput label="Accent Text" value={dark?.accentForeground} onChange={(v) => setDark((p) => ({ ...p, accentForeground: v }))} />
          <ColorInput label="Destructive" value={dark?.destructive} onChange={(v) => setDark((p) => ({ ...p, destructive: v }))} />
          <ColorInput label="Border" value={dark?.border} onChange={(v) => setDark((p) => ({ ...p, border: v }))} />
          <ColorInput label="Input" value={dark?.input} onChange={(v) => setDark((p) => ({ ...p, input: v }))} />
          <ColorInput label="Ring" value={dark?.ring} onChange={(v) => setDark((p) => ({ ...p, ring: v }))} />
          <div className="text-sm font-medium mt-2">Sidebar</div>
          <ColorInput label="Sidebar" value={dark?.sidebar} onChange={(v) => setDark((p) => ({ ...p, sidebar: v }))} />
          <ColorInput label="Sidebar Text" value={dark?.sidebarForeground} onChange={(v) => setDark((p) => ({ ...p, sidebarForeground: v }))} />
          <ColorInput label="Sidebar Primary" value={dark?.sidebarPrimary} onChange={(v) => setDark((p) => ({ ...p, sidebarPrimary: v }))} />
          <ColorInput label="Sidebar Primary Text" value={dark?.sidebarPrimaryForeground} onChange={(v) => setDark((p) => ({ ...p, sidebarPrimaryForeground: v }))} />
          <ColorInput label="Sidebar Accent" value={dark?.sidebarAccent} onChange={(v) => setDark((p) => ({ ...p, sidebarAccent: v }))} />
          <ColorInput label="Sidebar Accent Text" value={dark?.sidebarAccentForeground} onChange={(v) => setDark((p) => ({ ...p, sidebarAccentForeground: v }))} />
          <ColorInput label="Sidebar Border" value={dark?.sidebarBorder} onChange={(v) => setDark((p) => ({ ...p, sidebarBorder: v }))} />
          <ColorInput label="Sidebar Ring" value={dark?.sidebarRing} onChange={(v) => setDark((p) => ({ ...p, sidebarRing: v }))} />
        </div>
      </div>
      <div className="space-y-3 rounded border p-3">
        <div className="text-sm font-medium">Geçiş (Transition)</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={transitionEnabled} onChange={(e) => setTransitionEnabled(e.target.checked)} />
          Etkin
        </label>
        {/* Ön ayarlar: Süre */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-40 text-muted-foreground">Süre (ön ayar)</span>
          {[{l:'Kısa',v:150},{l:'Orta',v:250},{l:'Uzun',v:400}].map(p => (
            <button key={p.v}
              type="button"
              onClick={() => setTransitionDuration(p.v)}
              className={`rounded border px-2 py-1 ${transitionDuration===p.v? 'bg-accent' : ''}`}
            >{p.l}</button>
          ))}
        </div>
        {/* Ön ayarlar: Easing */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-40 text-muted-foreground">Easing</span>
          {['ease-in-out','ease-out','ease-in','linear'].map(ez => (
            <button key={ez}
              type="button"
              onClick={() => setTransitionEasing(ez)}
              className={`rounded border px-2 py-1 ${transitionEasing===ez? 'bg-accent' : ''}`}
            >{ez}</button>
          ))}
        </div>
        {/* Canlı Geçiş Önizleme */}
        <div className="mt-2">
          <div className={`mb-2 rounded-md border p-3 text-sm flex items-center justify-between ${demoOn? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}
            style={{ transition: `background-color ${transitionDuration}ms ${transitionEasing}, color ${transitionDuration}ms ${transitionEasing}, border-color ${transitionDuration}ms ${transitionEasing}` }}
          >
            <span>Geçiş önizleme kutusu</span>
            <Button size="sm" variant={demoOn? 'outline' : 'default'} onClick={() => setDemoOn(v => !v)}>Test Et</Button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="w-40 text-muted-foreground">Süre (ms)</span>
          <input type="number" min={0} max={3000} value={transitionDuration} onChange={(e) => setTransitionDuration(Number(e.target.value))} className="h-8 w-28 rounded border px-2 text-xs" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="w-40 text-muted-foreground">Easing</span>
          <select value={transitionEasing} onChange={(e) => setTransitionEasing(e.target.value)} className="h-8 rounded border px-2 text-xs">
            <option value="ease-in-out">ease-in-out</option>
            <option value="ease-out">ease-out</option>
            <option value="ease-in">ease-in</option>
            <option value="linear">linear</option>
          </select>
        </label>
      </div>

      {/* Canlı Önizleme */}
      <div className="space-y-3 rounded border p-3">
        <div className="text-sm font-medium">Önizleme</div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kart Başlığı</CardTitle>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Folder className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Bu bir kart gövdesi. Temanızın arka plan ve yazı rengi burada görünür.</div>
              <div className="flex items-center gap-2">
                <Badge>Etiket</Badge>
                <Badge variant="secondary">İkincil</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="outline">Outline</Button>
                <Button size="sm" variant="destructive">Danger</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Form Örneği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Takvim • {new Date().toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Kullanıcı • Önizleme</span>
              </div>
              <Input placeholder="Bir şeyler yazın..." />
              <div className="flex items-center gap-2">
                <Button size="sm">Kaydet</Button>
                <Button size="sm" variant="outline">İptal</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sekmeler</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="one" className="space-y-3">
                <TabsList>
                  <TabsTrigger value="one">Bir</TabsTrigger>
                  <TabsTrigger value="two">İki</TabsTrigger>
                </TabsList>
                <TabsContent value="one" className="text-sm text-muted-foreground">
                  İlk sekme içeriği. Accent ve ring renkleri burada da uygulanır.
                </TabsContent>
                <TabsContent value="two" className="text-sm text-muted-foreground">
                  İkinci sekme içeriği.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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



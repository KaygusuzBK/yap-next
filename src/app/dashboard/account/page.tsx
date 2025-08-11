"use client";

import * as React from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { saveUserPrefs, getUserPrefs, updateProfileName, changePassword, type UserPrefs, generateToken } from '@/lib/services/account'
import ThemeCustomizer from '@/components/theme/ThemeCustomizer'

export default function AccountPage() {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Kullanıcı'
  const email = user?.email || '—'
  const [newName, setNewName] = React.useState(name)
  const [pwd, setPwd] = React.useState('')
  const [prefs, setPrefs] = React.useState<UserPrefs>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const p = await getUserPrefs().catch(() => ({} as UserPrefs))
      setPrefs(p)
    })()
  }, [])
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <DashboardHeader
        title="Hesap"
        backHref="/dashboard"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Hesap' }]}
      />
      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center justify-between py-2 border-b gap-4">
              <div className="text-muted-foreground">Ad Soyad</div>
              <div className="flex items-center gap-2">
                <Input className="h-8 w-64" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Button size="sm" onClick={async () => { setSaving(true); try { await updateProfileName(newName.trim()); } finally { setSaving(false) } }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="text-muted-foreground">E-posta</div>
              <div>{email}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tema Özelleştirme</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeCustomizer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Güvenlik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input type="password" placeholder="Yeni parola" className="h-8 w-64" value={pwd} onChange={(e) => setPwd(e.target.value)} />
              <Button size="sm" onClick={async () => { if (!pwd.trim()) return; setSaving(true); try { await changePassword(pwd.trim()); setPwd('') } finally { setSaving(false) } }}>{saving ? 'Kaydediliyor...' : 'Parolayı Güncelle'}</Button>
            </div>
            <div className="text-xs text-muted-foreground">2FA (yakında)</div>
            <div className="text-xs text-muted-foreground">Aktif oturumlar (yakında)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tercihler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Dil</div>
                <Select value={prefs.general?.language || ''} onValueChange={(v) => setPrefs((p) => ({ ...p, general: { ...p.general, language: v } }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {['tr','en','de','es','fr','ar','zh-CN'].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Saat dilimi</div>
                <Select value={prefs.general?.timezone || ''} onValueChange={(v) => setPrefs((p) => ({ ...p, general: { ...p.general, timezone: v } }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Europe/Istanbul','UTC','Europe/Berlin','America/New_York','Asia/Dubai','Asia/Shanghai'].map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Açılış</div>
                <Select value={prefs.general?.defaultLanding || '/dashboard'} onValueChange={(v: '/dashboard' | '/dashboard#projects' | '/dashboard#tasks') => setPrefs((p) => ({ ...p, general: { ...p.general, defaultLanding: v } }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/dashboard">Dashboard</SelectItem>
                    <SelectItem value="/dashboard#projects">Projeler</SelectItem>
                    <SelectItem value="/dashboard#tasks">Görevler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Mention DM</div>
                  <Switch checked={Boolean(prefs.notifications?.mentionDm ?? true)} onCheckedChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...p.notifications, mentionDm: Boolean(v) } }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">E-posta özeti</div>
                <Select value={prefs.notifications?.emailDigest || 'off'} onValueChange={(v: 'off' | 'daily' | 'weekly') => setPrefs((p) => ({ ...p, notifications: { ...p.notifications, emailDigest: v } }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Kapalı</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Geçiş Süresi</div>
                <div className="px-1">
                  <Slider min={0} max={1000} step={50} value={[200]} onValueChange={() => {}} />
                </div>
              </div>
            </div>
            <div>
              <Button size="sm" onClick={async () => { setSaving(true); try { await saveUserPrefs(prefs) } finally { setSaving(false) } }}>{saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geliştirici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Tabs defaultValue="tokens" className="space-y-2">
              <TabsList>
                <TabsTrigger value="tokens">API Token</TabsTrigger>
                <TabsTrigger value="webhooks">Webhook</TabsTrigger>
              </TabsList>
              <TabsContent value="tokens" className="space-y-2">
                <Button size="sm" onClick={() => setPrefs((p) => ({ ...p, api_tokens: [...(p.api_tokens || []), generateToken('Yeni token')] }))}>Token Oluştur</Button>
                <div className="text-xs text-muted-foreground">Tokenlar kaydet dediğinizde profilinize yazılır.</div>
              </TabsContent>
              <TabsContent value="webhooks" className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="https://example.com/webhook" className="h-8" onBlur={(e) => {
                    const url = e.target.value.trim(); if (!url) return
                    setPrefs((p) => ({ ...p, webhooks: [...(p.webhooks || []), { id: crypto.randomUUID(), url, events: ['task.created'] }] }))
                    e.currentTarget.value = ''
                  }} />
                </div>
                <div className="text-xs text-muted-foreground">Kutudan çıkınca eklenir.</div>
              </TabsContent>
            </Tabs>
            <div>
              <Button size="sm" onClick={async () => { setSaving(true); try { await saveUserPrefs(prefs) } finally { setSaving(false) } }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veri ve Tehlikeli Alan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { /* TODO: export user's data as JSON */ }}>Verileri Dışa Aktar (JSON)</Button>
              <Button size="sm" variant="outline" onClick={() => { /* TODO: export CSV */ }}>CSV</Button>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="destructive" onClick={() => { if (confirm('Hesabı kalıcı olarak silmek istiyor musunuz?')) { /* TODO: call delete endpoint */ } }}>Hesabı Sil</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



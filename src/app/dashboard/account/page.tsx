"use client";

import { useAuth } from '@/components/auth/AuthProvider'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeCustomizer from '@/components/theme/ThemeCustomizer'

export default function AccountPage() {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Kullanıcı'
  const email = user?.email || '—'
  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-muted-foreground">Ad Soyad</div>
              <div>{name}</div>
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
      </div>
    </div>
  )
}



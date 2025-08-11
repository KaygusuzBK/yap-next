"use client";

import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UpgradePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <DashboardHeader
        title="Pro'ya Yükselt"
        backHref="/dashboard"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: "Pro'ya Yükselt" }]}
      />
      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pro Plan Avantajları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-6 space-y-1">
              <li>Sınırsız proje ve takım</li>
              <li>Gelişmiş raporlama ve filtreleme</li>
              <li>Özel Slack entegrasyonları</li>
              <li>Öncelikli destek</li>
            </ul>
            <Button className="mt-2">Satın al</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



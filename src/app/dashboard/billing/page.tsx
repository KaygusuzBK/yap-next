"use client";

import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BillingPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <DashboardHeader
        title="Faturalandırma"
        backHref="/dashboard"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Faturalandırma' }]}
      />
      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>Mevcut plan</div>
              <div className="font-medium">Ücretsiz</div>
            </div>
            <div className="flex items-center justify-between">
              <div>Kullanım</div>
              <div className="text-muted-foreground">Normal</div>
            </div>
            <Button className="mt-2" onClick={() => window.location.assign('/dashboard/upgrade')}>Pro&apos;ya Yükselt</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


